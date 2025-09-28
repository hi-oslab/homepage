// src/components/NotionRenderer.tsx
import { NotionBlock } from './NotionBlock'
import { BlockObjectResponse } from '@notionhq/client/build/src/api-endpoints'

export const NotionRenderer = ({ blocks }: { blocks: BlockObjectResponse[] }) => {
  return (
    <div className='w-full space-y-6'>
      {blocks.length > 0 ? (
        blocks.map((block) => <NotionBlock key={block.id} block={block} />)
      ) : (
        <p className='bg-black text-white px-3 py-2'>No content available.</p>
      )}
    </div>
  )
}
