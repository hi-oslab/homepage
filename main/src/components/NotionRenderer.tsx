// src/components/NotionRenderer.tsx
import { NotionBlock, groupBlocks } from './NotionBlock'
import { BlockWithChildren } from '@/app/api/notion'

export const NotionRenderer = ({ blocks }: { blocks: BlockWithChildren[] }) => {
  const groups = groupBlocks(blocks)

  return (
    <div className='w-full space-y-4 font-pretendard'>
      {groups.length > 0 ? (
        groups.map((group, i) => {
          if (group.kind === 'bulleted')
            return (
              <ul key={i} className='list-disc pl-6 space-y-1'>
                {group.blocks.map((b) => (
                  <NotionBlock key={b.id} block={b} />
                ))}
              </ul>
            )
          if (group.kind === 'numbered')
            return (
              <ol key={i} className='list-decimal pl-6 space-y-1'>
                {group.blocks.map((b) => (
                  <NotionBlock key={b.id} block={b} />
                ))}
              </ol>
            )
          return <NotionBlock key={group.block.id} block={group.block} />
        })
      ) : (
        <p className='px-3 py-2'>No content available.</p>
      )}
    </div>
  )
}
