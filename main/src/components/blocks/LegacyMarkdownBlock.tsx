import type { LegacyMarkdownBlock as LegacyMarkdownBlockType } from '@/types/blocks'
import classNames from 'classnames'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'

export function LegacyMarkdownBlock({ block, className }: { block: LegacyMarkdownBlockType; className?: string }) {
  return (
    <div className={classNames('w-full [&_img]:h-auto [&_img]:w-full [&_video]:w-full [&_.video-wrapper]:w-full', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{block.text}</ReactMarkdown>
    </div>
  )
}
