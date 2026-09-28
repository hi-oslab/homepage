/** 데스크탑 사이드바를 접어 둘지 (쿠키에 저장해서 서버가 처음부터 같은 모양으로 그린다) */
export const NAV_COLLAPSED_COOKIE = 'osl-nav-collapsed'

/** 멤버 공간 테마 (쿠키에 저장해서 서버가 처음부터 같은 색으로 그린다) */
export const THEME_COOKIE = 'osl-space-theme'
export type SpaceTheme = 'light' | 'dark' | 'system'
export const SPACE_THEMES: SpaceTheme[] = ['light', 'dark', 'system']
