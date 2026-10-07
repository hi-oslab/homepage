'use client'

import classNames from 'classnames'
import { Reorder, useDragControls } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useRef, useState, useTransition } from 'react'
import {
  GoArrowUpRight,
  GoChevronRight,
  GoFileDirectoryFill,
  GoGear,
  GoGrabber,
  GoPencil,
  GoPlus,
  GoStarFill,
  GoTrash,
} from 'react-icons/go'
import { Modal } from '@/components/admin/Modal'
import {
  Checkbox,
  Field,
  Input,
  Select,
  StatusBadge,
  Switch,
  Textarea,
  buttonClass,
  iconButtonClass,
  useServerState,
  useToast,
} from '@/components/admin/ui'
import { callAction } from '@/lib/call-action'
import {
  LAB_BEST_PERIODS,
  LAB_ISSUE_TITLE_MAX,
  LAB_RECOMMEND_MODES,
  LAB_SECTION_LIMITS,
  issuePhase,
  canEditLabArticle,
  type LabEditAccess,
  type LabEditorOption,
  type LabArticleCard,
  type LabIssue,
  type LabSettings,
} from '@/lib/lab-types'
import { RelativeTime } from '../DashboardActions'
import {
  createArticleAction,
  createIssueAction,
  deleteArticlesAction,
  deleteIssueAction,
  reorderIssuesAction,
  saveSettingsAction,
  setRecommendedAction,
  updateIssueAction,
} from './actions'

/**
 * 멤버 공간 Lab Space: 토픽(DB의 issue)마다 글을 모아 관리한다
 * 첫 화면에는 토픽 폴더만 보여주고, 토픽을 열면 그 안의 글 목록으로 한 단계 들어간다
 * 리드 멤버(운영자)는 토픽 목록에서 바로 순서 · 고치기 · 지우기를 관리한다
 */
