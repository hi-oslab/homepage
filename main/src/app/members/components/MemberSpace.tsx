'use client'

import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Member } from '@/types/cms'
import { MemberModal } from './MemberModal'
import { ProfileImage } from '@/components/ProfileImage'

/*
 * 스크롤 줌인 멤버 공간 (CSS 3D)
 * - 화면에 고정된 원근 공간 안에 프로필(정사각형)을 무작위 위치/깊이에 흩뿌린다
 * - 스크롤할수록 카메라가 앞으로 나아가며 앞쪽 프로필부터 커지면서 지나간다
 * - 처음 화면에서 모든 프로필이 화면 안에 들어오도록 깊이에 맞춰 x/y 범위를 계산한다
 */

const PERSPECTIVE = 1000 // px, 카메라와 화면 사이 거리
const NEAREST = -200 // 가장 앞 프로필의 깊이
const FARTHEST = -2200 // 가장 뒤 프로필의 깊이 (너무 멀면 작고 흐려진다)
// 스크롤이 끝날 때 가장 뒤 프로필까지 카메라를 지나가게
const TRAVEL = -FARTHEST + PERSPECTIVE * 0.9

// 멤버 id로 시드를 잡아 새로고침해도 같은 자리에 오게 한다
function seeded(seed: string) {
  let h = 2166136261
  for (let i = 0; i < seed.length; i += 1) h = Math.imul(h ^ seed.charCodeAt(i), 16777619)
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return ((h ^= h >>> 16) >>> 0) / 4294967296
  }
}

type Placement = { x: number; y: number; z: number }
type Stage = { width: number; height: number }

/**
 * 깊이는 멤버 순서대로 고르게 나누고(한 명씩 지나가도록) 약간 흔든다.
 * x/y는 처음 화면(카메라 0)에서 화면 안에 들어오는 범위 안에서, 이미 놓인 프로필과
 * 화면상 간격이 가장 넓은 후보를 고른다 (겹침 방지).
 */
function placements(members: Member[], stage: Stage, tile: number): Placement[] {
  const span = FARTHEST - NEAREST
  const placed: { sx: number; sy: number; size: number }[] = []

  return members.map((member, index) => {
    const random = seeded(member.id)
    const t = members.length === 1 ? 0.5 : index / (members.length - 1)
    const z = NEAREST + span * t + (random() - 0.5) * (span / Math.max(members.length, 4)) * 0.6
    // 이 깊이에서의 원근 배율과, 화면 안에 들어오는 x/y 범위
    const scale = PERSPECTIVE / (PERSPECTIVE - z)
    const halfW = Math.max(0, (stage.width / 2 - tile * scale * 0.6) / scale)
    const halfH = Math.max(0, (stage.height / 2 - tile * scale * 0.75) / scale)
    const size = tile * scale

    let best = { x: 0, y: 0, gap: -Infinity }
    for (let attempt = 0; attempt < 40; attempt += 1) {
      const x = (random() * 2 - 1) * halfW * 0.95
      const y = (random() * 2 - 1) * halfH * 0.9
      const gap = placed.length
        ? Math.min(
            ...placed.map((other) => Math.hypot(x * scale - other.sx, y * scale - other.sy) - (size + other.size) / 2),
          )
        : Infinity
      if (gap > best.gap) best = { x, y, gap }
      if (gap === Infinity) break
    }
    placed.push({ sx: best.x * scale, sy: best.y * scale, size })
    return { x: best.x, y: best.y, z }
  })
}

export function MemberSpace({ members }: { members: Member[] }) {
  const sectionRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const [stage, setStage] = useState({ width: 0, height: 0 })
  const [selected, setSelected] = useState<Member | null>(null)
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] })
  const camera = useTransform(scrollYProgress, [0, 1], [0, TRAVEL])

  useEffect(() => {
    const element = stageRef.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) =>
      setStage({ width: entry.contentRect.width, height: entry.contentRect.height }),
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  // 화면 크기에 맞춘 프로필 크기
  const tile = stage.width < 640 ? 130 : stage.width < 1024 ? 170 : 220
  const layout = useMemo(() => placements(members, stage, tile), [members, stage, tile])

  return (
    // 멤버 수만큼 스크롤 길이를 늘려 한 명씩 천천히 지나가게
    <section
      ref={sectionRef}
      aria-label='멤버 공간'
      style={{ height: `${160 + members.length * 45}dvh` }}
      className='relative -mx-4 md:-mx-8'
    >
      <div
        ref={stageRef}
        className='sticky top-header h-[calc(100dvh-var(--spacing-header))] w-full overflow-hidden'
        style={{ perspective: `${PERSPECTIVE}px`, perspectiveOrigin: '50% 50%' }}
      >
        <div className='absolute top-1/2 left-1/2' style={{ transformStyle: 'preserve-3d' }}>
          {stage.width > 0 &&
            members.map((member, index) => (
              <Tile
                key={member.id}
                member={member}
                placement={layout[index]}
                tile={tile}
                camera={camera}
                onSelect={() => setSelected(member)}
              />
            ))}
        </div>

        <p className='pointer-events-none absolute top-4 right-4 font-mono text-[11px] text-mute md:top-6 md:right-8'>
          scroll to explore · click to open
        </p>
      </div>

      {/* 3D 공간은 브라우저에서만 그리므로, 검색엔진·스크린리더용 목록을 따로 둔다 */}
      <ul className='sr-only'>
        {members.map((member) => (
          <li key={member.id}>
            {member.name}
            {member.role && `, ${member.role}`}
            {member.sub_name && ` — ${member.sub_name}`}
            {member.description && `. ${member.description}`}
          </li>
        ))}
      </ul>

      <MemberModal member={selected} onClose={() => setSelected(null)} />
    </section>
  )
}

function Tile({
  member,
  placement,
  tile,
  camera,
  onSelect,
}: {
  member: Member
  placement: Placement
  tile: number
  camera: MotionValue<number>
  onSelect: () => void
}) {
  const { x, y, z } = placement

  const depth = useTransform(camera, (cam) => z + cam)
  const transform = useTransform(depth, (d) => `translate3d(${x}px, ${y}px, ${d}px) translate(-50%, -50%)`)
  // 멀리서 서서히 나타나고, 카메라에 가까워지면 사라진다
  const opacity = useTransform(
    depth,
    [FARTHEST - 600, FARTHEST + 200, PERSPECTIVE * 0.45, PERSPECTIVE * 0.8],
    [0, 1, 1, 0],
  )
  const pointerEvents = useTransform(opacity, (value) => (value < 0.2 ? 'none' : 'auto'))

  return (
    <motion.button
      type='button'
      onClick={onSelect}
      style={{ transform, opacity, pointerEvents, width: tile }}
      className='group absolute top-0 left-0 flex flex-col items-start gap-1.5 text-left'
      aria-label={`${member.name} 소개 보기`}
    >
      {/* 투명 PNG 아이콘 모양 그대로 + 모양을 따라 그림자 */}
      <ProfileImage
        src={member.cover_image_url}
        name={member.name}
        className='aspect-square w-full p-[6%] text-3xl'
        imageClassName='pointer-events-none transition-transform duration-500 group-hover:scale-105'
      />
      <span className='flex w-full items-baseline justify-between gap-2 text-[11px] leading-tight md:text-xs'>
        <span className='truncate font-medium text-ink'>{member.name}</span>
        {member.role && <span className='shrink-0 truncate text-mute'>{member.role}</span>}
      </span>
    </motion.button>
  )
}
