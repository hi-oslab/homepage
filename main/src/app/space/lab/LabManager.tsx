'use client'

import classNames from 'classnames'
import { Reorder, useDragControls } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useRef, useState, useTransition } from 'react'
import {
  GoArrowUpRight,
  GoGear,
  GoGrabber,
  GoListUnordered,
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
 * 왼쪽: 토픽 목록 (하나만 고른다, 처음에는 전체)
 * 오른쪽: 고른 토픽의 표지(기간 · 글 쓰기) + 글 목록. 전체일 때는 토픽 순서대로 묶는다
 * 리드 멤버(운영자)의 토픽 만들기 · 순서 · 고치기 · 지우기와 공개 페이지 설정은 모달로 뺐다
 */
export function LabManager({
  issues: initialIssues,
  articles: initialArticles,
  userId,
  isLead,
  settings: initialSettings,
  settingsReady,
}: {
  issues: LabIssue[]
  /** 멤버: 직접 작성한 글만 / 운영자: 모든 글 */
  articles: LabArticleCard[]
  userId: string
  isLead: boolean
  /** 공개 페이지 섹션 설정 (리드 멤버만 고친다) */
  settings: LabSettings
  /** 설정 표가 있는지 (20261012 마이그레이션) */
  settingsReady: boolean
}) {
  const toast = useToast()
  const router = useRouter()
  const [issues, setIssues] = useServerState(initialIssues)
  const [articles, setArticles] = useServerState(initialArticles)
  const [settings, setSettings] = useServerState(initialSettings)
  /** 고른 토픽. null이면 전체 */
  const [topicId, setTopicId] = useState<string | null>(null)
  const [mineOnly, setMineOnly] = useState(false)
  const [form, setForm] = useState<IssueForm | null>(null)
  const [managing, setManaging] = useState(false)
  const [configuring, setConfiguring] = useState(false)
  const [creating, startCreating] = useTransition()
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
  // 전체에서 글 쓰기를 누르면 어느 토픽에 쓸지 고른다
  const [picking, setPicking] = useState(false)
  const anyOpen = issues.some((issue) => issuePhase(issue) === 'open')
  // 추천 스위치는 '직접 선택'일 때만 의미가 있다
  const manualRecommend = isLead && settings.recommend_enabled && settings.recommend_mode === 'manual'

  const write = (issue: LabIssue) => {
    if (creating) return
    startCreating(async () => {
      // 성공하면 서버가 편집 화면으로 보낸다. 작성 기간이 아니면 안내만 돌아온다
      const result = await createArticleAction(issue.id)
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
      setTopicId(issue.id)
      setForm(null)
      toast.show(form.id ? '토픽을 고쳤어요' : '토픽을 만들었어요')
    })
  }

  const removeIssue = (issue: LabIssue) => {
    if (countOf(issue.id) > 0) return toast.show('글이 있는 토픽은 지울 수 없어요', 'error')
    if (!confirm(`'${issue.title}' 토픽을 지울까요?`)) return
    startSaving(async () => {
      const result = await callAction(() => deleteIssueAction(issue.id))
      if ('message' in result) return toast.show(result.message, 'error')
      setIssues((current) => current.filter((item) => item.id !== issue.id))
      if (topicId === issue.id) setTopicId(null)
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
        .filter((article) => article.issue_id === issue.id && (!mineOnly || article.author_id === userId))
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
          <h1 className='text-3xl font-medium tracking-[-0.04em] md:text-4xl'>Lab Space</h1>
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

      <div className='grid grid-cols-1 items-start gap-4 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)]'>
        {/* 왼쪽: 토픽 목록 */}
        <nav aria-label='토픽' className='rounded-block flex min-w-0 flex-col gap-1 bg-surface p-2 lg:sticky lg:top-4'>
          <span className='px-2 pt-1 pb-1.5 text-xs text-mute'>토픽</span>
          {/* 좁은 화면에서는 가로로 넘긴다 */}
          <div className='-mx-2 flex gap-1 overflow-x-auto px-2 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0'>
            <TopicButton active={!topicId} title='전체 글' count={articles.length} onClick={() => setTopicId(null)} />
            {issues.map((issue) => (
              <TopicButton
                key={issue.id}
                active={topicId === issue.id}
                title={issue.title}
                latest={issue.id === latestId}
                period={issue}
                color={colorOf(issue.id)}
                count={countOf(issue.id)}
                onClick={() => setTopicId(issue.id)}
              />
            ))}
          </div>
          {issues.length === 0 && (
            <p className='px-2 py-4 text-xs text-mute'>
              {isLead ? '첫 토픽을 만들어 보세요.' : '운영자가 토픽을 만들면 글을 쓸 수 있어요.'}
            </p>
          )}
          {isLead && (
            <div className='mt-1 flex gap-1 border-t border-ink/5 pt-2'>
              <button
                type='button'
                onClick={() => setForm(emptyForm())}
                className={buttonClass('ghost', 'sm', 'flex-1 justify-start')}
              >
                <GoPlus size={13} />새 토픽
              </button>
              {issues.length > 0 && (
                <button type='button' onClick={() => setManaging(true)} className={buttonClass('ghost', 'sm')}>
                  <GoListUnordered size={13} />
                  관리
                </button>
              )}
            </div>
          )}
        </nav>

        {/* 오른쪽: 표지 + 글 */}
        <section className='flex min-w-0 flex-col gap-3'>
          <TopicCover
            topic={topic}
            total={topic ? countOf(topic.id) : articles.length}
            anyOpen={anyOpen}
            onPick={() => setPicking(true)}
            creating={creating}
            isLead={isLead}
            onWrite={write}
            onEdit={() => topic && setForm(formOf(topic))}
          />

          <div className='flex min-h-8 flex-wrap items-center justify-between gap-x-3 gap-y-2 px-1'>
            <span className='flex items-center gap-2'>
              <span className='text-xs text-mute tabular-nums'>
                {mineOnly || !isLead ? '작성한 글' : '글'} {total}
              </span>
              {/* 선택 막대: 고르면 지우기 버튼이 나온다 */}
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
            {/* 멤버는 원래 직접 작성한 글만 보이므로 운영자에게만 */}
            {isLead && (
              <label className='flex cursor-pointer items-center gap-1.5 text-sm text-mute'>
                <Checkbox checked={mineOnly} onChange={(event) => setMineOnly(event.target.checked)} />
                직접 작성한 것만
              </label>
            )}
          </div>

          {groups.length === 0 ? (
            <p className='rounded-block bg-surface py-14 text-center text-sm text-mute'>
              {mineOnly || !isLead ? '아직 작성한 글이 없어요.' : '아직 글이 없어요.'}
            </p>
          ) : (
            <ArticleTable
              groups={groups}
              grouped={!topicId}
              userId={userId}
              recommendSwitch={manualRecommend}
              showAuthor={isLead}
              colorOf={colorOf}
              canDelete={canDelete}
              selected={selected}
              deleting={deleting}
              onSelect={select}
              onPickTopic={setTopicId}
              onArticles={setArticles}
              onMessage={toast.show}
            />
          )}
        </section>
      </div>

      <TopicPickModal
        open={picking}
        issues={issues}
        creating={creating}
        onWrite={write}
        onClose={() => setPicking(false)}
      />
      <TopicManageModal
        open={managing}
        issues={issues}
        countOf={countOf}
        saving={saving}
        onReorder={setIssues}
        onDragEnd={saveOrder}
        onEdit={(issue) => {
          setManaging(false)
          setForm(formOf(issue))
        }}
        onRemove={removeIssue}
        onClose={() => setManaging(false)}
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

/* ─── 왼쪽 토픽 한 줄 ─────────────────────────────────────────────────── */

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
        'rounded-inner flex min-w-40 shrink-0 items-center gap-3 px-2.5 py-2 text-left transition-colors lg:min-w-0',
        active ? 'bg-accent-soft text-accent' : 'hover:bg-ink/4',
      )}
    >
      {color && <span className='size-2 shrink-0 self-start rounded-full mt-1.5' style={{ background: color }} />}
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
    </button>
  )
}

/* ─── 오른쪽 표지: 고른 토픽의 이름 · 설명 · 기간 · 글 쓰기 ────────────── */

function TopicCover({
  topic,
  total,
  anyOpen,
  creating,
  isLead,
  onWrite,
  onPick,
  onEdit,
}: {
  topic: LabIssue | null
  total: number
  /** 지금 쓸 수 있는 토픽이 하나라도 있는지 (전체 글일 때) */
  anyOpen: boolean
  creating: boolean
  isLead: boolean
  onWrite: (issue: LabIssue) => void
  /** 전체 글일 때: 어느 토픽에 쓸지 고르는 창 */
  onPick: () => void
  onEdit: () => void
}) {
  const open = topic ? issuePhase(topic) === 'open' : anyOpen

  return (
    <div className='rounded-block flex flex-wrap items-end justify-between gap-4 bg-surface p-4'>
      <div className='flex min-w-0 flex-col gap-1'>
        <span className='flex items-center gap-2'>
          <h2 className='truncate text-xl font-medium tracking-[-0.03em]'>{topic ? topic.title : '전체 글'}</h2>
          {topic && isLead && (
            <button type='button' aria-label='토픽 고치기' onClick={onEdit} className={iconButtonClass({ size: 'sm' })}>
              <GoPencil size={12} />
            </button>
          )}
        </span>
        {topic?.description && <p className='text-sm break-keep text-mute'>{topic.description}</p>}
        <p className='text-xs text-mute tabular-nums'>
          {topic ? `${periodText(topic)} · 글 ${total}` : `모든 토픽의 글 ${total}`}
        </p>
      </div>

      {/* 글 쓰기: 고른 토픽에 바로, 전체일 때는 토픽을 고르는 창 */}
      {open ? (
        <button
          type='button'
          disabled={creating}
          onClick={() => (topic ? onWrite(topic) : onPick())}
          className={buttonClass('primary', 'md')}
        >
          <GoPencil size={14} />
          {creating ? '여는 중…' : '글 쓰기'}
        </button>
      ) : (
        <span className='text-xs text-mute'>
          {topic
            ? issuePhase(topic) === 'upcoming'
              ? '작성 기간이 시작되면 쓸 수 있어요'
              : '작성 기간이 끝났어요'
            : '지금 쓸 수 있는 토픽이 없어요'}
        </span>
      )}
    </div>
  )
}

/* ─── 글 쓸 토픽 고르기 (전체 글에서 글 쓰기) ──────────────────────────── */

function TopicPickModal({
  open,
  issues,
  creating,
  onWrite,
  onClose,
}: {
  open: boolean
  issues: LabIssue[]
  creating: boolean
  onWrite: (issue: LabIssue) => void
  onClose: () => void
}) {
  // 쓸 수 있는 토픽을 위로, 나머지는 흐리게 (왜 안 되는지 기간으로 보여 준다)
  const sorted = issues
    .filter((issue) => issuePhase(issue) === 'open')
    .concat(issues.filter((issue) => issuePhase(issue) !== 'open'))
  return (
    <Modal open={open} onClose={onClose} title='어떤 토픽에 쓸까요?'>
      <div className='flex flex-col gap-1'>
        {sorted.map((issue) => {
          const writable = issuePhase(issue) === 'open'
          return (
            <button
              key={issue.id}
              type='button'
              disabled={!writable || creating}
              onClick={() => onWrite(issue)}
              className='rounded-inner flex items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors enabled:hover:bg-ink/4 disabled:cursor-default'
            >
              <span className='flex min-w-0 flex-col'>
                <span className={classNames('truncate text-sm', !writable && 'text-mute')}>{issue.title}</span>
                {issue.description && writable && (
                  <span className='truncate text-xs text-mute'>{issue.description}</span>
                )}
              </span>
              <span className='shrink-0 text-xs text-mute tabular-nums'>
                {creating && writable ? '여는 중…' : periodText(issue)}
              </span>
            </button>
          )
        })}
      </div>
    </Modal>
  )
}

/* ─── 토픽 관리 (리드 멤버): 순서 · 고치기 · 지우기 ─────────────────────── */

function TopicManageModal({
  open,
  issues,
  countOf,
  saving,
  onReorder,
  onDragEnd,
  onEdit,
  onRemove,
  onClose,
}: {
  open: boolean
  issues: LabIssue[]
  countOf: (id: string) => number
  saving: boolean
  onReorder: (issues: LabIssue[]) => void
  onDragEnd: () => void
  onEdit: (issue: LabIssue) => void
  onRemove: (issue: LabIssue) => void
  onClose: () => void
}) {
  return (
    <Modal open={open} onClose={onClose} title='토픽 관리' meta='끌어서 순서를 바꾸면 공개 페이지 순서도 바뀌어요'>
      <Reorder.Group axis='y' values={issues} onReorder={onReorder} className='flex flex-col'>
        {issues.map((issue, index) => (
          <ManageRow
            key={issue.id}
            issue={issue}
            order={index + 1}
            count={countOf(issue.id)}
            saving={saving}
            onDragEnd={onDragEnd}
            onEdit={() => onEdit(issue)}
            onRemove={() => onRemove(issue)}
          />
        ))}
      </Reorder.Group>
    </Modal>
  )
}

function ManageRow({
  issue,
  order,
  count,
  saving,
  onDragEnd,
  onEdit,
  onRemove,
}: {
  issue: LabIssue
  order: number
  count: number
  saving: boolean
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
      className='flex items-center gap-2 border-t border-ink/5 bg-surface py-2 first:border-t-0'
    >
      <span
        onPointerDown={(event) => controls.start(event)}
        aria-label='끌어서 순서 바꾸기'
        title='끌어서 순서 바꾸기'
        className='flex size-7 shrink-0 cursor-grab touch-none items-center justify-center text-mute hover:text-ink active:cursor-grabbing'
      >
        <GoGrabber size={16} />
      </span>
      <span className='w-5 shrink-0 text-center text-xs text-mute tabular-nums'>{order}</span>
      <span className='flex min-w-0 flex-1 flex-col'>
        <span className='truncate text-sm'>{issue.title}</span>
        <span className='truncate text-xs text-mute tabular-nums'>
          {periodText(issue)} · 글 {count}
        </span>
      </span>
      <button type='button' aria-label='토픽 고치기' onClick={onEdit} className={iconButtonClass()}>
        <GoPencil size={13} />
      </button>
      <button
        type='button'
        aria-label='토픽 지우기'
        title={count > 0 ? '글이 있는 토픽은 지울 수 없어요' : undefined}
        disabled={saving || count > 0}
        onClick={onRemove}
        className={iconButtonClass({ danger: true })}
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

const TH = 'px-3 py-2.5 text-left text-xs font-normal text-mute whitespace-nowrap'
const TD = 'px-3 py-2.5 align-middle'

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
  grouped,
  userId,
  recommendSwitch,
  showAuthor,
  colorOf,
  canDelete,
  selected,
  deleting,
  onSelect,
  onPickTopic,
  onArticles,
  onMessage,
}: {
  /** 토픽별 묶음 (토픽 순서) */
  groups: { issue: LabIssue; rows: LabArticleCard[] }[]
  /** 전체 글일 때: 토픽 칸 + 토픽 색 줄로 묶는다 */
  grouped: boolean
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
  onPickTopic: (id: string) => void
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

  // 작성한 글은 편집 화면, 다른 사람의 공개 글은 공개 페이지(새 탭)
  const open = (article: LabArticleCard) => {
    if (article.author_id === userId) router.push(`/space/lab/${article.id}`)
    else if (article.published) window.open(`/lab-space/${article.slug}`, '_blank', 'noopener')
  }

  return (
    <div className='rounded-block w-full overflow-x-auto bg-surface'>
      <table className='w-full min-w-160 text-sm'>
        <thead className='border-b border-ink/5'>
          <tr>
            <th className={classNames(TH, 'w-0 pr-0')}>
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
            </th>
            <th className={TH}>제목</th>
            {grouped && <th className={TH}>토픽</th>}
            {showAuthor && <th className={TH}>작성자</th>}
            <th className={TH}>상태</th>
            <th className={classNames(TH, 'text-right')}>조회</th>
            {recommendSwitch && (
              <th className={classNames(TH, 'text-center')} title='켠 글이 공개 페이지 Recommend에 보여요'>
                추천
              </th>
            )}
            <th className={classNames(TH, 'text-right')}>작성</th>
            <th className={TH}>
              <span className='sr-only'>열기</span>
            </th>
          </tr>
        </thead>
        {groups.map(({ issue, rows }) => (
          <tbody key={issue.id} className='border-t border-ink/10 first-of-type:border-t-0'>
            {rows.map((article) => {
              const own = article.author_id === userId
              const checked = selected.has(article.id)
              return (
                <tr
                  key={article.id}
                  onClick={() => open(article)}
                  className={classNames(
                    'border-t border-ink/5 transition-colors first:border-t-0',
                    (own || article.published) && 'cursor-pointer hover:bg-ink/3',
                    checked && 'bg-ink/3',
                    (busyId === article.id || (deleting && checked)) && 'opacity-50',
                  )}
                >
                  {/* 전체 글일 때 왼쪽 색 줄로 토픽을 묶는다 */}
                  <td
                    className={classNames(TD, 'w-0 pr-0')}
                    style={grouped ? { boxShadow: `inset 3px 0 0 ${colorOf(issue.id)}` } : undefined}
                    onClick={(event) => event.stopPropagation()}
                  >
                    {canDelete(article) && (
                      <Checkbox
                        aria-label={`${article.title || '제목 없음'} 선택`}
                        checked={checked}
                        onChange={(event) => onSelect([article.id], event.target.checked)}
                      />
                    )}
                  </td>
                  <td className={classNames(TD, 'max-w-72')}>
                    <span className='flex min-w-0 items-center gap-3'>
                      <span className='rounded-inner h-9 w-12 shrink-0 overflow-hidden bg-ink/6'>
                        {article.thumbnail_url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={article.thumbnail_url} alt='' className='size-full object-cover' />
                        )}
                      </span>
                      <span className='flex min-w-0 items-center gap-1.5'>
                        <span className='truncate'>{article.title || '제목 없음'}</span>
                        {isNew(article.created_at) && <Badge className='bg-ink text-paper'>NEW</Badge>}
                        {!recommendSwitch && article.recommended_at && (
                          <Badge className='bg-accent-soft text-accent' title='운영자가 추천한 글'>
                            <GoStarFill size={8} />
                            추천
                          </Badge>
                        )}
                      </span>
                    </span>
                  </td>
                  {grouped && (
                    <td className={classNames(TD, 'max-w-36')} onClick={(event) => event.stopPropagation()}>
                      <button
                        type='button'
                        onClick={() => onPickTopic(issue.id)}
                        title={`${issue.title}만 보기`}
                        className='flex max-w-full items-center gap-1.5 text-xs text-mute hover:text-ink'
                      >
                        <span className='size-2 shrink-0 rounded-full' style={{ background: colorOf(issue.id) }} />
                        <span className='truncate'>{issue.title}</span>
                      </button>
                    </td>
                  )}
                  {showAuthor && <td className={classNames(TD, 'whitespace-nowrap')}>{article.author_name}</td>}
                  <td className={TD}>
                    <StatusBadge published={article.published} />
                  </td>
                  <td className={classNames(TD, 'text-right text-mute tabular-nums')}>
                    {article.published ? article.view_count.toLocaleString() : '—'}
                  </td>
                  {recommendSwitch && (
                    <td className={classNames(TD, 'text-center')} onClick={(event) => event.stopPropagation()}>
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
                    </td>
                  )}
                  <td className={classNames(TD, 'text-right whitespace-nowrap text-mute')}>
                    <RelativeTime iso={article.created_at} />
                  </td>
                  {/* 누르면 어디로 가는지 버튼으로 보여 준다 */}
                  <td className={classNames(TD, 'w-0 text-right whitespace-nowrap')}>
                    {own ? (
                      <span className={buttonClass('secondary', 'sm')}>
                        <GoPencil size={12} />
                        편집
                      </span>
                    ) : article.published ? (
                      <span className={buttonClass('ghost', 'sm')}>
                        보기
                        <GoArrowUpRight size={12} />
                      </span>
                    ) : null}
                  </td>
                </tr>
              )
            })}
          </tbody>
        ))}
      </table>
    </div>
  )
}