export function LabManager({
  issues: initialIssues,
  articles: initialArticles,
  userId,
  isLead,
  settings: initialSettings,
  settingsReady,
  editors,
}: {
  issues: LabIssue[]
  /** 멤버: 편집 가능한 글 / 운영자: 모든 글 */
  articles: LabArticleCard[]
  userId: string
  isLead: boolean
  /** 공개 페이지 섹션 설정 (리드 멤버만 고친다) */
  settings: LabSettings
  /** 설정 표가 있는지 (20261012 마이그레이션) */
  settingsReady: boolean
  editors: LabEditorOption[]
}) {
  const toast = useToast()
  const router = useRouter()
  const [issues, setIssues] = useServerState(initialIssues)
  const [articles, setArticles] = useServerState(initialArticles)
  const [settings, setSettings] = useServerState(initialSettings)
  /** null은 토픽 루트, id는 열린 토픽이다. */
  const [topicId, setTopicId] = useState<string | null>(null)
  const openLocation = (id: string | null) => {
    if (id === topicId) return
    setTopicId(id)
    setSelected(new Set())
  }
  const [form, setForm] = useState<IssueForm | null>(null)
  const [configuring, setConfiguring] = useState(false)
  const [creating, startCreating] = useTransition()
  const [createFor, setCreateFor] = useState<LabIssue | null>(null)
  const [saving, startSaving] = useTransition()
  /** 목록에서 고른 글 (지우기) */
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const [deleting, startDeleting] = useTransition()

  const topic = issues.find((issue) => issue.id === topicId) ?? null
  const mine = articles.filter((article) => article.author_id === userId)
  const published = mine.filter((article) => article.published)
  const views = published.reduce((sum, article) => sum + article.view_count, 0)
  // 토픽 색: 목록 순서대로 돌려 쓴다 (왼쪽 목록 · 글 목록이 같은 색)
  const colorOf = (id: string) =>
    TOPIC_COLORS[
      Math.max(
        0,
        issues.findIndex((issue) => issue.id === id),
      ) % TOPIC_COLORS.length
    ]
  const countOf = (id: string) => articles.filter((article) => article.issue_id === id).length
  // '최신'은 순서와 상관없이 가장 최근에 만든 토픽
  const latestId = issues.reduce<LabIssue | null>(
    (latest, issue) => (!latest || issue.created_at > latest.created_at ? issue : latest),
    null,
  )?.id
  // 추천 스위치는 '직접 선택'일 때만 의미가 있다
  const manualRecommend = isLead && settings.recommend_enabled && settings.recommend_mode === 'manual'

  const write = (access: LabEditAccess) => {
    const issue = createFor
    if (!issue) return
    if (creating) return
    startCreating(async () => {
      // 성공하면 서버가 편집 화면으로 보낸다. 작성 기간이 아니면 안내만 돌아온다
      const result = await createArticleAction(issue.id, access)
      if (result && 'message' in result) toast.show(result.message, 'error')
    })
  }

  /* 토픽 저장 · 지우기 · 순서 (리드 멤버) */
  const saveIssue = () => {
    if (!form || !form.title.trim()) return
    startSaving(async () => {
      const input = {
        title: form.title,
        description: form.description,
        opens_at: fromLocalInput(form.opensAt),
        closes_at: form.noDeadline ? null : fromLocalInput(form.closesAt),
      }
      const result = await callAction(() => (form.id ? updateIssueAction(form.id, input) : createIssueAction(input)))
      if ('message' in result) return toast.show(result.message, 'error')
      const issue = result.data!
      setIssues((current) =>
        form.id ? current.map((item) => (item.id === issue.id ? issue : item)) : [issue, ...current],
      )
      openLocation(issue.id)
      setForm(null)
      toast.show(form.id ? '토픽을 고쳤어요' : '토픽을 만들었어요')
    })
  }

  const removeIssue = (issue: LabIssue) => {
    if (countOf(issue.id) > 0) return toast.show('글이 있는 토픽은 지울 수 없어요', 'error')
    if (!confirm(`'${issue.title}' 토픽을 정말 지울까요?\n\n삭제한 토픽은 복구할 수 없어요.`)) return
    startSaving(async () => {
      const result = await callAction(() => deleteIssueAction(issue.id))
      if ('message' in result) return toast.show(result.message, 'error')
      setIssues((current) => current.filter((item) => item.id !== issue.id))
      if (topicId === issue.id) openLocation(null)
      toast.show('토픽을 지웠어요')
    })
  }

  // 끌어서 놓으면 지금 순서를 저장한다 (실패하면 서버 순서로 되돌아간다)
  const issuesRef = useRef(issues)
  issuesRef.current = issues
  const saveOrder = () => {
    const ids = issuesRef.current.map((issue) => issue.id)
    startSaving(async () => {
      const result = await callAction(() => reorderIssuesAction(ids))
      if ('message' in result) {
        toast.show(result.message, 'error')
        router.refresh()
      }
    })
  }

  // 오른쪽 글: 토픽 순서대로 묶고, 묶음 안에서는 최근에 쓴 글부터
  const groups = issues
    .filter((issue) => !topicId || issue.id === topicId)
    .map((issue) => ({
      issue,
      rows: articles
        .filter((article) => article.issue_id === issue.id)
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),
    }))
    .filter((group) => group.rows.length > 0)
  const total = groups.reduce((sum, group) => sum + group.rows.length, 0)

  /* 선택 · 지우기: 멤버는 직접 작성한 글만, 운영자는 모든 글 */
  const canDelete = (article: LabArticleCard) => isLead || article.author_id === userId
  const selectable = groups.flatMap((group) => group.rows).filter(canDelete)
  // 토픽을 바꿔도 선택은 남지만, 지우는 건 지금 보이는 글만
  const chosen = selectable.filter((article) => selected.has(article.id))
  const select = (ids: string[], checked: boolean) =>
    setSelected((current) => {
      const next = new Set(current)
      ids.forEach((id) => (checked ? next.add(id) : next.delete(id)))
      return next
    })

  const deleteSelected = () => {
    if (chosen.length === 0) return
    const others = chosen.filter((article) => article.author_id !== userId).length
    const titles =
      chosen
        .slice(0, 5)
        .map((article) => `· ${article.title || '제목 없음'}`)
        .join('\n') + (chosen.length > 5 ? `\n외 ${chosen.length - 5}개` : '')
    if (
      !confirm(
        `글 ${chosen.length}개를 지울까요?\n${titles}\n\n` +
          (others > 0 ? `다른 멤버가 쓴 글 ${others}개가 포함돼 있어요.\n` : '') +
          '공개 페이지에서도 사라지고, 되돌릴 수 없어요.',
      )
    )
      return
    startDeleting(async () => {
      const result = await callAction(() => deleteArticlesAction(chosen.map((article) => article.id)))
      if ('message' in result) return toast.show(result.message, 'error')
      const deleted = new Set(result.data)
      setArticles((current) => current.filter((article) => !deleted.has(article.id)))
      setSelected((current) => new Set(Array.from(current).filter((id) => !deleted.has(id))))
      toast.show(`글 ${deleted.size}개를 지웠어요`)
    })
  }

  return (
    <div className='flex flex-col gap-6'>
      {/* 제목 · 내 기록 */}
      <header className='flex flex-wrap items-end justify-between gap-x-6 gap-y-2'>
        <div className='flex flex-col gap-1'>
          <h1 className='text-3xl font-medium md:text-4xl'>Lab Space</h1>
          <p className='text-sm text-mute tabular-nums'>
            작성한 글 {mine.length} · 공개 {published.length} · 조회 {views.toLocaleString()}
            {mine.some((article) => article.recommended_at) && (
              <span className='text-accent'> · 추천 {mine.filter((article) => article.recommended_at).length}</span>
            )}
          </p>
        </div>
        <div className='flex items-center gap-1'>
          {isLead && (
            <button type='button' onClick={() => setConfiguring(true)} className={buttonClass('ghost', 'sm')}>
              <GoGear size={13} />
              공개 페이지 설정
            </button>
          )}
          <a href='/lab-space' target='_blank' rel='noopener noreferrer' className={buttonClass('ghost', 'sm')}>
            공개 페이지
            <GoArrowUpRight size={13} />
          </a>
        </div>
      </header>

      <nav
        aria-label='Lab Space 위치'
        className='rounded-block sticky top-header z-20 flex min-w-0 items-center gap-1.5 bg-surface/95 p-2 shadow-[0_8px_24px_rgb(var(--shadow-rgb)/0.06)] backdrop-blur-xl'
      >
        <button
          type='button'
          onClick={() => openLocation(null)}
          aria-current={!topic ? 'page' : undefined}
          className={buttonClass(topic ? 'ghost' : 'secondary', 'sm')}
        >
          토픽
        </button>
        {topic && (
          <>
            <GoChevronRight className='shrink-0 text-mute' size={13} />
            <button type='button' aria-current='page' className={buttonClass('secondary', 'sm', 'min-w-0 max-w-full')}>
              <span className='truncate'>{topic.title}</span>
            </button>
          </>
        )}
      </nav>

      {!topic ? (
        <section className='flex min-w-0 flex-col gap-3'>
          <div className='flex flex-wrap items-end justify-between gap-3 px-1'>
            <div>
              <h2 className='text-xl font-medium'>토픽</h2>
              <p className='mt-1 text-xs text-mute'>토픽을 열어 글을 확인하세요.</p>
            </div>
            {isLead && (
              <button type='button' onClick={() => setForm(emptyForm())} className={buttonClass('primary', 'sm')}>
                <GoPlus size={13} />새 토픽
              </button>
            )}
          </div>

          <div className='rounded-block flex min-w-0 flex-col gap-1 bg-surface p-2'>
            {isLead && issues.length > 1 && (
              <p className='px-2 py-1 text-xs text-mute'>손잡이를 끌어 공개 페이지의 토픽 순서를 바꿀 수 있어요.</p>
            )}
            {isLead ? (
              <Reorder.Group axis='y' values={issues} onReorder={setIssues} className='flex flex-col gap-1'>
                {issues.map((issue) => (
                  <TopicManageRow
                    key={issue.id}
                    issue={issue}
                    active={false}
                    latest={issue.id === latestId}
                    color={colorOf(issue.id)}
                    count={countOf(issue.id)}
                    saving={saving}
                    onSelect={() => openLocation(issue.id)}
                    onDragEnd={saveOrder}
                    onEdit={() => setForm(formOf(issue))}
                    onRemove={() => removeIssue(issue)}
                  />
                ))}
              </Reorder.Group>
            ) : (
              <div className='flex flex-col gap-1'>
                {issues.map((issue) => (
                  <TopicButton
                    key={issue.id}
                    active={false}
                    title={issue.title}
                    latest={issue.id === latestId}
                    period={issue}
                    color={colorOf(issue.id)}
                    count={countOf(issue.id)}
                    onClick={() => openLocation(issue.id)}
                  />
                ))}
              </div>
            )}
            {issues.length === 0 && (
              <p className='px-3 py-12 text-center text-sm text-mute'>
                {isLead ? '첫 토픽을 만들어 보세요.' : '아직 열린 토픽이 없어요.'}
              </p>
            )}
          </div>
        </section>
      ) : (
        <section className='flex min-w-0 flex-col gap-3'>
          <TopicCover topic={topic} total={countOf(topic.id)} creating={creating} onWrite={setCreateFor} />

          <div className='flex min-h-8 flex-wrap items-center gap-2 px-1'>
            <span className='flex flex-wrap items-center gap-2'>
              <span className='text-xs text-mute tabular-nums'>
                {!isLead ? '편집 가능한 글' : '글'} {total}
              </span>
              {chosen.length > 0 && (
                <>
                  <span className='text-xs tabular-nums'>· {chosen.length}개 선택됨</span>
                  <button type='button' onClick={() => setSelected(new Set())} className={buttonClass('ghost', 'sm')}>
                    선택 해제
                  </button>
                  <button
                    type='button'
                    disabled={deleting}
                    onClick={deleteSelected}
                    className={buttonClass('danger', 'sm')}
                  >
                    <GoTrash size={12} />
                    {deleting ? '지우는 중…' : '선택 삭제'}
                  </button>
                </>
              )}
            </span>
          </div>

          {groups.length === 0 ? (
            <p className='rounded-block bg-surface py-14 text-center text-sm text-mute'>
              {!isLead ? '아직 편집 가능한 글이 없어요.' : '아직 글이 없어요.'}
            </p>
          ) : (
            <ArticleTable
              groups={groups}
              userId={userId}
              recommendSwitch={manualRecommend}
              showAuthor
              colorOf={colorOf}
              canDelete={canDelete}
              selected={selected}
              deleting={deleting}
              onSelect={select}
              onArticles={setArticles}
              onMessage={toast.show}
            />
          )}
        </section>
      )}

      <EditAccessModal
        open={Boolean(createFor)}
        editors={editors}
        ownerId={userId}
        saving={creating}
        title={createFor ? `'${createFor.title}'에 새 글` : '새 글'}
        onSave={write}
        onClose={() => setCreateFor(null)}
      />
      <IssueFormModal form={form} saving={saving} onChange={setForm} onClose={() => setForm(null)} onSave={saveIssue} />
      {isLead && (
        <SettingsModal
          open={configuring}
          settings={settings}
          ready={settingsReady}
          onSettings={setSettings}
          onMessage={toast.show}
          onClose={() => setConfiguring(false)}
        />
      )}
      {toast.node}
    </div>
  )
}

