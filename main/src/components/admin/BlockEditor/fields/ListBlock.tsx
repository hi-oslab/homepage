'use client'

import type { ListBlock } from '@/types/blocks'
import { Input, Select, buttonClass, iconButtonClass } from '@/components/admin/ui'

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
      <Select
        value={block.style}
        onChange={(e) => onChange({ ...block, style: e.target.value as 'bullet' | 'number' })}
        className='mb-2!'
      >
        <option value='bullet'>글머리 기호</option>
        <option value='number'>번호</option>
      </Select>

      <ul className='flex flex-col gap-1.5'>
        {block.items.map((item, i) => (
          <li key={i} className='flex items-center gap-1.5'>
            <Input type='text' value={item} onChange={(e) => updateItem(i, e.target.value)} className='mb-0!' />
            <button type='button' onClick={() => removeItem(i)} className={iconButtonClass({ danger: true }, 'shrink-0')}>
              ×
            </button>
          </li>
        ))}
      </ul>

      <button type='button' onClick={addItem} className={buttonClass('secondary', 'sm', 'mt-2')}>
        + 항목 추가
      </button>
    </div>
  )
}
