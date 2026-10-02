'use client'

import classNames from 'classnames'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'
import { GoArrowLeft, GoEye, GoLinkExternal } from 'react-icons/go'
import { BlockEditor } from '@/components/admin/BlockEditor'
import { AutoTextarea } from '@/components/admin/BlockEditor/AutoTextarea'
import {
  EditorBar,
  Field,
  ImageDrop,
  Input,
  Panel,
  SaveState,
  Switch,
  TagInput,
  Textarea,
  buttonClass,
  useSaveShortcut,
  useToast,
  useUnsavedWarning,
} from '@/components/admin/ui'
import { PreviewModal } from '@/components/admin/PreviewModal'
import { WorkDetailLayout } from '@/components/WorkDetailLayout'
import { deleteImage, isOwnStorageUrl, uploadImage } from '@/lib/storage'
import { parseBlocks, serializeBlocks } from '@/lib/blocks'
import type { Block } from '@/types/blocks'
import type { Work, WorkInput } from '@/types/cms'
import { deleteWorkAction, updateWorkAction } from '../actions'

type Draft = Omit<WorkInput, 'content' | 'display_order'>

const toDraft = (work: Work): Draft => ({
  slug: work.slug,
  title: work.title,
  subtitle: work.subtitle,
  description: work.description,
  year: work.year,
  project_date: work.project_date,
  category: work.category,
  tags: work.tags,
  thumbnail_url: work.thumbnail_url,
  published: work.published,
})

const slugify = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-')

