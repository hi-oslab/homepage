// 어드민 공용 Tailwind 스타일 — 선/그림자 없이 면과 농도로 구분
// 서버 컴포넌트에서도 쓸 수 있도록 'use client' 없이 문자열만 만든다. 디자인은 여기서 고친다.

import { cn } from '@/lib/cn'

/* ─── 버튼 ─────────────────────────────────────────────────────────────── */

const BUTTON_BASE =
  'inline-flex min-h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 text-[13px] font-medium transition-[background-color,color,opacity] duration-150 disabled:cursor-not-allowed disabled:opacity-40'

const BUTTON_VARIANTS = {
  primary: 'bg-ink text-white not-disabled:hover:opacity-85',
  secondary: 'bg-tile text-ink not-disabled:hover:bg-[#e0e0dc]',
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

/* ─── 입력 필드 ────────────────────────────────────────────────────────── */

export const fieldClass = (className?: string) =>
  cn(
    'w-full rounded-lg bg-field px-3 py-[9px] text-sm/normal text-ink outline-none transition-colors duration-150 placeholder:text-ink/30 focus:bg-[#e7e7e3] disabled:opacity-60',
    className,
  )

/** 로그인·가입 화면의 큰 입력칸 (fieldClass 위에 덮어쓴다) */
export const LARGE_FIELD = 'bg-tile py-3.5 text-base'

/** 셀렉트 오른쪽 화살표 (배경 이미지) */
export const SELECT_CHEVRON = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238a8a86' stroke-width='1.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`

export const selectClass = (className?: string) =>
  fieldClass(cn('bg-size-[14px] bg-position-[right_10px_center] bg-no-repeat pr-8', className))
