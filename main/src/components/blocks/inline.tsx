import { Fragment, type ReactNode } from 'react'

// 인라인 서식: **굵게**, *기울임*, [텍스트](url), 줄바꿈
const INLINE_RE = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(\[([^\]]+)\]\((https?:\/\/[^\s)]+)\))|(\n)/g

/** decorate: 서식이 없는 평범한 글자 조각을 한 번 더 꾸민다 (게시판 멘션 등, 없으면 그대로) */
export function renderInlineText(text: string, decorate?: ((text: string) => ReactNode) | null): ReactNode[] {
  const nodes: ReactNode[] = []
  let lastIndex = 0
  let key = 0
  const plain = (value: string) => (decorate ? <Fragment key={key++}>{decorate(value)}</Fragment> : value)

  for (const match of Array.from(text.matchAll(INLINE_RE))) {
    const index = match.index ?? 0
    if (index > lastIndex) nodes.push(plain(text.slice(lastIndex, index)))

    if (match[1]) nodes.push(<strong key={key++}>{match[2]}</strong>)
    else if (match[3]) nodes.push(<em key={key++}>{match[4]}</em>)
    else if (match[5])
      nodes.push(
        <a
          key={key++}
          href={match[7]}
          target='_blank'
          rel='noopener noreferrer'
          className='underline decoration-gray underline-offset-2 hover:decoration-black'
        >
          {match[6]}
        </a>,
      )
    else if (match[8] !== undefined) nodes.push(<br key={key++} />)

    lastIndex = index + match[0].length
  }

  if (lastIndex < text.length) nodes.push(plain(text.slice(lastIndex)))
  return nodes
}
