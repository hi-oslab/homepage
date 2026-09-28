'use client'

import { motion } from 'framer-motion'
import { createContext, useContext, useEffect, useState } from 'react'

/** 첫 로그인 프로필 설정이 끝나면 보내는 신호 (OnboardingModal) → 홈 섹션이 등장한다 */
export const HOME_INTRO_EVENT = 'osl:home-intro'
/** 프로필 설정 창이 떠 있는 동안 layout이 두는 표시: 이게 있으면 창이 끝날 때까지 기다린다 */
export const ONBOARDING_MARKER = 'data-onboarding-pending'

/** 등장 순서 칸: 무작위로 고르되 간격을 맞춰 리듬 있게 (0 · 0.07 · 0.14 …초) */
const STEP = 0.07
const SLOTS = 6
/** 빠르게 출발해 천천히 멈추는 감속 곡선 (ease-out-expo) */
const EASE = [0.16, 1, 0.3, 1] as const

/** 이 섹션의 등장 모션이 끝났는지 (PopIn 밖에서는 늘 true). 인사말 타이핑처럼 등장 뒤에 시작할 때 */
const EnteredContext = createContext(true)
export const usePopInEntered = () => useContext(EnteredContext)

/**
 * 홈 섹션 등장: 살짝 흐릿하게 아래에 있다가, 선명해지며 제자리로 부드럽게 올라온다. 순서는 매번 무작위.
 * 서버 · 브라우저 모양이 같도록 시작 상태(initial)는 고정이고, 무작위 값은 등장 시점에만 쓴다.
 * 끝나면 filter를 지운다 (남아 있으면 안쪽 fixed 요소 · 토스트의 기준이 이 칸으로 바뀐다).
 * className은 그리드 칸 배치용 (page.tsx)
 */
export function PopIn({ className, children }: { className?: string; children: React.ReactNode }) {
  const [delay, setDelay] = useState<number | null>(null)
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    const play = () => setDelay(Math.floor(Math.random() * SLOTS) * STEP)
    // 프로필 설정 창이 떠 있으면 끝날 때까지 기다린다 (창 뒤에서 미리 끝나 버리지 않게)
    if (!document.querySelector(`[${ONBOARDING_MARKER}]`)) play()
    window.addEventListener(HOME_INTRO_EVENT, play)
    return () => window.removeEventListener(HOME_INTRO_EVENT, play)
  }, [])

  const hidden = { opacity: 0, y: 12, filter: 'blur(6px)' }
  return (
    <motion.div
      className={className}
      initial={hidden}
      animate={delay === null ? hidden : { opacity: 1, y: 0, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }}
      transition={{ delay: delay ?? 0, duration: 0.8, ease: EASE, opacity: { delay: delay ?? 0, duration: 0.5 } }}
      onAnimationComplete={() => delay !== null && setEntered(true)}
    >
      <EnteredContext.Provider value={entered}>{children}</EnteredContext.Provider>
    </motion.div>
  )
}
