'use client'

import type { LegacyMarkdownBlock } from '@/types/blocks'
import { Textarea } from '@/components/admin/ui'

export const LegacyMarkdownBlockField = ({
  block,
  onChange,
}: {
  block: LegacyMarkdownBlock
  onChange: (block: LegacyMarkdownBlock) => void
}) => (
  <div>
    <p className='mb-2 rounded-md bg-beige px-3 py-2 text-xs text-muted'>
      ⚠️ 블록 에디터 도입 이전에 markdown으로 작성된 콘텐츠입니다. 필요하면 아래 텍스트를 지우고 블록으로 새로 작성하세요.
    </p>
    <Textarea
      value={block.text}
      rows={10}
      className='font-mono'
      onChange={(e) => onChange({ ...block, text: e.target.value })}
    />
  </div>
)