/** 토픽 색 (밝은 · 어두운 화면 모두에서 보이는 중간 톤) */
const TOPIC_COLORS = ['#5b5bd6', '#12a594', '#f76b15', '#d6409f', '#0090ff', '#8e4ec6', '#e5484d', '#978365']

/* ─── 토픽 기간 ───────────────────────────────────────────────────────── */

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso))

/** 작성 기간을 한 줄 말로: '10. 12. 18:00 마감' · '10. 5. 09:00부터' · '마감됨' · '마감 없음' */
function periodText(issue: LabIssue) {
  const phase = issuePhase(issue)
  if (phase === 'upcoming') return `${formatDate(issue.opens_at!)}부터 쓸 수 있어요`
  if (phase === 'closed') return '마감됨'
  return issue.closes_at ? `${formatDate(issue.closes_at)} 마감` : '마감 없음'
}

/* ─── 토픽 폴더 한 줄 ─────────────────────────────────────────────────── */

function TopicButton({
  active,
  title,
  latest,
  period,
  color,
  count,
  onClick,
}: {
  active: boolean
  title: string
  latest?: boolean
  /** 기간을 보여줄 토픽 (전체 글은 없음) */
  period?: LabIssue
  /** 토픽 색 (글 목록의 색 줄과 같다) */
  color?: string
  count: number
  onClick: () => void
}) {
  const closed = period && issuePhase(period) === 'closed'
  return (
    <button
      type='button'
      onClick={onClick}
      aria-current={active ? 'true' : undefined}
      className={classNames(
        'rounded-inner flex w-full min-w-0 items-center gap-3 px-2.5 py-2 text-left transition-colors',
        active ? 'bg-accent-soft text-accent' : 'hover:bg-ink/4',
      )}
    >
      {color && <GoFileDirectoryFill className='size-5 shrink-0 self-start mt-0.5' style={{ color }} />}
      <span className='flex min-w-0 flex-1 flex-col'>
        <span className='flex min-w-0 items-center gap-1.5 text-sm'>
          <span className={classNames('truncate', !active && closed && 'text-mute')}>{title}</span>
          {latest && <Badge className='bg-ink text-paper'>최신</Badge>}
        </span>
        {period && (
          <span className={classNames('truncate text-xs tabular-nums', active ? 'text-accent/70' : 'text-mute')}>
            {periodText(period)}
          </span>
        )}
      </span>
      <span className={classNames('shrink-0 text-xs tabular-nums', active ? 'text-accent' : 'text-mute')}>{count}</span>
      <GoChevronRight className='shrink-0 text-mute' size={13} />
    </button>
  )
}

