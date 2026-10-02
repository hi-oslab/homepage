'use client'

import classNames from 'classnames'
import { motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Member } from '@/types/cms'
import { MemberModal } from './MemberModal'
import { ProfileImage } from '@/components/ProfileImage'

/*
 * 평면 보로노이 멤버 맵
 * - 멤버 자리를 고르게 흩뿌리고, 화면을 "가장 가까운 멤버" 기준으로 나눠 셀을 만든다
 * - 셀은 화면에 그리지 않고, 멤버 근처 어디서든 반응하는 hover/클릭 영역으로만 쓴다
 * - 모든 멤버가 같은 크기로 보인다 (깊이 없음)
 */

type Point = { x: number; y: number }
type Size = { width: number; height: number }

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

/** 이미 놓인 자리와 가장 멀리 떨어진 후보를 고르는 방식(best candidate)으로 고르게 흩뿌린다 */
function sites(members: Member[], size: Size, margin: Point): Point[] {
  const placed: Point[] = []
  for (const member of members) {
    const random = seeded(member.id)
    let best: Point & { gap: number } = { x: size.width / 2, y: size.height / 2, gap: -1 }
    for (let attempt = 0; attempt < 40; attempt += 1) {
      const x = margin.x + random() * (size.width - margin.x * 2)
      const y = margin.y + random() * (size.height - margin.y * 2)
      const gap = placed.length ? Math.min(...placed.map((p) => Math.hypot(p.x - x, p.y - y))) : Infinity
      if (gap > best.gap) best = { x, y, gap }
      if (gap === Infinity) break
    }
    placed.push({ x: best.x, y: best.y })
  }
  return placed
}

/** 볼록 다각형을 반평면(점 p가 site 쪽에 있는 영역)으로 자른다 */
function clip(polygon: Point[], site: Point, other: Point): Point[] {
  const mid = { x: (site.x + other.x) / 2, y: (site.y + other.y) / 2 }
  const normal = { x: other.x - site.x, y: other.y - site.y }
  const side = (p: Point) => (p.x - mid.x) * normal.x + (p.y - mid.y) * normal.y
  const result: Point[] = []
  polygon.forEach((current, i) => {
    const next = polygon[(i + 1) % polygon.length]
    const a = side(current)
    const b = side(next)
    if (a <= 0) result.push(current)
    if (a <= 0 !== b <= 0) {
      const t = a / (a - b)
      result.push({ x: current.x + (next.x - current.x) * t, y: current.y + (next.y - current.y) * t })
    }
  })
  return result
}

/** 각 멤버의 보로노이 셀 (화면 사각형을 다른 멤버와의 수직이등분선으로 잘라낸다) */
function voronoi(points: Point[], size: Size): Point[][] {
  const bounds: Point[] = [
    { x: 0, y: 0 },
    { x: size.width, y: 0 },
    { x: size.width, y: size.height },
    { x: 0, y: size.height },
  ]
  return points.map((site, i) =>
    points.reduce((cell, other, j) => (i === j || cell.length < 3 ? cell : clip(cell, site, other)), bounds),
  )
}

/** 셀을 site 쪽으로 살짝 줄이고, 모서리를 둥글게 한 SVG path */
function bubblePath(cell: Point[], site: Point, shrink: number, radius: number) {
  const points = cell.map((p) => ({ x: site.x + (p.x - site.x) * shrink, y: site.y + (p.y - site.y) * shrink }))
  const n = points.length
  if (n < 3) return ''
  const toward = (from: Point, to: Point, distance: number) => {
    const length = Math.hypot(to.x - from.x, to.y - from.y) || 1
    const d = Math.min(distance, length / 2)
    return { x: from.x + ((to.x - from.x) / length) * d, y: from.y + ((to.y - from.y) / length) * d }
  }
  let path = ''
  points.forEach((vertex, i) => {
    const prev = points[(i - 1 + n) % n]
    const next = points[(i + 1) % n]
    const start = toward(vertex, prev, radius)
    const end = toward(vertex, next, radius)
    path += `${i === 0 ? 'M' : 'L'}${start.x.toFixed(1)},${start.y.toFixed(1)} Q${vertex.x.toFixed(1)},${vertex.y.toFixed(1)} ${end.x.toFixed(1)},${end.y.toFixed(1)} `
  })
  return `${path}Z`
}

