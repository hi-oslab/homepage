'use client'

import classNames from 'classnames'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { HtmlBlock as HtmlBlockType } from '@/types/blocks'

/** iframe 안에서 높이를 알려 올 때 쓰는 메시지 이름 */
const MESSAGE = 'osl-html-block-height'

/**
 * 격리된 창 안에 넣을 문서: 기본 여백 · 글꼴을 맞추고, 내용 높이가 바뀔 때마다 부모에 알린다.
 * 링크는 새 탭으로 연다 (창 안에서 페이지가 바뀌지 않게).
 */
const toDocument = (html: string, id: string) => `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<base target="_blank">
<style>
  html, body { margin: 0; padding: 0; background: transparent; }
  body { font-family: Pretendard, -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', sans-serif; line-height: 1.6; overflow: hidden; }
  img, video, iframe { max-width: 100%; }
</style>
</head>
<body>
${html}
<script>
  (function () {
    var send = function () {
      parent.postMessage({ type: '${MESSAGE}', id: '${id}', height: document.documentElement.scrollHeight }, '*');
    };
    new ResizeObserver(send).observe(document.documentElement);
    window.addEventListener('load', send);
    send();
  })();
</script>
</body>
</html>`

/**
 * 직접 쓴 HTML 블록 (스크립트 포함 가능).
 * 사이트와 분리된 sandbox iframe 안에서 그린다: allow-same-origin이 없어서 창 안의 코드는
 * 사이트의 로그인 · 쿠키 · 화면에 손댈 수 없다. 높이는 창이 postMessage로 알려 준다.
 */
export function HtmlBlock({ block, className }: { block: HtmlBlockType; className?: string }) {
  const id = useId()
  const frame = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState(0)
  const srcDoc = useMemo(() => toDocument(block.html, id), [block.html, id])

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      // 이 블록의 창에서 온 메시지만 (다른 창 · 다른 블록은 무시)
      if (event.source !== frame.current?.contentWindow) return
      const data = event.data as { type?: string; id?: string; height?: number }
      if (data?.type !== MESSAGE || data.id !== id || typeof data.height !== 'number') return
      setHeight(Math.min(Math.max(Math.ceil(data.height), 0), 10000))
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [id])

  if (!block.html.trim()) return null

  return (
    <iframe
      ref={frame}
      title='HTML 블록'
      srcDoc={srcDoc}
      // allow-same-origin은 절대 넣지 않는다 (넣으면 격리가 풀린다)
      sandbox='allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms'
      loading='lazy'
      style={{ height: height || 1 }}
      className={classNames('my-6 block w-full border-0', className)}
    />
  )
}
