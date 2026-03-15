import { RichTextItemResponse } from '@notionhq/client/build/src/api-endpoints'
import { BlockWithChildren } from '@/app/api/notion'

const NOTION_HOST = 'https://designersejinoh.notion.site'

const notionImageUrl = (rawUrl: string, blockId: string) =>
  `${NOTION_HOST}/image/${encodeURIComponent(rawUrl)}?table=block&id=${blockId}&cache=v2`

// ─── Rich Text 인라인 렌더러 ────────────────────────────────────────────────────────
// bold, italic, underline, strikethrough, code, color, link 처리

const COLOR_CLASS: Record<string, string> = {
  gray: 'text-gray-500',
  brown: 'text-amber-800',
  orange: 'text-orange-500',
  yellow: 'text-yellow-500',
  green: 'text-green-600',
  blue: 'text-blue-600',
  purple: 'text-purple-600',
  pink: 'text-pink-500',
  red: 'text-red-500',
  gray_background: 'bg-gray-200',
  brown_background: 'bg-amber-100',
  orange_background: 'bg-orange-100',
  yellow_background: 'bg-yellow-100',
  green_background: 'bg-green-100',
  blue_background: 'bg-blue-100',
  purple_background: 'bg-purple-100',
  pink_background: 'bg-pink-100',
  red_background: 'bg-red-100',
}

function RichText({ texts }: { texts: RichTextItemResponse[] }) {
  if (!texts?.length) return null
  return (
    <>
      {texts.map((text, i) => {
        const { bold, italic, strikethrough, underline, code, color } = text.annotations
        const className = [
          bold ? 'font-bold' : '',
          italic ? 'italic' : '',
          strikethrough ? 'line-through' : '',
          underline ? 'underline' : '',
          code ? 'font-mono bg-black/10 px-1 py-0.5 rounded text-sm' : '',
          color !== 'default' ? (COLOR_CLASS[color] ?? '') : '',
        ]
          .filter(Boolean)
          .join(' ')

        if (text.href) {
          return (
            <a key={i} href={text.href} target='_blank' rel='noopener noreferrer' className={`underline ${className}`}>
              {text.plain_text}
            </a>
          )
        }
        return className ? (
          <span key={i} className={className}>
            {text.plain_text}
          </span>
        ) : (
          <span key={i}>{text.plain_text}</span>
        )
      })}
    </>
  )
}

// ─── 리스트 그루핑 ──────────────────────────────────────────────────────────────────
// 연속된 bulleted/numbered 블록을 <ul>/<ol>로 묶어 유효한 HTML을 생성합니다.

type BlockGroup =
  | { kind: 'single'; block: BlockWithChildren }
  | { kind: 'bulleted'; blocks: BlockWithChildren[] }
  | { kind: 'numbered'; blocks: BlockWithChildren[] }

export function groupBlocks(blocks: BlockWithChildren[]): BlockGroup[] {
  const groups: BlockGroup[] = []
  for (const block of blocks) {
    const last = groups[groups.length - 1]
    if (block.type === 'bulleted_list_item') {
      if (last?.kind === 'bulleted') last.blocks.push(block)
      else groups.push({ kind: 'bulleted', blocks: [block] })
    } else if (block.type === 'numbered_list_item') {
      if (last?.kind === 'numbered') last.blocks.push(block)
      else groups.push({ kind: 'numbered', blocks: [block] })
    } else {
      groups.push({ kind: 'single', block })
    }
  }
  return groups
}

// ─── 자식 블록 재귀 렌더러 ──────────────────────────────────────────────────────────

function Children({ blocks }: { blocks?: BlockWithChildren[] }) {
  if (!blocks?.length) return null
  const groups = groupBlocks(blocks)
  return (
    <div className='pl-4 mt-2 space-y-2'>
      {groups.map((group, i) => {
        if (group.kind === 'bulleted')
          return (
            <ul key={i} className='list-disc space-y-1'>
              {group.blocks.map((b) => (
                <NotionBlock key={b.id} block={b} />
              ))}
            </ul>
          )
        if (group.kind === 'numbered')
          return (
            <ol key={i} className='list-decimal space-y-1'>
              {group.blocks.map((b) => (
                <NotionBlock key={b.id} block={b} />
              ))}
            </ol>
          )
        return <NotionBlock key={group.block.id} block={group.block} />
      })}
    </div>
  )
}

// ─── 블록 렌더러 ────────────────────────────────────────────────────────────────────

