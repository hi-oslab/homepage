'use client'

import { useRef, useState } from 'react'
import type { Block, MediaBlock, GalleryBlock, GalleryItem } from '@/types/blocks'
import { uploadImage } from '@/lib/storage'
import { extractVimeoId, extractYoutubeId } from '@/lib/blocks'
import { GoTrash } from 'react-icons/go'
import { VimeoPlayer, YoutubePlayer } from '@/components/EmbedVideoPlayer'
import { Input, buttonClass, iconButtonClass } from '@/components/admin/ui'

function useImageUpload(projectId: string) {
  const [uploading, setUploading] = useState(false)

  const upload = async (file: File): Promise<string | null> => {
    setUploading(true)
    try {
      return await uploadImage(file, 'project-media', `projects/${projectId}`)
    } catch (err) {
      console.error('Failed to upload image:', err)
      alert('업로드 실패')
      return null
    } finally {
      setUploading(false)
    }
  }

  return { upload, uploading }
}

interface MediaBlockFieldProps {
  block: MediaBlock
  onChange: (block: MediaBlock) => void
  projectId: string
  onDeleteImage: (url: string, patch: (block: Block) => Block) => Promise<boolean>
}

export const MediaBlockField = ({ block, onChange, projectId, onDeleteImage }: MediaBlockFieldProps) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const { upload, uploading } = useImageUpload(projectId)
  const imageUrls = block.urls?.length ? block.urls : block.url ? [block.url] : []

  const withImageUrls = (source: MediaBlock, urls: string[]): MediaBlock => ({
    ...source,
    url: urls[0] ?? '',
    urls,
  })

  const clearImage = async (index: number) => {
    const url = imageUrls[index]
    await onDeleteImage(url, (b) => {
      const media = b as MediaBlock
      const currentUrls = media.urls?.length ? media.urls : media.url ? [media.url] : []
      return withImageUrls(
        media,
        currentUrls.filter((_, itemIndex) => itemIndex !== index),
      )
    })
  }

  return (
    <div className='flex flex-col gap-2'>
      <div className='flex gap-1'>
        <button
          type='button'
          onClick={() => onChange({ ...block, mediaType: 'image' })}
          className={buttonClass(block.mediaType === 'image' ? 'secondary' : 'ghost', 'sm')}
        >
          이미지
        </button>
        <button
          type='button'
          onClick={() => onChange({ ...block, mediaType: 'video' })}
          className={buttonClass(block.mediaType === 'video' ? 'secondary' : 'ghost', 'sm')}
        >
          영상 (Vimeo · YouTube)
        </button>
      </div>

      {block.mediaType === 'image' ? (
        <>
          {imageUrls.length > 0 ? (
            <div className='flex flex-col gap-2'>
              {imageUrls.map((url, index) => (
                <div key={`${url}-${index}`} className='relative'>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={block.caption ?? ''} className='w-full rounded-md' />
                  <button
                    type='button'
                    onClick={() => clearImage(index)}
                    className={iconButtonClass({ danger: true }, 'absolute right-2 top-2 bg-surface/90')}
                    title='서버에서 삭제'
                  >
                    <GoTrash size={13} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className='rounded-inner bg-field py-8 text-center text-[13px] text-muted'>
              이미지가 없습니다
            </p>
          )}

          <input
            ref={inputRef}
            type='file'
            accept='image/*'
            multiple
            style={{ display: 'none' }}
            onChange={async (e) => {
              const files = Array.from(e.target.files ?? [])
              e.target.value = ''
              if (files.length === 0) return
              const uploaded = await Promise.all(files.map((file) => upload(file)))
              const newUrls = uploaded.filter((url): url is string => Boolean(url))
              if (newUrls.length > 0) onChange(withImageUrls(block, [...imageUrls, ...newUrls]))
            }}
          />
          <button
            type='button'
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className={buttonClass('secondary', 'sm', 'w-fit')}
          >
            {uploading ? '업로드 중...' : imageUrls.length > 0 ? '+ 이미지 추가' : '파일 업로드'}
          </button>

          <Input
            type='url'
            value={imageUrls[0] ?? ''}
            placeholder='또는 이미지 URL 직접 입력'
            onChange={(e) => {
              const url = e.target.value
              onChange(withImageUrls(block, url ? [url, ...imageUrls.slice(1)] : imageUrls.slice(1)))
            }}
          />
          <Input
            type='text'
            value={block.caption ?? ''}
            placeholder='캡션 (선택)'
            onChange={(e) => onChange({ ...block, caption: e.target.value })}
          />
        </>
      ) : (
        <>
          <Input
            type='url'
            value={block.url}
            placeholder='Vimeo 또는 YouTube 링크 (예: https://youtu.be/…, https://vimeo.com/123456789)'
            onChange={(e) => {
              const url = e.target.value
              const youtubeId = extractYoutubeId(url) ?? undefined
              onChange({ ...block, url, youtubeId, vimeoId: youtubeId ? undefined : (extractVimeoId(url) ?? undefined) })
            }}
          />
          {block.url && !block.vimeoId && !block.youtubeId && (
            <p className='text-xs text-danger'>Vimeo 또는 YouTube 영상 링크가 아닙니다</p>
          )}
          {block.youtubeId && <YoutubePlayer source={block.url || block.youtubeId} title={block.caption || 'YouTube video'} />}
          {block.vimeoId && <VimeoPlayer source={block.url || block.vimeoId} title={block.caption || 'Vimeo video'} />}
          <Input
            type='text'
            value={block.caption ?? ''}
            placeholder='캡션 (선택)'
            onChange={(e) => onChange({ ...block, caption: e.target.value })}
          />
        </>
      )}
    </div>
  )
}

interface GalleryBlockFieldProps {
  block: GalleryBlock
  onChange: (block: GalleryBlock) => void
  projectId: string
  onDeleteImage: (url: string, patch: (block: Block) => Block) => Promise<boolean>
}

export const GalleryBlockField = ({ block, onChange, projectId, onDeleteImage }: GalleryBlockFieldProps) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const { upload, uploading } = useImageUpload(projectId)

  const updateItem = (index: number, item: GalleryItem) => {
    const items = block.items.slice()
    items[index] = item
    onChange({ ...block, items })
  }

  const removeItem = async (index: number) => {
    const url = block.items[index].url
    await onDeleteImage(url, (b) => ({
      ...(b as GalleryBlock),
      items: (b as GalleryBlock).items.filter((_, i) => i !== index),
    }))
  }

  return (
    <div className='flex flex-col gap-3'>
      {block.items.length > 0 && (
        <ul className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
          {block.items.map((item, i) => (
            <li key={i} className='flex flex-col gap-1.5'>
              <div className='relative'>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.url} alt={item.caption ?? ''} className='aspect-square w-full rounded-md object-cover' />
                <button
                  type='button'
                  onClick={() => removeItem(i)}
                  className={iconButtonClass({ danger: true }, 'absolute right-1 top-1 bg-surface/90')}
                  title='서버에서 삭제'
                >
                  <GoTrash size={12} />
                </button>
              </div>
              <Input
                type='text'
                value={item.caption ?? ''}
                placeholder='캡션 (선택)'
                onChange={(e) => updateItem(i, { ...item, caption: e.target.value })}
                className='mb-0!'
              />
            </li>
          ))}
        </ul>
      )}

      <input
        ref={inputRef}
        type='file'
        accept='image/*'
        multiple
        style={{ display: 'none' }}
        onChange={async (e) => {
          const files = Array.from(e.target.files ?? [])
          e.target.value = ''
          if (files.length === 0) return
          const uploaded = await Promise.all(files.map((f) => upload(f)))
          const newUrls = uploaded.filter((url): url is string => !!url)
          onChange({ ...block, items: [...block.items, ...newUrls.map((url) => ({ url }))] })
        }}
      />
      <button
        type='button'
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className={buttonClass('secondary', 'sm', 'w-fit')}
      >
        {uploading ? '업로드 중...' : '+ 이미지 추가'}
      </button>
    </div>
  )
}
