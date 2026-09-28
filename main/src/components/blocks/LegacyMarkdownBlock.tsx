import type { LegacyMarkdownBlock as LegacyMarkdownBlockType } from '@/types/blocks'
import classNames from 'classnames'
import type { ComponentProps } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'

/*
 * 예전 글(마크다운 + HTML)을 그대로 보여준다. HTML을 통과시키므로 코드가 실행될 수 있는 것은 막는다.
 * - script · object · embed · base · meta · link · style 은 지운다
 * - iframe은 바깥 사이트의 https 주소(유튜브 등)만 sandbox를 씌워 남기고, srcdoc · 우리 도메인은 지운다
 *   (sandbox의 allow-same-origin은 그 바깥 사이트 기준이라 우리 로그인에 닿지 못한다)
 * - onerror 같은 글자 이벤트 속성은 React가 함수가 아니면 무시한다
 */
const BLOCKED = ['script', 'object', 'embed', 'base', 'meta', 'link', 'style', 'frame', 'frameset']

const isExternalHttps = (src: unknown) => {
  if (typeof src !== 'string') return false
  try {
    const url = new URL(src)
    return url.protocol === 'https:' && !/(^|\.)hioslab\.com$/.test(url.hostname) && url.hostname !== 'localhost'
  } catch {
    return false
  }
}

function SafeIframe({ node: _node, src, srcDoc: _srcDoc, sandbox: _sandbox, ...props }: ComponentProps<'iframe'> & { node?: unknown }) {
  if (!isExternalHttps(src)) return null
  return (
    <iframe
      {...props}
      src={src}
      sandbox='allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-presentation'
      allowFullScreen
    />
  )
}

export function LegacyMarkdownBlock({ block, className }: { block: LegacyMarkdownBlockType; className?: string }) {
  return (
    <div className={classNames('w-full [&_img]:h-auto [&_img]:w-full [&_video]:w-full [&_.video-wrapper]:w-full', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        disallowedElements={BLOCKED}
        components={{ iframe: SafeIframe }}
      >
        {block.text}
      </ReactMarkdown>
    </div>
  )
}
