'use client'

import { Html, OrbitControls, Sparkles, Stars } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState, type ElementRef } from 'react'
import { GoArrowUpRight, GoDash, GoPlus, GoScreenFull, GoX } from 'react-icons/go'
import { AdditiveBlending, BufferAttribute, BufferGeometry, type Group, type PerspectiveCamera } from 'three'
import { ProfileImage } from '@/components/ProfileImage'
import type { Member } from '@/types/cms'
import type { GalaxyEdge, GalaxyLayout, Vec3 } from './galaxyLayout'

/*
 * Members 3D 씬 (헤더 아래 화면 전체, 검은 우주)
 * - 배치는 서버에서 galaxyLayout으로 계산. 분야가 겹치는 사람끼리 흰 선으로 잇는다
 * - 시작: 카메라가 멀리서 날아 들어오고, 가운데 모여 있던 프로필이 퍼진다. 그 뒤로는 저마다 천천히 떠다닌다
 * - 조작: 드래그 회전 · 휠/핀치 줌(페이지 스크롤 없음). 가장 멀어져도 전체가 화면에 딱 들어온다
 * - 프로필을 누르면 왼쪽(모바일은 아래)에 프로필 섹션이 열려 반반이 되고, 빈 곳 클릭 · 닫기 · Esc로 다시 씬 전체
 * - 깊이감: 별 · 먼지 입자, 멀리 있는 프로필 · 선은 흐려진다
 */

/** drei OrbitControls가 돌려주는 컨트롤 (maxDistance · update 등) */
type OrbitControlsImpl = ElementRef<typeof OrbitControls>

const FOV = 40
/** 퍼지는 모션(초), 멤버마다 어긋나는 출발, 카메라가 날아 들어오는 시간 */
const INTRO = 2
const INTRO_STAGGER = 0.5
const FLY_IN = 2.6
/** 프로필 DOM 기준 크기(px). 화면 크기는 Html distanceFactor로 월드 크기에 맞춘다 */
const CARD_PX = 120
/** 떠다니는 폭 (프로필 크기에 곱한다) */
const DRIFT = 0.18

const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t))
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

/** 반지름 radius인 구가 화면 가로 · 세로 모두에 들어오는 카메라 거리 */
function fitDistance(radius: number, width: number, height: number) {
  const vertical = (FOV * Math.PI) / 180
  const horizontal = 2 * Math.atan(Math.tan(vertical / 2) * (width / Math.max(height, 1)))
  return (radius / Math.sin(Math.min(vertical, horizontal) / 2)) * 1.06
}

/** 프로필 섹션이 차지하는 비율: 넓은 화면은 오른쪽 절반, 좁은 화면은 아래 45% */
const PANEL_SHARE = { side: 0.5, bottom: 0.45 }
/** 섹션이 밀려 들어오는 곡선 · 시간 (씬 쪽 카메라도 같은 속도로 따라간다) */
const PANEL_EASE = 'cubic-bezier(0.16,1,0.3,1)'
const PANEL_MS = 700

/** 부모(줌 버튼)와 씬이 함께 쓰는 값: 지금 화면에 전체가 들어오는 카메라 거리 */
type ViewState = { fit: number }