export const NotionBlock = ({ block }: { block: BlockWithChildren }) => {
  const { type, children } = block

  switch (type) {
    // ── 텍스트 ──────────────────────────────────────────────────────────────────────

    case 'paragraph':
      return (
        <p className='text-base md:text-lg leading-8 text-gray-800 tracking-wide'>
          <RichText texts={block.paragraph.rich_text} />
        </p>
      )

    case 'heading_1':
      return (
        <h1 className='text-4xl md:text-5xl font-bold tracking-tight text-black mt-14 mb-4'>
          <RichText texts={block.heading_1.rich_text} />
        </h1>
      )

    case 'heading_2':
      return (
        <h2 className='text-2xl md:text-3xl font-bold tracking-tight text-black mt-12 mb-3 pb-2 border-b border-black/10'>
          <RichText texts={block.heading_2.rich_text} />
        </h2>
      )

    case 'heading_3':
      return (
        <h3 className='text-xl md:text-2xl font-semibold tracking-tight text-black mt-8 mb-2'>
          <RichText texts={block.heading_3.rich_text} />
        </h3>
      )

    // ── 리스트 ──────────────────────────────────────────────────────────────────────

    case 'bulleted_list_item':
      return (
        <li className='text-base md:text-lg leading-8 text-gray-800 tracking-wide'>
          <RichText texts={block.bulleted_list_item.rich_text} />
          <Children blocks={children} />
        </li>
      )

    case 'numbered_list_item':
      return (
        <li className='text-base md:text-lg leading-8 text-gray-800 tracking-wide'>
          <RichText texts={block.numbered_list_item.rich_text} />
          <Children blocks={children} />
        </li>
      )

    case 'to_do':
      return (
        <label className='flex items-start gap-3 cursor-pointer'>
          <input type='checkbox' defaultChecked={block.to_do.checked} disabled className='mt-2 accent-black' />
          <span
            className={`text-base md:text-lg leading-8 tracking-wide ${block.to_do.checked ? 'line-through text-gray-400' : 'text-gray-800'}`}
          >
            <RichText texts={block.to_do.rich_text} />
          </span>
        </label>
      )

    // ── 인용 / 콜아웃 ────────────────────────────────────────────────────────────────

    case 'quote':
      return (
        <blockquote className='border-l-[3px] border-black pl-6 my-2'>
          <p className='text-xl md:text-2xl italic leading-9 text-gray-700'>
            <RichText texts={block.quote.rich_text} />
          </p>
          <Children blocks={children} />
        </blockquote>
      )

    case 'callout':
      return (
        <div className='flex gap-4 px-6 py-5 bg-gray-50 border border-gray-200'>
          {block.callout.icon?.type === 'emoji' && (
            <span className='text-xl shrink-0 mt-0.5'>{block.callout.icon.emoji}</span>
          )}
          <div className='text-base leading-7 text-gray-800'>
            <RichText texts={block.callout.rich_text} />
            <Children blocks={children} />
          </div>
        </div>
      )

    // ── 토글 ────────────────────────────────────────────────────────────────────────

    case 'toggle':
      return (
        <details className='border border-gray-200 rounded group'>
          <summary className='px-5 py-3 font-semibold text-base cursor-pointer select-none list-none flex items-center justify-between gap-2 hover:bg-gray-50'>
            <RichText texts={block.toggle.rich_text} />
            <span className='text-gray-400 group-open:rotate-180 transition-transform shrink-0'>▾</span>
          </summary>
          <div className='px-5 pb-4 pt-2 border-t border-gray-100'>
            <Children blocks={children} />
          </div>
        </details>
      )

    // ── 구분선 ───────────────────────────────────────────────────────────────────────

    case 'divider':
      return <hr className='my-10 border-black/10' />

    // ── 코드 ────────────────────────────────────────────────────────────────────────

    case 'code':
      return (
        <pre className='bg-neutral-950 text-neutral-100 px-6 py-5 text-sm leading-7 overflow-x-auto font-mono'>
          <code>{block.code.rich_text.map((t) => t.plain_text).join('')}</code>
        </pre>
      )

    // ── 미디어 ───────────────────────────────────────────────────────────────────────

    case 'image': {
      const src =
        block.image.type === 'file' ? notionImageUrl(block.image.file.url, block.id) : block.image.external.url
      const caption = block.image.caption?.map((t) => t.plain_text).join('') || ''
      return (
        <figure className='w-full my-2'>
          <img src={src} alt={caption} className='w-full object-cover' />
          {caption && (
            <figcaption className='text-sm text-gray-400 mt-3 text-center italic tracking-wide'>{caption}</figcaption>
          )}
        </figure>
      )
    }

    case 'video': {
      const src =
        block.video.type === 'file'
          ? `${NOTION_HOST}/video/${encodeURIComponent(block.video.file.url)}?table=block&id=${block.id}&cache=v2`
          : block.video.external.url
      return (
        <div className='w-full'>
          <video controls className='w-full'>
            <source src={src} type='video/mp4' />
          </video>
        </div>
      )
    }

    case 'audio': {
      const src =
        block.audio.type === 'file'
          ? `${NOTION_HOST}/audio/${encodeURIComponent(block.audio.file.url)}?table=block&id=${block.id}&cache=v2`
          : block.audio.external.url
      return (
        <audio controls className='w-full'>
          <source src={src} />
        </audio>
      )
    }

    case 'file': {
      const href =
        block.file.type === 'file'
          ? `${NOTION_HOST}/file/${encodeURIComponent(block.file.file.url)}?table=block&id=${block.id}&cache=v2`
          : block.file.external.url
      const name = block.file.caption?.map((t) => t.plain_text).join('') || 'Download File'
      return (
        <a
          href={href}
          download
          target='_blank'
          rel='noopener noreferrer'
          className='inline-flex items-center gap-2 border border-black/20 px-4 py-2 text-sm font-medium hover:bg-black hover:text-white transition-colors'
        >
          ↓ {name}
        </a>
      )
    }

    case 'pdf': {
      const src =
        block.pdf.type === 'file'
          ? `${NOTION_HOST}/pdf/${encodeURIComponent(block.pdf.file.url)}?table=block&id=${block.id}&cache=v2`
          : block.pdf.external.url
      return (
        <a
          href={src}
          target='_blank'
          rel='noopener noreferrer'
          className='inline-flex items-center gap-2 border border-black/20 px-4 py-2 text-sm font-medium hover:bg-black hover:text-white transition-colors'
        >
          PDF 열기 ↗
        </a>
      )
    }

    // ── 링크 / 임베드 ────────────────────────────────────────────────────────────────

    case 'embed':
      return <iframe src={block.embed.url} className='w-full h-96 border border-gray-200' allowFullScreen />

    case 'bookmark': {
      const url = block.bookmark.url
      const caption = block.bookmark.caption?.map((t) => t.plain_text).join('') || url
      return (
        <a
          href={url}
          target='_blank'
          rel='noopener noreferrer'
          className='flex items-center justify-between border border-gray-200 px-5 py-4 hover:border-black transition-colors group'
        >
          <span className='text-sm text-gray-600 group-hover:text-black truncate'>{caption}</span>
          <span className='text-gray-400 shrink-0 ml-4'>↗</span>
        </a>
      )
    }

    case 'link_preview':
      return (
        <a
          href={block.link_preview.url}
          target='_blank'
          rel='noopener noreferrer'
          className='flex items-center justify-between border border-gray-200 px-5 py-4 hover:border-black transition-colors group'
        >
          <span className='text-sm text-gray-600 group-hover:text-black truncate'>{block.link_preview.url}</span>
          <span className='text-gray-400 shrink-0 ml-4'>↗</span>
        </a>
      )

    // ── 테이블 ───────────────────────────────────────────────────────────────────────

    case 'table':
      return (
        <div className='overflow-x-auto'>
          <table className='w-full border-collapse text-sm'>
            <tbody>
              {children?.map((row, ri) => {
                if (row.type !== 'table_row') return null
                return (
                  <tr
                    key={row.id}
                    className={
                      ri === 0 ? 'bg-black text-white font-semibold' : 'border-b border-gray-100 even:bg-gray-50'
                    }
                  >
                    {(row as any).table_row.cells.map((cell: RichTextItemResponse[], ci: number) => (
                      <td key={ci} className='px-4 py-3 align-top'>
                        <RichText texts={cell} />
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )

    // ── 컬럼 ─────────────────────────────────────────────────────────────────────────

    case 'column_list':
      return (
        <div className='flex gap-8'>
          {children?.map((col) => (
            <div key={col.id} className='flex-1 min-w-0 space-y-4'>
              {col.children?.map((b) => (
                <NotionBlock key={b.id} block={b} />
              ))}
            </div>
          ))}
        </div>
      )

    case 'column':
      return (
        <div className='space-y-4'>
          <Children blocks={children} />
        </div>
      )

    // ── 미지원 블록 (개발 시 확인용) ────────────────────────────────────────────────

    default:
      return (
        <div className='text-xs text-gray-400 border border-dashed border-gray-200 px-3 py-2'>
          {`[unsupported block: ${type}]`}
        </div>
      )
  }
}
