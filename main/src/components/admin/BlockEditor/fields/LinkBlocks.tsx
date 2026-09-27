'use client'

import { useState } from 'react'
import type { LinkBlock, EmbedBlock } from '@/types/blocks'
import { Input, Select, Textarea, buttonClass } from '@/components/admin/ui'

export const LinkBlockField = ({
  block,
  onChange,
}: {
  block: LinkBlock
  onChange: (block: LinkBlock) => void
}) => {
  const [fetching, setFetching] = useState(false)

  const fetchMetadata = async () => {
    if (!block.url) return
    setFetching(true)
    try {
      const res = await fetch(`/api/link-preview?url=${encodeURIComponent(block.url)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'failed')
      onChange({
        ...block,
        title: data.title || block.title,
        description: data.description || block.description,
        image: data.image || block.image,
      })
    } catch (err) {
      console.error('Failed to fetch link metadata:', err)
      alert('메타데이터를 가져오지 못했습니다')
    } finally {
      setFetching(false)
    }
  }

  return (
    <div>
      <Select value={block.style} onChange={(e) => onChange({ ...block, style: e.target.value as 'bookmark' | 'inline' })}>
        <option value='bookmark'>북마크 카드</option>
        <option value='inline'>인라인 링크</option>
      </Select>

      <Input
        type='url'
        value={block.url}
        placeholder='https://...'
        onChange={(e) => onChange({ ...block, url: e.target.value })}
      />

      {block.style === 'bookmark' && (
        <>
          <button
            type='button'
            onClick={fetchMetadata}
            disabled={fetching || !block.url}
            className={buttonClass('secondary', 'sm', 'mb-2')}
          >
            {fetching ? '가져오는 중...' : '메타데이터 자동으로 가져오기'}
          </button>
          <Input
            type='text'
            value={block.title ?? ''}
            placeholder='제목'
            onChange={(e) => onChange({ ...block, title: e.target.value })}
          />
          <Textarea
            value={block.description ?? ''}
            placeholder='설명'
            rows={2}
            onChange={(e) => onChange({ ...block, description: e.target.value })}
          />
          <Input
            type='url'
            value={block.image ?? ''}
            placeholder='썸네일 이미지 URL'
            onChange={(e) => onChange({ ...block, image: e.target.value })}
          />
          {block.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={block.image} alt='' className='mb-1.5 max-w-40 rounded-md' />
          )}
        </>
      )}

      {block.style === 'inline' && (
        <Input
          type='text'
          value={block.title ?? ''}
          placeholder='링크 텍스트 (비우면 URL 표시)'
          onChange={(e) => onChange({ ...block, title: e.target.value })}
        />
      )}
    </div>
  )
}

export const EmbedBlockField = ({
  block,
  onChange,
}: {
  block: EmbedBlock
  onChange: (block: EmbedBlock) => void
}) => (
  <div>
    <Input
      type='url'
      value={block.url}
      placeholder='임베드할 iframe URL (Figma, CodeSandbox 등)'
      onChange={(e) => onChange({ ...block, url: e.target.value })}
    />
    <Input
      type='text'
      value={block.title ?? ''}
      placeholder='제목 (선택, 접근성용)'
      onChange={(e) => onChange({ ...block, title: e.target.value })}
    />
    {block.url && (
      <iframe src={block.url} title={block.title || 'embed preview'} className='h-80 w-full rounded-md border-0' />
    )}
  </div>
)
