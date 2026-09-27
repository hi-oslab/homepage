import classNames from 'classnames'
import { extendTailwindMerge } from 'tailwind-merge'

// globals.css @theme에 추가한 글자 크기(text-xxs, text-xxxs)를 색상이 아닌 크기로 인식시킨다
const twMerge = extendTailwindMerge({ extend: { theme: { text: ['xxs', 'xxxs'] } } })

/** 조건부 클래스 + Tailwind 충돌 정리 (뒤에 오는 클래스가 이긴다) */
export const cn = (...args: classNames.ArgumentArray) => twMerge(classNames(...args))