/* ─── 연 토픽의 이름 · 설명 · 기간 · 글 쓰기 ───────────────────────────── */

function TopicCover({
  topic,
  total,
  creating,
  onWrite,
}: {
  topic: LabIssue
  total: number
  creating: boolean
  onWrite: (issue: LabIssue) => void
}) {
  const open = issuePhase(topic) === 'open'

  return (
    <div className='rounded-block flex flex-wrap items-end justify-between gap-4 bg-surface p-4'>
      <div className='flex min-w-0 flex-col gap-1'>
        <h2 className='truncate text-xl font-medium'>{topic.title}</h2>
        {topic.description && <p className='text-sm break-keep text-mute'>{topic.description}</p>}
        <p className='text-xs text-mute tabular-nums'>
          {periodText(topic)} · 글 {total}
        </p>
      </div>

      {/* 열린 토픽에 바로 글을 쓴다 */}
      {open ? (
        <button
          type='button'
          disabled={creating}
          onClick={() => onWrite(topic)}
          className={buttonClass('primary', 'md')}
        >
          <GoPencil size={14} />
          {creating ? '여는 중…' : '글 쓰기'}
        </button>
      ) : (
        <span className='text-xs text-mute'>
          {issuePhase(topic) === 'upcoming' ? '작성 기간이 시작되면 쓸 수 있어요' : '작성 기간이 끝났어요'}
        </span>
      )}
    </div>
  )
}

/* ─── 토픽 목록 관리 (리드 멤버): 순서 · 고치기 · 지우기 ────────────────── */

function TopicManageRow({
  issue,
  active,
  latest,
  color,
  count,
  saving,
  onSelect,
  onDragEnd,
  onEdit,
  onRemove,
}: {
  issue: LabIssue
  active: boolean
  latest: boolean
  color: string
  count: number
  saving: boolean
  onSelect: () => void
  onDragEnd: () => void
  onEdit: () => void
  onRemove: () => void
}) {
  // 손잡이로만 끈다 (버튼 누르기와 겹치지 않게)
  const controls = useDragControls()
  return (
    <Reorder.Item
      value={issue}
      dragListener={false}
      dragControls={controls}
      onDragEnd={onDragEnd}
      className={classNames(
        'rounded-inner flex min-w-0 items-center gap-1 bg-surface p-1 transition-colors',
        active ? 'bg-accent-soft text-accent' : 'hover:bg-ink/4',
      )}
    >
      <span
        onPointerDown={(event) => controls.start(event)}
        aria-label='끌어서 순서 바꾸기'
        title='끌어서 순서 바꾸기'
        className='flex size-7 shrink-0 cursor-grab touch-none items-center justify-center text-mute hover:text-ink active:cursor-grabbing'
      >
        <GoGrabber size={16} />
      </span>
      <button type='button' onClick={onSelect} className='flex min-w-0 flex-1 items-center gap-2 p-1 text-left'>
        <GoFileDirectoryFill className='size-5 shrink-0' style={{ color }} />
        <span className='flex min-w-0 flex-1 flex-col'>
          <span className='flex min-w-0 items-center gap-1.5 text-sm'>
            <span className='truncate'>{issue.title}</span>
            {latest && <Badge className='bg-ink text-paper'>최신</Badge>}
          </span>
          <span className={classNames('truncate text-xs tabular-nums', active ? 'text-accent/70' : 'text-mute')}>
            {periodText(issue)} · 글 {count}
          </span>
        </span>
      </button>
      <button
        type='button'
        aria-label={`${issue.title} 토픽 편집`}
        title='토픽 편집'
        onClick={onEdit}
        className={iconButtonClass({ size: 'sm' })}
      >
        <GoPencil size={13} />
      </button>
      <button
        type='button'
        aria-label={`${issue.title} 토픽 삭제`}
        title={count > 0 ? '글이 있는 토픽은 지울 수 없어요' : '토픽 삭제'}
        disabled={saving || count > 0}
        onClick={onRemove}
        className={iconButtonClass({ danger: true, size: 'sm' })}
      >
        <GoTrash size={13} />
      </button>
    </Reorder.Item>
  )
}