export function WorkEditor({
  initialWork,
  categories,
  tags,
  canDelete,
}: {
  initialWork: Work
  categories: string[]
  tags: string[]
  /** 마스터이거나 본인이 쓴 작품일 때만 */
  canDelete: boolean
}) {
  const router = useRouter()
  const toast = useToast()
  const [workId] = useState(initialWork.id)
  const [draft, setDraft] = useState<Draft>(() => toDraft(initialWork))
  const [blocks, setBlocks] = useState<Block[]>(() => parseBlocks(initialWork.content))
  const [saved, setSaved] = useState(() =>
    JSON.stringify({ draft: toDraft(initialWork), content: initialWork.content }),
  )
  const [savedSlug, setSavedSlug] = useState(initialWork.slug)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [isSaving, startSaving] = useTransition()

  // 비어 있는 문단(엔터로 만든 빈 줄)은 저장하지 않는다
  const content = useMemo(
    () => serializeBlocks(blocks.filter((block) => !(block.type === 'paragraph' && !block.text.trim()))),
    [blocks],
  )
  const dirty = JSON.stringify({ draft, content }) !== saved
  useUnsavedWarning(dirty)

  const patch = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }))

  const save = () => {
    if (isSaving) return
    if (!draft.slug.trim()) {
      toast.show('Slug를 입력해 주세요', 'error')
      return
    }
    startSaving(async () => {
      try {
        const result = await updateWorkAction(workId, {
          ...draft,
          slug: draft.slug.trim(),
          year: Number(draft.year),
          content,
        })
        const next = toDraft(result)
        setDraft(next)
        setSaved(JSON.stringify({ draft: next, content: result.content }))
        setSavedSlug(result.slug)
        toast.show('저장했습니다')
      } catch (error) {
        console.error(error)
        toast.show('저장하지 못했습니다. slug가 다른 프로젝트와 겹치지 않는지 확인하세요', 'error')
      }
    })
  }
  useSaveShortcut(save)

  // 블록 안 이미지를 지울 때는 스토리지에서 삭제 후 본문만 즉시 저장
  const persistContent = async (nextContent: string) => {
    await updateWorkAction(workId, { content: nextContent })
    setSaved((current) => JSON.stringify({ ...JSON.parse(current), content: nextContent }))
  }

  const removeMedia = async (url: string) => {
    if (!isOwnStorageUrl(url)) return true
    try {
      await deleteImage(url)
      return true
    } catch (error) {
      console.error(error)
      return false
    }
  }

  const uploadThumbnail = async (file: File) => {
    try {
      const previous = draft.thumbnail_url
      const url = await uploadImage(file, 'project-media', `projects/${workId}`)
      patch('thumbnail_url', url)
      if (previous && isOwnStorageUrl(previous)) await deleteImage(previous).catch(console.error)
    } catch (error) {
      console.error(error)
      toast.show('썸네일을 업로드하지 못했습니다', 'error')
    }
  }

  const remove = async () => {
    if (!confirm(`'${draft.title}' 프로젝트를 삭제할까요?\n삭제하면 되돌릴 수 없습니다.`)) return
    await deleteWorkAction(workId)
    setSaved(JSON.stringify({ draft, content })) // 경고 없이 이동
    router.push('/space/works')
  }

  return (
    <div className='flex flex-col gap-6'>
      {/* 상단 바 */}
      <EditorBar>
        <Link
          href='/space/works'
          onClick={(event) => {
            if (dirty && !confirm('저장하지 않은 변경사항이 있습니다. 나가시겠어요?')) event.preventDefault()
          }}
          className='flex items-center gap-1.5 text-sm text-mute transition-colors hover:text-ink'
        >
          <GoArrowLeft size={14} />
          <span className='hidden sm:inline'>프로젝트 목록</span>
        </Link>
        <div className='flex items-center gap-2'>
          <SaveState dirty={dirty} saving={isSaving} className='mr-1 hidden sm:inline-flex' />
          {/* 공개 상태: 바꾼 뒤 저장하면 사이트에 반영된다 */}
          <span
            title={draft.published ? '저장하면 사이트에 표시됩니다' : '비공개 프로젝트는 사이트에 표시되지 않습니다'}
            className='mr-1 flex items-center'
          >
            <Switch
              checked={draft.published}
              onChange={(value) => patch('published', value)}
              label={draft.published ? '공개' : '비공개'}
            />
          </span>
          <button type='button' onClick={() => setPreviewOpen(true)} className={buttonClass('secondary')}>
            <GoEye size={14} />
            <span className='hidden sm:inline'>미리보기</span>
          </button>
          {initialWork.published && (
            <a
              href={`/work/${savedSlug}`}
              target='_blank'
              rel='noopener noreferrer'
              className={buttonClass('ghost', 'md', 'hidden sm:inline-flex')}
            >
              <GoLinkExternal size={13} />
              페이지 보기
            </a>
          )}
          <button type='button' onClick={save} disabled={isSaving || !dirty} className={buttonClass('primary')}>
            저장
            <kbd className='hidden font-sans text-[11px] text-paper/50 sm:inline'>⌘S</kbd>
          </button>
        </div>
      </EditorBar>

      <div className='grid grid-cols-1 gap-6 xl:grid-cols-[340px_minmax(0,1fr)]'>
        {/* 제목 · 부제 · 본문을 각각 흰 상자로, 세 상자를 합쳐 최대 960px */}
        <div className='flex w-full max-w-4xl min-w-0 flex-col gap-3 justify-self-center'>
          <HeadingField label='프로젝트 제목' required empty={!draft.title.trim()}>
            <AutoTextarea
              value={draft.title}
              onChange={(event) => patch('title', event.target.value.replace(/\n/g, ''))}
              placeholder='제목을 입력하세요'
              className='text-3xl leading-tight font-medium md:text-4xl'
            />
          </HeadingField>
          <HeadingField label='부제' hint='한 줄로 프로젝트를 소개해 주세요'>
            <AutoTextarea
              value={draft.subtitle}
              onChange={(event) => patch('subtitle', event.target.value.replace(/\n/g, ''))}
              placeholder='예: 소리에 반응하는 빛으로 만든 공간 설치'
              className='text-base md:text-lg'
            />
          </HeadingField>

          {/* 본문 (블록 왼쪽 조작 칸이 상자 안에 들어가도록 왼쪽 여백은 좁게) */}
          <span className='text-sm text-mute'>본문</span>
          <section className='rounded-block flex flex-col gap-1 bg-surface py-8 pr-4 pl-1 md:py-12 md:pr-8 md:pl-2'>
            <BlockEditor
              blocks={blocks}
              onChange={setBlocks}
              projectId={workId}
              onDeleteImage={removeMedia}
              onPersistContent={persistContent}
            />
          </section>
        </div>

        {/* 설정 */}
        {/* 썸네일 · 기본 정보
 넓은 화면: 왼쪽에 두고 상단 바 아래에 고정 (따로 스크롤하지 않는다)
 좁은 화면: 본문보다 위에 두고 함께 스크롤 */}
        <aside className='order-first flex flex-col gap-3 xl:sticky xl:top-[calc(var(--spacing-header)+5rem)] xl:self-start'>
          <Panel title='썸네일'>
            <ImageDrop
              url={draft.thumbnail_url}
              onUpload={uploadThumbnail}
              onRemove={() => patch('thumbnail_url', null)}
              aspect='aspect-16/9'
            />
          </Panel>

          <Panel title='정보'>
            <Field
              label='Slug (주소)'
              hint={
                <>
                  hioslab.com/work/<span className='text-ink'>{draft.slug || '…'}</span>
                </>
              }
            >
              <div className='flex gap-1.5'>
                <Input
                  value={draft.slug}
                  onChange={(event) => patch('slug', event.target.value.toLowerCase().replace(/\s+/g, '-'))}
                />
                <button
                  type='button'
                  className={buttonClass('secondary', 'md', 'shrink-0')}
                  title='제목의 영문/숫자로 slug 만들기'
                  onClick={() => {
                    const next = slugify(draft.title)
                    if (next) patch('slug', next)
                    else toast.show('제목에 영문이 없어요. slug를 직접 입력해 주세요', 'info')
                  }}
                >
                  자동
                </button>
              </div>
            </Field>
            <Field label='카테고리'>
              <Input
                list='work-categories'
                value={draft.category}
                onChange={(event) => patch('category', event.target.value)}
                placeholder='예: 오픈소스랩 기획전시'
              />
              <datalist id='work-categories'>
                {categories.map((item) => (
                  <option key={item} value={item} />
                ))}
              </datalist>
            </Field>
            <div className='grid grid-cols-2 gap-2'>
              <Field label='연도'>
                <Input
                  type='number'
                  value={draft.year}
                  onChange={(event) => patch('year', Number(event.target.value))}
                />
              </Field>
              <Field label='날짜 (선택)'>
                <Input
                  type='date'
                  value={draft.project_date ?? ''}
                  onChange={(event) => patch('project_date', event.target.value || null)}
                />
              </Field>
            </div>
            <Field label='키워드'>
              <TagInput value={draft.tags} onChange={(value) => patch('tags', value)} suggestions={tags} />
            </Field>
            <Field label='설명' hint='상세 페이지 정보란과 검색 결과 설명에 사용됩니다.'>
              <Textarea
                rows={4}
                value={draft.description}
                onChange={(event) => patch('description', event.target.value)}
              />
            </Field>
          </Panel>

          {canDelete && (
            <button type='button' onClick={remove} className={buttonClass('danger', 'md', 'self-start')}>
              이 프로젝트 삭제
            </button>
          )}
        </aside>
      </div>
      <PreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={draft.title || '제목 없음'}
        meta={dirty ? '저장 전 내용' : draft.published ? `/work/${draft.slug}` : '비공개'}
      >
        <WorkDetailLayout work={{ ...initialWork, ...draft, content }} />
      </PreviewModal>
      {toast.node}
    </div>
  )
}

