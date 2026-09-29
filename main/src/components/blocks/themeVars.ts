import type { CSSProperties } from 'react'

/**
 * 블록(공개 페이지용)을 멤버 공간 안에서 그릴 때 감싸는 스타일.
 * 블록 글자 · 선은 text-black · bg-black(/투명도)로 칠해져 있어서 다크모드에서 어두운 바탕에 묻힌다.
 * 이 안에서만 black ↔ 글자색(ink), white ↔ 바탕색(paper)으로 바꿔 끼운다.
 * 라이트에서는 값이 같아 모양이 그대로이고, 공개 사이트는 이 스타일을 쓰지 않는다.
 * (코드 블록처럼 늘 검은 면이어야 하는 곳은 neutral 고정색을 쓴다)
 */
export const THEMED_BLOCKS = {
  '--color-black': 'var(--color-ink)',
  '--color-white': 'var(--color-paper)',
} as CSSProperties