/* ─── 토픽 만들기 · 고치기 (작성 기간 포함) ─────────────────────────────── */

type IssueForm = {
  id: string | null
  title: string
  description: string
  /** datetime-local 값 (브라우저 시간대) */
  opensAt: string
  closesAt: string
  /** 마감 없이 풀어 두기 */
  noDeadline: boolean
}

/** ISO → datetime-local 입력값 (브라우저 시간대) */
const toLocalInput = (iso: string | null | undefined) => {
  if (!iso) return ''
  const date = new Date(iso)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
}
/** datetime-local 입력값 → ISO (비어 있으면 null) */
const fromLocalInput = (value: string) => (value ? new Date(value).toISOString() : null)

/** 새 토픽: 지금부터 일주일 뒤까지 */
const emptyForm = (): IssueForm => ({
  id: null,
  title: '',
  description: '',
  opensAt: toLocalInput(new Date().toISOString()),
  closesAt: toLocalInput(new Date(Date.now() + 7 * 864e5).toISOString()),
  noDeadline: false,
})

const formOf = (issue: LabIssue): IssueForm => ({
  id: issue.id,
  title: issue.title,
  description: issue.description,
  opensAt: toLocalInput(issue.opens_at ?? issue.created_at),
  closesAt: toLocalInput(issue.closes_at),
  noDeadline: !issue.closes_at,
})

function IssueFormModal({
  form,
  saving,
  onChange,
  onClose,
  onSave,
}: {
  form: IssueForm | null
  saving: boolean
  onChange: (form: IssueForm) => void
  onClose: () => void
  onSave: () => void
}) {
  const invalidPeriod =
    form && !form.noDeadline && form.closesAt && form.opensAt && new Date(form.closesAt) <= new Date(form.opensAt)
  return (
    <Modal
      open={form !== null}
      onClose={onClose}
      title={form?.id ? '토픽 고치기' : '새 토픽'}
      footer={
        <>
          <button type='button' onClick={onClose} className={buttonClass('ghost', 'sm')}>
            취소
          </button>
          <button
            type='button'
            disabled={!form?.title.trim() || saving || Boolean(invalidPeriod)}
            onClick={onSave}
            className={buttonClass('primary', 'sm', 'ml-auto')}
          >
            {form?.id ? '저장' : '만들기'}
          </button>
        </>
      }
    >
      {form && (
        <div className='flex flex-col gap-4'>
          <Field label='이름' hint='공개 페이지에 이 이름 그대로 보여요. 예: Sound, Issue 03 — 도구'>
            <Input
              autoFocus
              maxLength={LAB_ISSUE_TITLE_MAX}
              value={form.title}
              onChange={(event) => onChange({ ...form, title: event.target.value })}
            />
          </Field>
          <Field label='설명 (선택)' hint='토픽 제목 아래에 보여요.'>
            <Textarea
              rows={2}
              value={form.description}
              onChange={(event) => onChange({ ...form, description: event.target.value })}
            />
          </Field>

          <div className='flex flex-col gap-2'>
            <span className='text-xs text-mute'>작성 기간</span>
            <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
              <Field label='시작'>
                <Input
                  type='datetime-local'
                  value={form.opensAt}
                  onChange={(event) => onChange({ ...form, opensAt: event.target.value })}
                />
              </Field>
              <Field label='마감'>
                <Input
                  type='datetime-local'
                  value={form.noDeadline ? '' : form.closesAt}
                  disabled={form.noDeadline}
                  onChange={(event) => onChange({ ...form, closesAt: event.target.value })}
                />
              </Field>
            </div>
            <label className='flex cursor-pointer items-center gap-2 text-sm'>
              <Checkbox
                checked={form.noDeadline}
                onChange={(event) =>
                  onChange({
                    ...form,
                    noDeadline: event.target.checked,
                    // 다시 마감을 켜면 시작 일주일 뒤로 채워 준다
                    closesAt:
                      !event.target.checked && !form.closesAt
                        ? toLocalInput(
                            new Date(new Date(form.opensAt || Date.now()).getTime() + 7 * 864e5).toISOString(),
                          )
                        : form.closesAt,
                  })
                }
              />
              마감 없이 풀어 두기
            </label>
            <p className={classNames('text-xs', invalidPeriod ? 'text-danger' : 'text-mute')}>
              {invalidPeriod
                ? '마감은 시작보다 뒤여야 해요.'
                : '기간 밖에는 이 토픽에 새 글을 쓸 수 없어요. 이미 쓴 글은 기간이 지나도 고칠 수 있어요.'}
            </p>
          </div>
        </div>
      )}
    </Modal>
  )
}

