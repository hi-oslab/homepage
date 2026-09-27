'use client'

import type { CodeBlock, HtmlBlock } from '@/types/blocks'
import { Input, Textarea } from '@/components/admin/ui'

export const CodeBlockField = ({
  block,
  onChange,
}: {
  block: CodeBlock
  onChange: (block: CodeBlock) => void
}) => (
  <div>
    <Input
      type='text'
      value={block.language ?? ''}
      placeholder='language (예: tsx, css, bash)'
      onChange={(e) => onChange({ ...block, language: e.target.value })}
    />
    <Textarea
      value={block.code}
      placeholder='코드를 입력하세요'
      rows={8}
      style={{ fontFamily: 'monospace' }}
      onChange={(e) => onChange({ ...block, code: e.target.value })}
    />
  </div>
)

export const HtmlBlockField = ({
  block,
  onChange,
}: {
  block: HtmlBlock
  onChange: (block: HtmlBlock) => void
}) => (
  <div>
    <Textarea
      value={block.html}
      placeholder='HTML 코드를 직접 입력하세요'
      rows={8}
      style={{ fontFamily: 'monospace' }}
      onChange={(e) => onChange({ ...block, html: e.target.value })}
    />
  </div>
)