/** 제목 · 부제 입력 영역: 위에 이름표, 올리면 옅은 면, 입력 중에는 진한 면 */
/**
 * 제목 · 부제 상자 여백: 본문 상자의 글 시작 위치에 맞춘다
 * 본문은 왼쪽 여백(4px · md 8px) + 블록 조작 칸(54px · md 64px) 뒤에서 글이 시작한다.
 */
const BOX_PADDING = 'py-5 pr-4 pl-[58px] md:py-6 md:pr-8 md:pl-[72px]'

function HeadingField({
  label,
  hint,
  required,
  empty,
  children,
}: {
  label: string
  hint?: string
  required?: boolean
  /** 필수인데 비어 있으면 이름표에 표시 */
  empty?: boolean
  children: React.ReactNode
}) {
  return (
    <>
      <div className='flex items-baseline gap-2 text-sm text-mute'>{label}</div>
      <label
        className={classNames('rounded-block group/field flex cursor-text flex-col gap-1.5 bg-surface', BOX_PADDING)}
      >
        {/* 입력 중에는 이름표를 진하게 */}
        <span className='flex items-baseline gap-2 text-xs text-mute transition-colors group-focus-within/field:text-ink'>
          {required && empty && <span className='text-danger'>필수</span>}
          {hint && <span className='text-ink/30'>{hint}</span>}
        </span>
        {children}
      </label>
    </>
  )
}