/* ─── 공개 페이지 설정 (리드 멤버) ──────────────────────────────────────── */

/** 바꾸는 즉시 저장한다 (실패하면 이전 값으로 되돌린다) */
function SettingsModal({
  open,
  settings,
  ready,
  onSettings,
  onMessage,
  onClose,
}: {
  open: boolean
  settings: LabSettings
  ready: boolean
  onSettings: (settings: LabSettings) => void
  onMessage: (message: string, tone?: 'success' | 'error') => void
  onClose: () => void
}) {
  const [saving, setSaving] = useState(false)

  const change = async (patch: Partial<LabSettings>) => {
    const previous = settings
    const next = { ...settings, ...patch }
    onSettings(next)
    setSaving(true)
    const result = await callAction(() => saveSettingsAction(next))
    setSaving(false)
    if ('message' in result) {
      onSettings(previous)
      return onMessage(result.message, 'error')
    }
    onSettings(result.data!)
    onMessage('공개 페이지에 반영했어요')
  }

  const disabled = !ready || saving
  const mode = LAB_RECOMMEND_MODES.find((item) => item.mode === settings.recommend_mode)!

  return (
    <Modal open={open} onClose={onClose} title='공개 페이지 설정' meta='바꾸면 바로 반영돼요'>
      <div className='flex flex-col gap-3'>
        {!ready && <p className='text-xs text-danger'>DB 마이그레이션(20261012_lab_settings.sql)이 필요해요.</p>}

        {/* BEST */}
        <div className='rounded-inner flex flex-col gap-3 bg-ink/4 p-3'>
          <div className='flex items-center justify-between gap-3'>
            <span className='flex flex-col'>
              <span className='text-sm'>Best</span>
              <span className='text-xs text-mute'>조회수가 많은 글</span>
            </span>
            <Switch
              checked={settings.best_enabled}
              disabled={disabled}
              label={settings.best_enabled ? '보이기' : '숨김'}
              onChange={(value) => change({ best_enabled: value })}
            />
          </div>
          <div className={classNames('grid grid-cols-2 gap-2', !settings.best_enabled && 'opacity-40')}>
            <Field label='개수'>
              <Select
                value={settings.best_limit}
                disabled={disabled || !settings.best_enabled}
                onChange={(event) => change({ best_limit: Number(event.target.value) })}
              >
                {limitOptions(settings.best_limit).map((count) => (
                  <option key={count} value={count}>
                    {count}개
                  </option>
                ))}
              </Select>
            </Field>
            <Field label='기준 기간'>
              <Select
                value={settings.best_period_days ?? ''}
                disabled={disabled || !settings.best_enabled}
                onChange={(event) =>
                  change({ best_period_days: event.target.value ? Number(event.target.value) : null })
                }
              >
                {LAB_BEST_PERIODS.map((period) => (
                  <option key={period.label} value={period.days ?? ''}>
                    {period.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </div>

        {/* 추천 */}
        <div className='rounded-inner flex flex-col gap-3 bg-ink/4 p-3'>
          <div className='flex items-center justify-between gap-3'>
            <span className='flex flex-col'>
              <span className='text-sm'>Recommend</span>
              <span className='text-xs text-mute'>{mode.hint}</span>
            </span>
            <Switch
              checked={settings.recommend_enabled}
              disabled={disabled}
              label={settings.recommend_enabled ? '보이기' : '숨김'}
              onChange={(value) => change({ recommend_enabled: value })}
            />
          </div>
          <div className={classNames('grid grid-cols-2 gap-2', !settings.recommend_enabled && 'opacity-40')}>
            <Field label='고르는 방식'>
              <Select
                value={settings.recommend_mode}
                disabled={disabled || !settings.recommend_enabled}
                onChange={(event) => change({ recommend_mode: event.target.value as LabSettings['recommend_mode'] })}
              >
                {LAB_RECOMMEND_MODES.map((item) => (
                  <option key={item.mode} value={item.mode}>
                    {item.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label='개수 (1~24)'>
              {/* 직접 적고, 칸을 벗어나거나 Enter를 누르면 저장 */}
              <Input
                key={settings.recommend_limit}
                type='number'
                inputMode='numeric'
                min={1}
                max={24}
                defaultValue={settings.recommend_limit}
                disabled={disabled || !settings.recommend_enabled}
                onKeyDown={(event) => event.key === 'Enter' && event.currentTarget.blur()}
                onBlur={(event) => {
                  const value = Math.min(24, Math.max(1, Math.round(Number(event.target.value) || 0)))
                  if (!event.target.value || value === settings.recommend_limit) {
                    event.target.value = String(settings.recommend_limit)
                    return
                  }
                  event.target.value = String(value)
                  change({ recommend_limit: value })
                }}
              />
            </Field>
          </div>
          {settings.recommend_mode === 'manual' && <p className='text-xs text-mute'>글 목록의 추천 스위치로 골라요.</p>}
        </div>
      </div>
    </Modal>
  )
}

/** 개수 선택지 (저장된 값이 목록에 없으면 끼워 넣는다) */
const limitOptions = (current: number) =>
  LAB_SECTION_LIMITS.indexOf(current) >= 0
    ? LAB_SECTION_LIMITS
    : LAB_SECTION_LIMITS.concat(current).sort((a, b) => a - b)

/* ─── 글 목록 ─────────────────────────────────────────────────────────── */

/** 작은 배지 */
function Badge({ className, children, title }: { className?: string; children: React.ReactNode; title?: string }) {
  return (
    <span
      title={title}
      className={classNames(
        'inline-flex shrink-0 items-center gap-0.5 rounded-full px-1.5 text-[10px] leading-4',
        className,
      )}
    >
      {children}
    </span>
  )
}

/** 사흘 안에 쓴 글 */
const isNew = (iso: string) => Date.now() - new Date(iso).getTime() < 3 * 864e5

function ArticleTable({
  groups,
  userId,
  recommendSwitch,
  showAuthor,
  colorOf,
  canDelete,
  selected,
  deleting,
  onSelect,
  onArticles,
  onMessage,
}: {
  /** 토픽별 묶음 (토픽 순서) */
  groups: { issue: LabIssue; rows: LabArticleCard[] }[]
  userId: string
  /** 운영자 + 추천 방식이 '직접 선택'일 때만 추천 스위치 */
  recommendSwitch: boolean
  /** 작성자 칸 (운영자만. 멤버는 직접 작성한 글만 보므로 필요 없다) */
  showAuthor: boolean
  /** 토픽 색 (왼쪽 목록과 같은 색) */
  colorOf: (id: string) => string
  /** 고를 수 있는 글 (멤버: 직접 작성한 글 / 운영자: 모든 글) */
  canDelete: (article: LabArticleCard) => boolean
  selected: Set<string>
  /** 지우는 중인 글은 흐리게 */
  deleting: boolean
  onSelect: (ids: string[], checked: boolean) => void
  onArticles: (update: (current: LabArticleCard[]) => LabArticleCard[]) => void
  onMessage: (message: string, tone?: 'success' | 'error') => void
}) {
  const router = useRouter()
  const [busyId, setBusyId] = useState<string | null>(null)

  const toggle = async (article: LabArticleCard, recommended: boolean) => {
    setBusyId(article.id)
    const result = await callAction(() => setRecommendedAction(article.id, recommended))
    setBusyId(null)
    if ('message' in result) return onMessage(result.message, 'error')
    const next = result.data!
    onArticles((current) => current.map((item) => (item.id === next.id ? { ...item, ...next } : item)))
  }

  const selectable = groups.flatMap((group) => group.rows).filter(canDelete)
  const selectedCount = selectable.filter((article) => selected.has(article.id)).length
  const allSelected = selectable.length > 0 && selectedCount === selectable.length

  // 목록에서는 편집 가능한 글만 편집 화면으로 연다. 공개 페이지 이동은 상세 편집 화면에서 한다.
  const open = (article: LabArticleCard) => {
    if (canEditLabArticle(article, userId)) router.push(`/space/lab/${article.id}`)
  }

  return (
    <div className='flex w-full flex-col gap-5 text-sm'>
      <label className='flex w-fit cursor-pointer items-center gap-2 px-1 text-xs text-mute'>
        <Checkbox
          aria-label='보이는 글 전체 선택'
          checked={allSelected}
          indeterminate={selectedCount > 0 && !allSelected}
          disabled={selectable.length === 0}
          onChange={(event) =>
            onSelect(
              selectable.map((article) => article.id),
              event.target.checked,
            )
          }
        />
        {selectedCount > 0
          ? `${selectedCount}개 선택됨`
          : `전체 ${groups.reduce((sum, group) => sum + group.rows.length, 0)}개 선택`}
      </label>

      {groups.map(({ issue, rows }) => (
        <section key={issue.id} className='rounded-block min-w-0 bg-surface p-2'>
          <div className='flex min-w-0 flex-col gap-1'>
            {rows.map((article) => {
              const editable = canEditLabArticle(article, userId)
              const checked = selected.has(article.id)
              return (
                <article
                  key={article.id}
                  onClick={editable ? () => open(article) : undefined}
                  className={classNames(
                    'rounded-inner grid w-full min-w-0 grid-cols-[auto_auto_minmax(0,1fr)] items-center gap-x-3 gap-y-2 p-2 transition-colors sm:grid-cols-[auto_auto_minmax(0,1fr)_max-content]',
                    editable && 'cursor-pointer hover:bg-ink/4',
                    checked && 'bg-accent-soft',
                    (busyId === article.id || (deleting && checked)) && 'opacity-50',
                  )}
                >
                  <div
                    className='row-span-2 flex size-7 items-center justify-center sm:row-span-1'
                    onClick={(event) => event.stopPropagation()}
                  >
                    {canDelete(article) && (
                      <Checkbox
                        aria-label={`${article.title || '제목 없음'} 선택`}
                        checked={checked}
                        onChange={(event) => onSelect([article.id], event.target.checked)}
                      />
                    )}
                  </div>

                  <div className='rounded-inner row-span-2 h-9 w-12 overflow-hidden bg-ink/6 sm:row-span-1 sm:h-10 sm:w-14'>
                    {article.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={article.thumbnail_url} alt='' className='size-full object-cover' />
                    ) : (
                      <div
                        className='size-full opacity-20'
                        style={{ background: `linear-gradient(135deg, ${colorOf(issue.id)}, transparent 70%)` }}
                      />
                    )}
                  </div>

                  <div className='col-start-3 flex min-w-0 w-full flex-col gap-1 sm:row-start-1'>
                    <div className='flex min-w-0 items-center gap-1.5'>
                      <h3 className='truncate font-medium'>{article.title || '제목 없음'}</h3>
                      {isNew(article.created_at) && <Badge className='bg-ink text-paper'>NEW</Badge>}
                      {!recommendSwitch && article.recommended_at && (
                        <Badge className='bg-accent-soft text-accent' title='운영자가 추천한 글'>
                          <GoStarFill size={8} />
                          추천
                        </Badge>
                      )}
                    </div>
                    <div className='flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-mute'>
                      {showAuthor && <span>{article.author_name}</span>}
                      {showAuthor && <span aria-hidden='true'>·</span>}
                      <span>
                        <RelativeTime iso={article.created_at} />
                      </span>
                      <span aria-hidden='true'>·</span>
                      <span className='tabular-nums'>
                        조회 {article.published ? article.view_count.toLocaleString() : '—'}
                      </span>
                    </div>
                  </div>

                  <div className='col-start-3 flex flex-wrap items-center gap-2 sm:col-start-4 sm:row-start-1 sm:flex-nowrap sm:justify-self-end'>
                    <StatusBadge published={article.published} />
                    <Badge className={editable ? 'bg-ink/6 text-ink' : 'bg-danger-soft text-danger'}>
                      {editable ? '편집 가능' : '편집 불가'}
                    </Badge>
                    {recommendSwitch && (
                      <div
                        className='flex items-center gap-1.5 text-xs text-mute'
                        onClick={(event) => event.stopPropagation()}
                      >
                        <span>추천</span>
                        <span
                          className='inline-flex'
                          title={article.published ? undefined : '공개된 글만 추천할 수 있어요'}
                        >
                          <Switch
                            checked={Boolean(article.recommended_at)}
                            disabled={busyId === article.id || !article.published}
                            onChange={(value) => toggle(article, value)}
                          />
                        </span>
                      </div>
                    )}

                    {editable && (
                      <span className={buttonClass('secondary', 'sm')}>
                        <GoPencil size={12} />
                        편집
                      </span>
                    )}
                    {article.published && (
                      <a
                        href={`/lab-space/${article.slug}`}
                        target='_blank'
                        rel='noopener noreferrer'
                        onClick={(event) => event.stopPropagation()}
                        className={buttonClass('ghost', 'sm')}
                      >
                        글 보기
                        <GoArrowUpRight size={12} />
                      </a>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}

function EditAccessModal({
  open,
  editors,
  ownerId,
  saving,
  title,
  onSave,
  onClose,
}: {
  open: boolean
  editors: LabEditorOption[]
  ownerId: string
  saving: boolean
  title: string
  onSave: (access: LabEditAccess) => void
  onClose: () => void
}) {
  const [scope, setScope] = useState<LabEditAccess['edit_scope']>('all')
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const candidates = editors.filter((editor) => editor.id !== ownerId)
  return (
    <Modal open={open} onClose={onClose} title={title} meta='누가 이 글을 편집할 수 있을까요?'>
      <div className='flex flex-col gap-4'>
        <Field label='편집 권한'>
          <Select value={scope} onChange={(event) => setScope(event.target.value as LabEditAccess['edit_scope'])}>
            <option value='all'>전체 멤버</option>
            <option value='owner'>본인만</option>
            <option value='selected'>멤버 지정</option>
          </Select>
        </Field>
        {scope === 'selected' && (
          <div className='rounded-inner max-h-56 overflow-y-auto bg-ink/4 p-2'>
            {candidates.map((editor) => (
              <label
                key={editor.id}
                className='flex cursor-pointer items-center gap-2 rounded px-2 py-2 text-sm hover:bg-ink/4'
              >
                <Checkbox
                  checked={selected.has(editor.id)}
                  onChange={(event) =>
                    setSelected((current) => {
                      const next = new Set(current)
                      event.target.checked ? next.add(editor.id) : next.delete(editor.id)
                      return next
                    })
                  }
                />
                {editor.name}
              </label>
            ))}
            {candidates.length === 0 && <p className='p-2 text-xs text-mute'>지정할 수 있는 멤버가 없어요.</p>}
          </div>
        )}
        <div className='flex justify-end gap-2'>
          <button type='button' onClick={onClose} className={buttonClass('ghost')}>
            취소
          </button>
          <button
            type='button'
            disabled={saving || (scope === 'selected' && selected.size === 0)}
            onClick={() => onSave({ edit_scope: scope, editor_ids: scope === 'selected' ? Array.from(selected) : [] })}
            className={buttonClass('primary')}
          >
            {saving ? '여는 중…' : '글 만들기'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
