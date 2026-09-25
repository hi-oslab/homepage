'use client'

import type { ListBlock } from '@/types/blocks'

export const ListBlockField = ({
  block,
  onChange,
}: {
  block: ListBlock
  onChange: (block: ListBlock) => void
}) => {
  const updateItem = (index: number, value: string) => {
    const items = block.items.slice()
    items[index] = value
    onChange({ ...block, items })
  }

  const removeItem = (index: number) => {
    const items = block.items.filter((_, i) => i !== index)
    onChange({ ...block, items: items.length > 0 ? items : [''] })
  }

  const addItem = () => onChange({ ...block, items: [...block.items, ''] })

  return (
    <div>
      <select
        value={block.style}
        onChange={(e) => onChange({ ...block, style: e.target.value as 'bullet' | 'number' })}
        className='mb-2!'
      >
        <option value='bullet'>글머리 기호</option>
        <option value='number'>번호</option>
      </select>

      <ul className='flex flex-col gap-1.5'>
        {block.items.map((item, i) => (
          <li key={i} className='flex items-center gap-1.5'>
            <input type='text' value={item} onChange={(e) => updateItem(i, e.target.value)} className='mb-0!' />
            <button type='button' onClick={() => removeItem(i)} className='icon-btn shrink-0 hover:bg-danger-soft! hover:text-danger!'>
              ×
            </button>
          </li>
        ))}
      </ul>

      <button type='button' onClick={addItem} className='btn btn-secondary btn-sm mt-2'>
        + 항목 추가
      </button>
    </div>
  )
}
