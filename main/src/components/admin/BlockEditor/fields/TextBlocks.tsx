'use client'

import type { HeadingBlock, ParagraphBlock, QuoteBlock, CalloutBlock, SectionIndexBlock } from '@/types/blocks'

export const SectionIndexBlockField = ({
  block,
  onChange,
}: {
  block: SectionIndexBlock
  onChange: (block: SectionIndexBlock) => void
}) => (
  <div>
    <div className='grid grid-cols-[5rem_1fr] gap-1.5'>
      <input
        type='text'
        value={block.number}
        placeholder='01'
        maxLength={8}
        aria-label='인덱스 번호'
        onChange={(e) => onChange({ ...block, number: e.target.value })}
      />
      <input
        type='text'
        value={block.title}
        placeholder='섹션 제목'
        aria-label='섹션 제목'
        onChange={(e) => onChange({ ...block, title: e.target.value })}
      />
    </div>
    <p className='px-1 text-[11px] leading-relaxed text-muted'>
      상세 페이지의 섹션 이동 버튼과 스크롤 위치가 자동 생성됩니다.
    </p>
  </div>
)

export const HeadingBlockField = ({
  block,
  onChange,
}: {
  block: HeadingBlock
  onChange: (block: HeadingBlock) => void
}) => (
  <div>
    <select
      value={block.level}
      onChange={(e) => onChange({ ...block, level: Number(e.target.value) as 1 | 2 | 3 })}
    >
      <option value={1}>H1</option>
      <option value={2}>H2</option>
      <option value={3}>H3</option>
    </select>
    <input
      type='text'
      value={block.text}
      placeholder='제목'
      onChange={(e) => onChange({ ...block, text: e.target.value })}
    />
  </div>
)

export const ParagraphBlockField = ({
  block,
  onChange,
}: {
  block: ParagraphBlock
  onChange: (block: ParagraphBlock) => void
}) => (
  <div>
    <textarea
      value={block.text}
      placeholder={'본문을 입력하세요. **굵게**, *기울임*, [링크](https://...) 지원'}
      rows={4}
      onChange={(e) => onChange({ ...block, text: e.target.value })}
    />
  </div>
)

export const QuoteBlockField = ({
  block,
  onChange,
}: {
  block: QuoteBlock
  onChange: (block: QuoteBlock) => void
}) => (
  <div>
    <textarea
      value={block.text}
      placeholder='인용문'
      rows={3}
      onChange={(e) => onChange({ ...block, text: e.target.value })}
    />
    <input
      type='text'
      value={block.cite ?? ''}
      placeholder='출처 (선택)'
      onChange={(e) => onChange({ ...block, cite: e.target.value })}
    />
  </div>
)

export const CalloutBlockField = ({
  block,
  onChange,
}: {
  block: CalloutBlock
  onChange: (block: CalloutBlock) => void
}) => (
  <div>
    <input
      type='text'
      value={block.icon ?? ''}
      placeholder='💡'
      maxLength={4}
      style={{ width: '3em' }}
      onChange={(e) => onChange({ ...block, icon: e.target.value })}
    />
    <textarea
      value={block.text}
      placeholder='강조 문구'
      rows={2}
      onChange={(e) => onChange({ ...block, text: e.target.value })}
    />
  </div>
)
