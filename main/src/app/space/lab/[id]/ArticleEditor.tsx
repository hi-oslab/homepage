'use client'

import classNames from 'classnames'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'
import { GoArrowLeft, GoEye, GoLinkExternal } from 'react-icons/go'
import { BlockEditor } from '@/components/admin/BlockEditor'
import { AutoTextarea } from '@/components/admin/BlockEditor/AutoTextarea'
import { PreviewModal } from '@/components/admin/PreviewModal'
import {
  EditorBar,
  Field,
  ImageDrop,
  Input,
  Panel,
  SaveState,
  Select,
  Switch,
  Textarea,
  buttonClass,
  useSaveShortcut,
  useToast,
  useUnsavedWarning,
} from '@/components/admin/ui'
import { LabArticleLayout } from '@/components/LabArticleLayout'
import { parseBlocks, serializeBlocks } from '@/lib/blocks'
import { callAction } from '@/lib/call-action'
import type { LabArticle, LabArticleInput, LabIssue } from '@/lib/lab-types'
import { deleteImage, isOwnStorageUrl, uploadImage } from '@/lib/storage'
import type { Block } from '@/types/blocks'
import { deleteArticleAction, updateArticleAction } from '../actions'

type Draft = Omit<LabArticleInput, 'content'>

const toDraft = (article: LabArticle): Draft => ({
  issue_id: article.issue_id,
  slug: article.slug,
  title: article.title,
  subtitle: article.subtitle,
  description: article.description,
  thumbnail_url: article.thumbnail_url,
  published: article.published,
})

const slugify = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-')