export default function MemberGalaxy({ members, layout }: { members: Member[]; layout: GalaxyLayout }) {
  // 누른 프로필: 오른쪽(모바일은 아래) 섹션에 보여주고 씬은 남은 칸으로. 없으면 씬이 화면 전체
  const [selected, setSelected] = useState<number | null>(null)
  const controls = useRef<OrbitControlsImpl>(null)
  const view = useRef<ViewState>({ fit: 0 })
  const open = selected !== null
  // 닫히는 동안에도 내용이 먼저 사라지지 않도록 마지막 멤버를 들고 있는다
  const lastMember = useRef<Member | null>(null)
  if (selected !== null) lastMember.current = members[selected]
  const shown = lastMember.current

  // 넓은 화면(md 이상): 오른쪽 섹션, 좁은 화면: 아래 섹션
  const [side, setSide] = useState(true)
  useEffect(() => {
    const query = window.matchMedia('(min-width: 48rem)')
    const update = () => setSide(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  const zoom = (factor: number | 'fit') => {
    const control = controls.current
    if (!control) return
    const camera = control.object as PerspectiveCamera
    const fit = view.current.fit
    const distance = factor === 'fit' ? fit : camera.position.length() * factor
    camera.position.setLength(Math.min(fit, Math.max(control.minDistance, distance)))
    control.update()
  }

  // Esc로 닫기
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && setSelected(null)
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  // 씬의 빈 곳을 '클릭'하면 닫는다 (드래그로 돌린 건 클릭이 아니다)
  const down = useRef<{ x: number; y: number } | null>(null)
  const onScenePointerDown = (event: React.PointerEvent) => {
    down.current = { x: event.clientX, y: event.clientY }
  }
  const onSceneClick = (event: React.MouseEvent) => {
    const start = down.current
    const moved = start ? Math.hypot(event.clientX - start.x, event.clientY - start.y) : 0
    if (moved < 5 && event.target instanceof HTMLCanvasElement) setSelected(null)
  }

  const transition = { transitionDuration: `${PANEL_MS}ms`, transitionTimingFunction: PANEL_EASE }

  return (
    /*
     * 씬(캔버스)은 늘 화면 전체 크기 그대로 두고, 프로필 섹션은 오른쪽(모바일은 아래)에서 밀려 들어온다.
     * 같은 순간 씬은 카메라 시야를 옮겨 남은 칸의 가운데로 온다 → 줄어들고 늘어나는 게 동시에 일어난다.
     */
    <section
      className='fixed inset-x-0 top-header bottom-0 z-40 overflow-hidden bg-black text-white select-none'
      aria-label='멤버 공간'
    >
      {/* isolate: 씬 속 프로필(HTML)이 아무리 앞에 있어도 프로필 섹션보다 위로 올라오지 않게 */}
      <div className='absolute inset-0 isolate' onPointerDown={onScenePointerDown} onClick={onSceneClick}>
        <Canvas camera={{ fov: FOV, position: [0, 0, 120], near: 0.1, far: 800 }} gl={{ antialias: true }} dpr={[1, 2]}>
          <color attach='background' args={['#000000']} />
          <Scene
            members={members}
            layout={layout}
            controls={controls}
            view={view}
            selected={selected}
            panel={open ? (side ? PANEL_SHARE.side : PANEL_SHARE.bottom) : 0}
            side={side}
            onSelect={(index) => setSelected((current) => (current === index ? null : index))}
          />
        </Canvas>

        {/* 가장자리를 어둡게: 씬에 들어온 듯한 깊이 */}
        <div
          aria-hidden
          className='pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.85)_100%)]'
        />

        {/* 제목 (프로필을 열면 비켜 준다) */}
        <header
          className={`pointer-events-none absolute top-5 left-4 flex flex-col gap-3 transition-opacity duration-500 md:top-8 md:left-8 ${
            open ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <span className='font-mono text-[11px] tracking-[0.2em] text-white/40 uppercase'>We are OSL creators</span>
          <h1 className='flex items-start gap-2 text-5xl leading-[0.85] font-medium tracking-[-0.05em] md:text-7xl'>
            Members
            <sup className='mt-[0.35em] text-sm font-normal tracking-normal text-white/40 md:text-base'>
              ({String(members.length).padStart(2, '0')})
            </sup>
          </h1>
          <p className='max-w-xs text-sm leading-relaxed break-keep text-white/50'>
            디자인, 개발, 사운드, 공간을 넘나드는 사람들. 같은 분야를 가진 멤버끼리 가까이, 선으로 이어져 있어요.
          </p>
        </header>

        {/* 조작 안내 (섹션이 올라오는 모바일에서는 섹션 위로 비킨다) */}
        <p
          className={`pointer-events-none absolute left-4 font-mono text-[10px] tracking-[0.18em] text-white/35 uppercase transition-[bottom] md:bottom-8 md:left-8 ${
            open ? 'bottom-[calc(45%+1rem)]' : 'bottom-4'
          }`}
          style={transition}
        >
          <span className='md:hidden'>Drag · Pinch · Tap</span>
          <span className='hidden md:inline'>Drag — orbit · Scroll — zoom · Click — profile</span>
        </p>
        {/* 줌 (섹션이 열리면 남은 씬 칸의 오른쪽 아래로 함께 옮겨 간다) */}
        <div
          className={`absolute flex flex-col gap-1.5 transition-[right,bottom] ${
            open
              ? 'right-4 bottom-[calc(45%+1rem)] md:right-[calc(50%+2rem)] md:bottom-8'
              : 'right-4 bottom-4 md:right-8 md:bottom-8'
          }`}
          style={transition}
        >
          {[
            { label: '가까이', icon: GoPlus, action: () => zoom(0.75) },
            { label: '멀리', icon: GoDash, action: () => zoom(1.33) },
            { label: '전체 보기', icon: GoScreenFull, action: () => zoom('fit') },
          ].map(({ label, icon: Icon, action }) => (
            <button
              key={label}
              type='button'
              onClick={action}
              aria-label={label}
              title={label}
              className='flex size-9 items-center justify-center rounded-full bg-white/[0.06] text-white/70 ring-1 ring-white/15 backdrop-blur transition-colors hover:bg-white/15 hover:text-white'
            >
              <Icon size={14} />
            </button>
          ))}
        </div>
      </div>

      {/* 프로필 섹션: 오른쪽 절반(모바일은 아래 45%)에서 밀려 들어온다. 크기는 그대로라 글자가 다시 흐르지 않는다 */}
      <aside
        className={`absolute inset-x-0 bottom-0 h-[45%] overflow-hidden border-t border-white/10 bg-[#0a0a0a] transition-transform md:inset-y-0 md:right-0 md:left-auto md:h-auto md:w-1/2 md:border-t-0 md:border-l ${
          open ? 'translate-x-0 translate-y-0' : 'translate-y-full md:translate-x-full md:translate-y-0'
        }`}
        style={{ ...PANEL_COLORS, ...transition }}
        aria-hidden={!open}
        inert={!open}
      >
        <AnimatePresence mode='wait' initial={false}>
          {shown && (
            <motion.div
              key={shown.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className='absolute inset-0 overflow-y-auto select-text'
            >
              <ProfilePanel member={shown} onClose={() => setSelected(null)} />
            </motion.div>
          )}
        </AnimatePresence>
      </aside>
    </section>
  )
}

/** 프로필 섹션 안에서만 색 토큰을 검은 버전으로 (사이트 테마는 그대로) */
const PANEL_COLORS = {
  '--color-paper': '#000000',
  '--color-ink': '#f1f1ef',
  '--color-tile': '#1f1f1f',
  '--color-mute': '#8e8e89',
} as React.CSSProperties

/**
 * 오른쪽(모바일은 아래) 프로필 섹션: 이미지 · 이름 · 역할 · 소개 · 분야 · 연락처
 * - 넓은 화면: 큰 이미지 아래로 정보를 세로로
 * - 좁은 화면: 스크롤 없이 한눈에 보이게 작은 썸네일 옆에 이름 · 역할, 나머지는 촘촘하게
 */
function ProfilePanel({ member, onClose }: { member: Member; onClose: () => void }) {
  const website = member.website && (/^https?:\/\//.test(member.website) ? member.website : `https://${member.website}`)
  return (
    <article className='relative flex min-h-full flex-col gap-4 px-4 pt-4 pb-5 md:gap-8 md:px-10 md:pt-8 md:pb-10'>
      <div className='flex items-center justify-between max-md:absolute max-md:top-3 max-md:right-3'>
        <span className='font-mono text-[11px] tracking-[0.2em] text-white/40 uppercase max-md:hidden'>Profile</span>
        <button
          type='button'
          onClick={onClose}
          aria-label='닫기'
          className='flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white/60 ring-1 ring-white/15 transition-colors hover:bg-white/10 hover:text-white'
        >
          <kbd className='hidden font-sans md:inline'>Esc</kbd>
          <GoX size={14} />
        </button>
      </div>

      {/* 모바일: 썸네일 | 이름 · 역할 · 한 줄 소개 / 넓은 화면: 큰 이미지 아래 이름 */}
      <div className='flex items-center gap-4 pr-12 md:flex-col md:items-stretch md:gap-8 md:pr-0'>
        <div className='flex size-20 shrink-0 items-center justify-center md:aspect-square md:size-auto md:w-full md:max-w-[420px] md:self-center'>
          <ProfileImage src={member.cover_image_url} name={member.name} className='size-full md:p-[6%]' />
        </div>
        <div className='flex min-w-0 flex-col gap-1 md:gap-2'>
          <div className='flex flex-wrap items-baseline gap-x-3 gap-y-0.5 md:justify-between md:gap-x-4'>
            <h2 className='text-2xl leading-none font-medium tracking-[-0.04em] md:text-5xl'>{member.name}</h2>
            {member.role && (
              <span className='font-mono text-[10px] tracking-[0.15em] text-white/50 uppercase md:text-xs'>
                {member.role}
              </span>
            )}
          </div>
          {member.sub_name && <p className='text-sm break-keep text-white/60 md:text-base'>{member.sub_name}</p>}
        </div>
      </div>

      {member.description && (
        <p className='max-w-prose text-sm leading-relaxed break-keep whitespace-pre-line text-white/80 md:text-[15px]'>
          {member.description}
        </p>
      )}

      {member.fields.length > 0 && (
        <ul className='flex flex-wrap gap-1 md:gap-1.5'>
          {member.fields.map((field) => (
            <li
              key={field}
              className='rounded-full px-2.5 py-0.5 font-mono text-[10px] tracking-[0.1em] text-white/70 uppercase ring-1 ring-white/20 md:px-3 md:py-1 md:text-[11px]'
            >
              {field}
            </li>
          ))}
        </ul>
      )}

      {(member.email || website) && (
        <div className='mt-auto flex flex-wrap gap-x-6 gap-y-2 border-t border-white/10 pt-3 text-sm md:pt-5'>
          {member.email && (
            <a
              href={`mailto:${member.email.trim()}`}
              className='inline-flex items-center gap-1 transition-colors hover:text-white/60'
            >
              Email <GoArrowUpRight size={13} />
            </a>
          )}
          {website && (
            <a
              href={website}
              target='_blank'
              rel='noopener noreferrer'
              className='inline-flex items-center gap-1 transition-colors hover:text-white/60'
            >
              Website <GoArrowUpRight size={13} />
            </a>
          )}
        </div>
      )}
    </article>
  )
}

function Scene({
  members,
  layout,
  controls,
  view,
  selected,
  panel,
  side,
  onSelect,
}: {
  members: Member[]
  layout: GalaxyLayout
  controls: React.RefObject<OrbitControlsImpl | null>
  view: React.RefObject<ViewState>
  /** 프로필 섹션에 열려 있는 멤버 */
  selected: number | null
  /** 프로필 섹션이 가린 비율 (0: 닫힘, 0.5: 오른쪽 절반, 0.45: 아래) */
  panel: number
  /** 섹션이 오른쪽(true)인지 아래(false)인지 */
  side: boolean
  onSelect: (index: number) => void
}) {
  const { size, camera } = useThree()
  const [hovered, setHovered] = useState<number | null>(null)
  // 강조: 마우스를 올린 사람, 없으면 열려 있는 사람
  const focus = hovered ?? selected
  const nodes = useRef<(Group | null)[]>([])
  const cards = useRef<(HTMLElement | null)[]>([])
  const started = useRef<number | null>(null)
  const interacted = useRef(false)
  // 전체 화면 기준 거리 (별 · 안개 크기용). 실제 카메라 거리는 섹션이 가린 만큼을 빼고 매 프레임 맞춘다
  const fit = fitDistance(layout.radius + layout.size, size.width, size.height)
  const scale = (layout.size * size.height) / CARD_PX

  // 섹션이 열린 정도(0~1)를 섹션이 밀려 들어오는 속도와 비슷하게 따라간다
  const opened = useRef(0)
  const lastFit = useRef<number | null>(null)

  // 프로필을 열면 그 사람이 앞으로 오도록 카메라를 천천히 돌린다 (사용자가 직접 돌리면 멈춤)
  const focusing = useRef(false)
  useEffect(() => {
    focusing.current = selected !== null
  }, [selected])

  // 선: 버퍼를 한 번 만들어 두고 매 프레임 위치만 고쳐 쓴다 (모든 선 / 강조한 사람의 선)
  const current = useRef(layout.positions.map(() => [0, 0, 0] as Vec3))
  const allLines = useMemo(() => {
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(layout.edges.length * 6), 3))
    return geometry
  }, [layout.edges])
  const focusEdges = useMemo(
    () => (focus === null ? [] : layout.edges.filter((edge) => edge.a === focus || edge.b === focus)),
    [focus, layout.edges],
  )
  const focusLines = useMemo(() => {
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(focusEdges.length * 6), 3))
    return geometry
  }, [focusEdges])

  const writeLines = (geometry: BufferGeometry, edges: GalaxyEdge[]) => {
    const attribute = geometry.getAttribute('position') as BufferAttribute
    const array = attribute.array as Float32Array
    edges.forEach((edge, index) => {
      array.set(current.current[edge.a], index * 6)
      array.set(current.current[edge.b], index * 6 + 3)
    })
    attribute.needsUpdate = true
    geometry.computeBoundingSphere()
  }

  useFrame(({ clock }, delta) => {
    if (started.current === null) started.current = clock.elapsedTime
    const time = clock.elapsedTime
    const elapsed = time - started.current
    const count = layout.positions.length
    const perspective = camera as PerspectiveCamera

    /*
     * 섹션이 가린 만큼 시야를 옮긴다: 캔버스는 화면 전체 그대로, 보이는 창(view offset)만 밀어서
     * 씬의 가운데가 남은 칸의 가운데에 오게 한다. 섹션 애니메이션과 같은 순간 · 같은 속도로 움직인다.
     */
    opened.current += (panel - opened.current) * (1 - Math.exp(-delta * 7))
    if (Math.abs(panel - opened.current) < 0.0005) opened.current = panel
    const share = opened.current
    if (share > 0.0005) {
      perspective.setViewOffset(
        size.width,
        size.height,
        side ? (size.width * share) / 2 : 0,
        side ? 0 : (size.height * share) / 2,
        size.width,
        size.height,
      )
    } else if (perspective.view?.enabled) {
      perspective.clearViewOffset()
    }

    // 남은 칸에 전체가 딱 들어오는 거리 = 최대 줌아웃. 전체 보기 상태였다면 함께 따라가고, 더 멀면 당겨 온다
    const visibleWidth = side ? size.width * (1 - share) : size.width
    const visibleHeight = side ? size.height : size.height * (1 - share)
    const fitNow = fitDistance(layout.radius + layout.size, visibleWidth, visibleHeight)
    view.current.fit = fitNow
    if (controls.current) controls.current.maxDistance = fitNow
    const distance = camera.position.length()
    if (!interacted.current && elapsed <= FLY_IN + 0.1) {
      // 카메라가 멀리서 날아 들어온다 (그 사이 사용자가 움직이면 멈춘다)
      camera.position.setLength(fitNow * (1 + 1.6 * (1 - easeInOutCubic(clamp01(elapsed / FLY_IN)))))
    } else if (lastFit.current !== null && (distance >= lastFit.current * 0.985 || distance > fitNow)) {
      camera.position.setLength(fitNow)
    }
    lastFit.current = fitNow

    // 열린 프로필 쪽으로 카메라 방향을 옮긴다 (거리는 그대로)
    if (focusing.current && selected !== null && elapsed > FLY_IN) {
      const target = layout.positions[selected]
      const length = camera.position.length()
      const toward: Vec3 = Math.hypot(...target) > 0.01 ? target : [0, 0, 1]
      const direction = camera.position.clone().normalize()
      const goal = direction
        .clone()
        .set(...toward)
        .normalize()
      direction.lerp(goal, 0.06).normalize()
      camera.position.copy(direction.multiplyScalar(length))
      if (direction.angleTo(goal) < 0.01) focusing.current = false
    }

    // 가운데에서 퍼지고, 그 뒤로는 천천히 떠다닌다
    const drift = layout.size * DRIFT
    const cameraDistance = camera.position.length()
    for (let i = 0; i < count; i += 1) {
      const delay = (i / Math.max(count - 1, 1)) * INTRO_STAGGER
      const spread = easeOutExpo(clamp01((elapsed - 0.2 - delay) / INTRO))
      const target = layout.positions[i]
      const point: Vec3 = [
        target[0] * spread + Math.sin(time * 0.35 + i * 1.3) * drift,
        target[1] * spread + Math.cos(time * 0.29 + i * 2.1) * drift,
        target[2] * spread + Math.sin(time * 0.23 + i * 0.7) * drift,
      ]
      current.current[i] = point
      const node = nodes.current[i]
      if (!node) continue
      node.position.set(...point)

      // 멀리 있을수록 흐리게 (앞쪽 1 → 뒤쪽 0.55)
      const card = cards.current[i]
      if (card) {
        const depth = clamp01(
          (camera.position.distanceTo(node.position) - (cameraDistance - layout.radius)) / (layout.radius * 2),
        )
        card.style.opacity = String(focus === i ? 1 : 1 - depth * 0.45)
      }
    }

    writeLines(allLines, layout.edges)
    if (focusEdges.length) writeLines(focusLines, focusEdges)
  }, -1) // 프로필(HTML)이 위치를 계산하기 전에 시야 · 카메라를 먼저 옮긴다 (선과 어긋나지 않게)

  return (
    <>
      <fog attach='fog' args={['#000000', fit * 0.85, fit + layout.radius * 2.2]} />
      <Stars radius={fit * 1.6} depth={fit} count={3500} factor={3.2} saturation={0} fade speed={0.4} />
      <Sparkles
        count={Math.min(160, 50 + members.length * 4)}
        scale={layout.radius * 2.6}
        size={1.6}
        speed={0.25}
        opacity={0.35}
        color='#ffffff'
      />

      <OrbitControls
        ref={controls}
        enablePan={false}
        enableZoom
        zoomSpeed={0.7}
        enableDamping
        dampingFactor={0.07}
        rotateSpeed={0.55}
        // 마우스를 올렸거나 프로필을 열어 둔 동안은 멈춘다
        autoRotate={focus === null}
        autoRotateSpeed={0.3}
        minDistance={layout.size * 3}
        onStart={() => {
          interacted.current = true
          focusing.current = false
        }}
      />

      <lineSegments geometry={allLines}>
        <lineBasicMaterial color='#ffffff' transparent opacity={0.16} blending={AdditiveBlending} depthWrite={false} />
      </lineSegments>
      <lineSegments geometry={focusLines}>
        <lineBasicMaterial color='#ffffff' transparent opacity={0.75} blending={AdditiveBlending} depthWrite={false} />
      </lineSegments>

      {members.map((member, index) => (
        <group key={member.id} ref={(node) => void (nodes.current[index] = node)}>
          {/* CARD_PX 크기의 DOM이 월드 크기 layout.size로 보이게 (drei Html 스케일 공식) */}
          <Html center distanceFactor={scale} zIndexRange={[30, 6]}>
            <button
              ref={(element) => void (cards.current[index] = element)}
              type='button'
              onClick={() => onSelect(index)}
              onPointerEnter={() => setHovered(index)}
              onPointerLeave={() => setHovered((current) => (current === index ? null : current))}
              aria-pressed={selected === index}
              className='group relative flex flex-col items-center rounded-sm outline-none focus-visible:ring-1 focus-visible:ring-white/40'
              style={{ width: CARD_PX }}
            >
              <span
                className={`flex items-center justify-center transition-transform duration-500 ease-out group-hover:scale-125 ${
                  selected === index ? 'scale-125' : ''
                }`}
                style={{ width: CARD_PX, height: CARD_PX }}
              >
                {member.cover_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={member.cover_image_url}
                    alt={member.name}
                    draggable={false}
                    className='size-full object-contain drop-shadow-[0_0_22px_rgba(255,255,255,0.18)] transition-[filter] duration-500 group-hover:drop-shadow-[0_0_36px_rgba(255,255,255,0.45)]'
                  />
                ) : (
                  <span className='flex size-3/4 items-center justify-center rounded-full text-4xl text-white/70 ring-1 ring-white/25'>
                    {member.name.slice(0, 1)}
                  </span>
                )}
              </span>
            </button>
          </Html>
          {/* 마우스를 올리거나 열어 둔 사람: 이름 · 분야. 거리와 상관없이 늘 같은 크기로 읽히게 이미지와 따로 띄운다 */}
          {/* 기준점 = 커진 카드의 아랫변 바로 밑. 글자 묶음의 윗변을 거기에 맞춘다(translate-y-1/2) */}
          <Html center position={[0, -layout.size * 0.7, 0]} zIndexRange={[31, 31]} style={{ pointerEvents: 'none' }}>
            <div className='translate-y-1/2'>
              <span
                className={`flex w-max max-w-[280px] flex-col items-center gap-1 text-center transition-all duration-300 ${
                  focus === index ? 'translate-y-0 opacity-100' : '-translate-y-1 opacity-0'
                }`}
              >
                <span className='text-lg leading-tight font-medium tracking-[-0.02em] text-white md:text-xl'>
                  {member.name}
                </span>
                {member.fields.length > 0 && (
                  <span className='font-mono text-[11px] leading-snug tracking-[0.12em] text-white/60 uppercase md:text-xs'>
                    {member.fields.join(' · ')}
                  </span>
                )}
              </span>
            </div>
          </Html>
        </group>
      ))}
    </>
  )
}