export function MemberVoronoi({ members }: { members: Member[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(800)
  const [hovered, setHovered] = useState<string | null>(null)
  const [selected, setSelected] = useState<Member | null>(null)

  useEffect(() => {
    const element = containerRef.current
    if (!element) return
    const update = () => {
      setWidth(element.clientWidth)
      setViewportHeight(window.innerHeight)
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const mobile = width < 640
  // 멤버당 면적을 잡아 높이를 정한다 (모바일은 폭이 좁아 세로로 길어진다)
  const size = useMemo<Size>(() => {
    const areaPerMember = mobile ? 62000 : 95000
    return {
      width,
      height: Math.round(Math.max(viewportHeight * 0.8, (members.length * areaPerMember) / Math.max(width, 1))),
    }
  }, [members.length, mobile, viewportHeight, width])

  const margin = { x: mobile ? 70 : 110, y: mobile ? 90 : 100 }
  const points = useMemo(() => (width ? sites(members, size, margin) : []), [members, size, width]) // eslint-disable-line react-hooks/exhaustive-deps
  const cells = useMemo(() => (points.length ? voronoi(points, size) : []), [points, size])
  const photo = mobile ? 60 : 76

  return (
    <section aria-label='멤버 맵' className='relative -mx-4 md:-mx-8'>
      <div
        ref={containerRef}
        className='relative w-full overflow-hidden'
        style={{ height: width ? size.height : '80dvh' }}
      >
        {width > 0 && (
          <>
            {/* 셀: 화면에는 보이지 않는 hover/클릭 영역 (멤버 근처 어디든 반응) */}
            <svg width={size.width} height={size.height} className='absolute inset-0' aria-hidden>
              {cells.map((cell, index) => {
                const member = members[index]
                return (
                  <path
                    key={member.id}
                    d={bubblePath(cell, points[index], 1, 0)}
                    onPointerEnter={() => setHovered(member.id)}
                    onPointerLeave={() => setHovered((current) => (current === member.id ? null : current))}
                    onClick={() => setSelected(member)}
                    className='cursor-pointer fill-transparent stroke-none'
                    // 투명해도 마우스를 받도록
                    style={{ pointerEvents: 'all' }}
                  />
                )
              })}
            </svg>

            {/* 멤버 (사진 + 이름) */}
            {members.map((member, index) => {
              const point = points[index]
              const active = hovered === member.id
              return (
                <motion.button
                  key={member.id}
                  type='button'
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index + 0.1, duration: 0.5 }}
                  onPointerEnter={() => setHovered(member.id)}
                  onPointerLeave={() => setHovered((current) => (current === member.id ? null : current))}
                  onFocus={() => setHovered(member.id)}
                  onBlur={() => setHovered(null)}
                  onClick={() => setSelected(member)}
                  className='absolute flex -translate-x-1/2 flex-col items-center gap-2 text-center'
                  style={{ left: point.x, top: point.y - photo / 2 - (mobile ? 30 : 40) }}
                  aria-label={`${member.name} 소개 보기`}
                >
                  <span
                    className={classNames(
                      'whitespace-nowrap font-medium leading-none transition-colors',
                      mobile ? 'text-xl' : 'text-3xl',
                      active ? 'text-ink' : 'text-ink/85',
                    )}
                  >
                    {member.name}
                  </span>
                  {/* 투명 PNG 아이콘 모양 그대로 + 모양을 따라 그림자 */}
                  <span
                    className='block transition-transform duration-300'
                    style={{ width: photo, height: photo, transform: active ? 'scale(1.08)' : undefined }}
                  >
                    <ProfileImage
                      src={member.cover_image_url}
                      name={member.name}
                      className='size-full text-xl'
                      imageClassName='pointer-events-none'
                    />
                  </span>
                  {/* 마우스를 올리면 역할·한 줄 소개와 "소개 보기" */}
                  <span
                    className={classNames(
                      'flex flex-col items-center gap-1.5 transition-opacity duration-200',
                      active ? 'opacity-100' : 'pointer-events-none opacity-0',
                    )}
                  >
                    <span className='max-w-48 break-keep text-xs leading-snug text-mute'>
                      {[member.role, member.sub_name].filter(Boolean).join(' · ')}
                    </span>
                    <span className='rounded-full bg-ink px-3 py-1 text-xs text-paper'>소개 보기 ↗</span>
                  </span>
                </motion.button>
              )
            })}
          </>
        )}
      </div>

      {/* 맵은 브라우저에서만 그리므로, 검색엔진·스크린리더용 목록을 따로 둔다 */}
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