/** Lab Space 글 편집 (프로젝트 편집과 같은 구성: 제목 · 부제 · 블록 본문 | 썸네일 · 정보) */
export function ArticleEditor({
  initialArticle,
  issues,
  author,
}: {
  initialArticle: LabArticle
  issues: LabIssue[]
  /** 미리보기에 보일 글쓴이 (나) */
  author: { name: string; image: string | null }
}) {
  const router = useRouter()
  const toast = useToast()
  const articleId = initialArticle.id
  const [draft, setDraft] = useState<Draft>(() => toDraft(initialArticle))
  const [blocks, setBlocks] = useState<Block[]>(() => parseBlocks(initialArticle.content))
  const [saved, setSaved] = useState(() =>
    JSON.stringify({ draft: toDraft(initialArticle), content: initialArticle.content }),
  )
  const [savedSlug, setSavedSlug] = useState(initialArticle.slug)
  const [wasPublished, setWasPublished] = useState(initialArticle.published)
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
    if (!draft.slug.trim()) return toast.show('Slug를 입력해 주세요', 'error')
    startSaving(async () => {
      const result = await callAction(() =>
        updateArticleAction(articleId, { ...draft, slug: draft.slug.trim(), content }),
      )
      if ('message' in result) return toast.show(result.message, 'error')
      const next = toDraft(result.data!)
      setDraft(next)
      setSaved(JSON.stringify({ draft: next, content: result.data!.content }))
      setSavedSlug(result.data!.slug)
      setWasPublished(result.data!.published)
      toast.show('저장했어요')
    })
  }
  useSaveShortcut(save)

  // 블록 안 이미지를 지울 때는 스토리지에서 삭제 후 본문만 즉시 저장
  const persistContent = async (nextContent: string) => {
    await updateArticleAction(articleId, { content: nextContent })
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
      const url = await uploadImage(file, 'project-media', `lab/${articleId}`)
      patch('thumbnail_url', url)
      if (previous && isOwnStorageUrl(previous)) await deleteImage(previous).catch(console.error)
    } catch (error) {
      console.error(error)
      toast.show('썸네일을 업로드하지 못했어요', 'error')
    }
  }

  const remove = () => {
    if (!confirm(`'${draft.title}' 글을 삭제할까요?\n삭제하면 되돌릴 수 없어요.`)) return
    startSaving(async () => {
      const result = await callAction(() => deleteArticleAction(articleId))
      if ('message' in result) return toast.show(result.message, 'error')
      setSaved(JSON.stringify({ draft, content })) // 경고 없이 이동
      router.push('/space/lab')
    })
  }

  const issueTitle = issues.find((issue) => issue.id === draft.issue_id)?.title ?? ''

  return (
    <div className='flex flex-col gap-6'>
      {/* 상단 바 */}
      <EditorBar>
        <Link
          href='/space/lab'
          onClick={(event) => {
            if (dirty && !confirm('저장하지 않은 변경사항이 있어요. 나가시겠어요?')) event.preventDefault()
          }}
          className='flex items-center gap-1.5 text-sm text-mute transition-colors hover:text-ink'
        >
          <GoArrowLeft size={14} />
          <span className='hidden sm:inline'>Lab Space</span>
        </Link>
        <div className='flex items-center gap-2'>
          <SaveState dirty={dirty} saving={isSaving} className='mr-1 hidden sm:inline-flex' />
          <span
            title={draft.published ? '저장하면 Lab Space에 표시돼요' : '비공개 글은 Lab Space에 표시되지 않아요'}
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
          {wasPublished && (
            <a
              href={`/lab-space/${savedSlug}`}
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
            <kbd className='hidden font-sans text-[11px] text-white/60 sm:inline'>⌘S</kbd>
          </button>
        </div>
      </EditorBar>

      <div className='grid grid-cols-1 gap-6 xl:grid-cols-[340px_minmax(0,1fr)]'>
        <div className='flex w-full max-w-4xl min-w-0 flex-col gap-3 justify-self-center'>
          <HeadingField label='제목' required empty={!draft.title.trim()}>
            <AutoTextarea
              value={draft.title}
              onChange={(event) => patch('title', event.target.value.replace(/\n/g, ''))}
              placeholder='제목을 입력하세요'
              className='text-3xl leading-tight font-medium tracking-[-0.04em] md:text-4xl'
            />
          </HeadingField>
          <HeadingField label='부제' hint='한 줄로 글을 소개해 주세요'>
            <AutoTextarea
              value={draft.subtitle}
              onChange={(event) => patch('subtitle', event.target.value.replace(/\n/g, ''))}
              placeholder='예: 이번 주에 만든 것, 배운 것'
              className='text-base md:text-lg'
            />
          </HeadingField>

          <span className='text-sm text-mute'>본문</span>
          <section className='rounded-block flex flex-col gap-1 bg-surface py-8 pr-4 pl-1 md:py-12 md:pr-8 md:pl-2'>
            <BlockEditor
              blocks={blocks}
              onChange={setBlocks}
              projectId={`lab-${articleId}`}
              onDeleteImage={removeMedia}
              onPersistContent={persistContent}
            />
          </section>
        </div>

        {/* 썸네일 · 정보 (넓은 화면: 왼쪽 고정, 좁은 화면: 본문 위) */}
        <aside className='order-first flex flex-col gap-3 xl:sticky xl:top-[calc(var(--spacing-header)+5rem)] xl:self-start'>
          <Panel title='썸네일'>
            <ImageDrop
              url={draft.thumbnail_url}
              onUpload={uploadThumbnail}
              onRemove={() => patch('thumbnail_url', null)}
              aspect='aspect-[4/3]'
            />
          </Panel>

          <Panel title='정보'>
            <Field label='토픽'>
              <Select value={draft.issue_id} onChange={(event) => patch('issue_id', event.target.value)}>
                {issues.map((issue) => (
                  <option key={issue.id} value={issue.id}>
                    {issue.title}
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              label='Slug (주소)'
              hint={
                <>
                  hioslab.com/lab-space/<span className='text-ink'>{draft.slug || '…'}</span>
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
            <Field label='설명' hint='목록 카드와 검색 결과 설명에 쓰여요.'>
              <Textarea
                rows={4}
                value={draft.description}
                onChange={(event) => patch('description', event.target.value)}
              />
            </Field>
          </Panel>

          <button type='button' onClick={remove} className={buttonClass('danger', 'md', 'self-start')}>
            이 글 삭제
          </button>
        </aside>
      </div>

      <PreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={draft.title || '제목 없음'}
        meta={dirty ? '저장 전 내용' : draft.published ? `/lab-space/${draft.slug}` : '비공개'}
      >
        <LabArticleLayout
          article={{
            ...initialArticle,
            ...draft,
            content,
            author_name: author.name,
            author_image: author.image,
            issue_title: issueTitle,
          }}
        />
      </PreviewModal>
      {toast.node}
    </div>
  )
}

/** 제목 · 부제 상자 여백: 본문 상자의 글 시작 위치(블록 조작 칸 뒤)에 맞춘다 */
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
  empty?: boolean
  children: React.ReactNode
}) {
  return (
    <>
      <div className='flex items-baseline gap-2 text-sm text-mute'>{label}</div>
      <label
        className={classNames('rounded-block group/field flex cursor-text flex-col gap-1.5 bg-surface', BOX_PADDING)}
      >
        <span className='flex items-baseline gap-2 text-xs text-mute transition-colors group-focus-within/field:text-ink'>
          {required && empty && <span className='text-danger'>필수</span>}
          {hint && <span className='text-ink/30'>{hint}</span>}
        </span>
        {children}
      </label>
    </>
  )
}
