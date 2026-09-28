// 멤버 공간 공용 Tailwind 스타일 — 서버 컴포넌트에서도 쓸 수 있도록 'use client' 없이 문자열만 만든다.
// 디자인 규칙은 여기서 고친다:
//  - 색: 대부분 회색 톤, 중요한 동작만 강조색(파랑 accent)과 검정(ink)
//  - 바탕은 회색(paper), 블록(섹션 · 카드 · 패널 · 모달)은 둥근 흰 면(rounded-block)
//  - 블록 안에서는 모노톤 → 검정(ink) → 파랑(accent) 순으로 위계를 올린다
//  - 다크모드: 색은 globals.css 토큰이 바뀐다. 검정 면 위 글자는 text-paper (text-paper 금지)
//  - 간격: 블록 사이 · 안쪽 여백을 작게 (BLOCK_GAP · BLOCK_PAD)

import { cn } from '@/lib/cn'

/* ─── 버튼 ─────────────────────────────────────────────────────────────── */

const BUTTON_BASE =
  'inline-flex min-h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 text-[13px] font-medium transition-[background-color,color,opacity] duration-150 disabled:cursor-not-allowed disabled:opacity-40'

const BUTTON_VARIANTS = {
  /** 화면에서 가장 중요한 동작 (저장 · 등록 · 승인) */
  primary: 'bg-accent text-white not-disabled:hover:bg-accent-hover',
  /** 강조하되 파랑보다 한 단계 아래 (보조 확정 · 선택된 상태) */
  dark: 'bg-ink text-paper not-disabled:hover:opacity-85',
  secondary: 'bg-ink/[0.06] text-ink not-disabled:hover:bg-ink/10',
  ghost: 'bg-transparent text-mute not-disabled:hover:bg-tile not-disabled:hover:text-ink',
  danger: 'bg-transparent text-danger not-disabled:hover:bg-danger-soft',
  /** 색은 호출하는 쪽에서 */
  plain: '',
}

const BUTTON_SIZES = {
  md: '',
  sm: 'min-h-[30px] px-2.5 text-xs',
  /** 로그인·가입 화면의 큰 버튼 */
  lg: 'min-h-12 px-5 text-base',
}

export type ButtonVariant = keyof typeof BUTTON_VARIANTS
export type ButtonSize = keyof typeof BUTTON_SIZES

/** <button>, <Link>, <a> 어디에나 붙이는 버튼 스타일 */
export const buttonClass = (variant: ButtonVariant = 'secondary', size: ButtonSize = 'md', className?: string) =>
  cn(BUTTON_BASE, BUTTON_VARIANTS[variant], BUTTON_SIZES[size], className)

/** 아이콘만 있는 작은 버튼. danger: 삭제처럼 위험한 동작 */
export const iconButtonClass = (options: { danger?: boolean; size?: 'md' | 'sm' } = {}, className?: string) =>
  cn(
    'inline-flex shrink-0 items-center justify-center rounded-md text-mute transition-colors duration-150 hover:bg-tile hover:text-ink',
    options.size === 'sm' ? 'size-6' : 'size-7',
    options.danger && 'hover:bg-danger-soft hover:text-danger',
    className,
  )

/* ─── 블록 (섹션 · 카드 · 패널 · 모달) ───────────────────────────────────── */

/** 블록 면. 회색 바탕 위에 올라가는 둥근 면 */
const SURFACES = {
  /** 기본 블록: 흰 면 (섹션 · 카드 · 패널) */
  solid: 'rounded-block bg-surface',
  /** 반투명 흰 면 (바탕 위 장식 패널만. 글을 읽는 모달 · 팝오버는 solid) */
  glass: 'rounded-block bg-surface/70 backdrop-blur-xl',
  /** 강조 블록: 검정 면 (고정 글 · 알림 바처럼 눈에 띄어야 할 것) */
  inverse: 'rounded-block bg-inverse text-on-inverse',
  /** 블록 안의 작은 면 (목록 한 칸 · 인용 · 안내 상자) */
  inset: 'rounded-inner bg-tile/70',
}

export type Surface = keyof typeof SURFACES

export const surfaceClass = (tone: Surface = 'solid', className?: string) => cn(SURFACES[tone], className)

/**
 * 모달 · 시트 뒤를 덮는 어두운 막. 테마와 상관없이 항상 검정 기준
 * (bg-ink/N 은 다크모드에서 밝은 막이 되어 모달 글자가 묻힌다)
 */
export const SCRIM = 'bg-black/45 backdrop-blur-sm'

/**
 * 딤 위에 떠 있는 창(모달 · 시트)의 가는 테두리. 그림자는 두지 않는다 (딤이 구분을 맡는다).
 * 다크모드에서는 ink가 밝은색이 되어 검은 딤과 창 가장자리가 구분된다
 */
export const FLOATING = 'ring-1 ring-ink/10'

/**
 * 눌러서 여는 목록 한 줄 (멤버 · 건의사항 등): 평소엔 배경 없음, 올리면 옅은 회색.
 * ink 기준 농도라 다크모드에서도 그대로 보인다.
 */
export const ROW_HOVER =
  'rounded-inner transition-colors hover:bg-ink/[0.05] focus-visible:bg-ink/[0.05] focus-visible:outline-none'

/** 흰 블록 안에 놓이는 눌러서 여는 카드 (라운지 글 등): 회색 면, 올리면 한 단계 진하게 */
export const INSET_HOVER = 'rounded-inner bg-ink/[0.04] transition-colors hover:bg-ink/[0.08]'

/** 블록 안쪽 여백 */
export const BLOCK_PAD = 'p-4'
/** 블록 사이 간격 (그리드 · 세로 쌓기) */
export const BLOCK_GAP = 'gap-2'

/* ─── 입력 필드 ────────────────────────────────────────────────────────── */

export const fieldClass = (className?: string) =>
  cn(
    'w-full rounded-lg bg-field px-3 py-[9px] text-sm/normal text-ink outline-none transition-colors duration-150 placeholder:text-ink/30 focus:bg-tile disabled:opacity-60',
    className,
  )

/** 로그인·가입 화면의 큰 입력칸 (fieldClass 위에 덮어쓴다) */
export const LARGE_FIELD = 'bg-tile py-3.5 text-base'

/** 셀렉트 오른쪽 화살표 (배경 이미지) */
export const SELECT_CHEVRON = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238a8a86' stroke-width='1.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`

export const selectClass = (className?: string) =>
  fieldClass(cn('bg-size-[14px] bg-position-[right_10px_center] bg-no-repeat pr-8', className))
