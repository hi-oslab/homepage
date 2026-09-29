import type { CodeBlock as CodeBlockType } from '@/types/blocks'
import classNames from 'classnames'

export function CodeBlock({ block, className }: { block: CodeBlockType; className?: string }) {
  return (
    <div className={classNames('py-4 md:py-8', className)}>
      {block.language && (
        <div className='px-4 py-1.5 font-mono text-xs text-neutral-100/50 overflow-hidden rounded-t-sm bg-neutral-900 border-b border-neutral-100/20'>
          {block.language}
        </div>
      )}
      <pre className='overflow-x-auto p-4 overflow-hidden rounded-b-sm bg-neutral-900'>
        <code className='font-mono text-sm leading-relaxed text-neutral-100'>{block.code}</code>
      </pre>
    </div>
  )
}
