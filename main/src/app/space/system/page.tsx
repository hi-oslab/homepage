import classNames from 'classnames'
import { requirePageUser } from '@/lib/admin-auth'
import { getSystemStatus, type Health, type ServiceStatus } from '@/lib/system-status'
import { PageHeader, Panel } from '@/components/admin/ui'
import { RelativeTime } from '../DashboardActions'
import { RecheckButton } from './RecheckButton'

export const dynamic = 'force-dynamic'

const HEALTH: Record<Health, { label: string; dot: string; text: string }> = {
  ok: { label: '정상', dot: 'bg-success', text: 'text-success' },
  warn: { label: '주의', dot: 'bg-[#e0a526]', text: 'text-[#b07d0c]' },
  error: { label: '오류', dot: 'bg-danger', text: 'text-danger' },
}

export default async function AdminSystemPage() {
  await requirePageUser({ master: true })
  const { services, env, checkedAt } = await getSystemStatus()

  const counts = { ok: 0, warn: 0, error: 0 }
  services.forEach((service) => (counts[service.health] += 1))
  const missingRequired = env.filter((item) => item.required && !item.set)
  const overall: Health = counts.error || missingRequired.length ? 'error' : counts.warn ? 'warn' : 'ok'

  return (
    <div className='flex flex-col gap-3'>
      <PageHeader
        title='시스템 상태'
        description='사이트가 쓰는 외부 서비스의 연결 상태와 사용량을 확인합니다. 운영자만 볼 수 있어요.'
        actions={<RecheckButton />}
      />

      {/* 전체 요약 */}
      <section
        className={classNames(
          'rounded-block flex flex-wrap items-center justify-between gap-3 p-5',
          overall === 'ok' ? 'bg-ink text-paper' : overall === 'warn' ? 'bg-[#e0a526]/15' : 'bg-danger-soft',
        )}
      >
        <div className='flex items-center gap-3'>
          <span className={classNames('size-2.5 rounded-full', HEALTH[overall].dot)} />
          <span className='text-2xl font-medium '>
            {overall === 'ok'
              ? '모두 정상이에요'
              : overall === 'warn'
                ? '확인이 필요한 항목이 있어요'
                : '문제가 있는 항목이 있어요'}
          </span>
        </div>
        <div
          className={classNames('flex items-center gap-3 text-sm', overall === 'ok' ? 'text-paper/60' : 'text-ink/60')}
        >
          <span>
            정상 {counts.ok} · 주의 {counts.warn} · 오류 {counts.error + missingRequired.length}
          </span>
          <span>·</span>
          <span>
            확인 <RelativeTime iso={checkedAt} />
          </span>
        </div>
      </section>

      {/* 서비스별 */}
      <div className='grid grid-cols-1 gap-3 lg:grid-cols-2'>
        {services.map((service) => (
          <ServiceCard key={service.id} service={service} />
        ))}
      </div>

      {/* 환경변수 */}
      <Panel title='환경변수 (값은 표시하지 않아요)'>
        <ul className='-mx-2 flex flex-col'>
          {env.map((item) => (
            <li
              key={item.name}
              className='flex flex-wrap items-center gap-x-3 gap-y-0.5 rounded-lg px-2 py-1.5 text-sm hover:bg-field'
            >
              <span
                className={classNames(
                  'size-1.5 shrink-0 rounded-full',
                  item.set ? 'bg-success' : item.required ? 'bg-danger' : 'bg-ink/20',
                )}
              />
              <code className='font-mono text-[12px]'>{item.name}</code>
              <span className='text-xs text-mute'>{item.purpose}</span>
              <span className='ml-auto flex items-center gap-2 text-xs'>
                {!item.required && <span className='text-mute'>선택</span>}
                <span className={item.set ? 'text-ink' : item.required ? 'text-danger' : 'text-mute'}>
                  {item.set ? '설정됨' : '없음'}
                </span>
              </span>
            </li>
          ))}
        </ul>
        {missingRequired.length > 0 && (
          <p className='text-sm text-danger'>
            필수 환경변수 {missingRequired.length}개가 없어요. Vercel 프로젝트 설정의 Environment Variables에서 추가해
            주세요.
          </p>
        )}
      </Panel>
    </div>
  )
}

function ServiceCard({ service }: { service: ServiceStatus }) {
  const health = HEALTH[service.health]

  return (
    <Panel className='gap-5'>
      <div className='flex items-start justify-between gap-3'>
        <div className='flex flex-col gap-0.5'>
          <span className='text-xl font-medium '>{service.name}</span>
          <span className='text-xs text-mute'>{service.role}</span>
        </div>
        <span
          className={classNames(
            'flex shrink-0 items-center gap-1.5 rounded-full bg-field px-2.5 py-1 text-xs',
            health.text,
          )}
        >
          <span className={classNames('size-1.5 rounded-full', health.dot)} />
          {health.label}
        </span>
      </div>

      <div className='flex items-baseline justify-between gap-3 text-sm'>
        <span className={service.health === 'error' ? 'break-all text-danger' : ''}>{service.summary}</span>
        {service.latencyMs !== undefined && (
          <span className='shrink-0 font-mono text-xs text-mute tabular-nums'>{service.latencyMs}ms</span>
        )}
      </div>

      {service.metrics.length > 0 && (
        <dl className='grid grid-cols-2 gap-2 sm:grid-cols-3'>
          {service.metrics.map((metric) => (
            <div key={metric.label} className='rounded-inner flex flex-col gap-0.5 bg-field px-3 py-2'>
              <dt className='truncate text-[11px] text-mute'>{metric.label}</dt>
              <dd className='truncate text-base font-medium '>{metric.value}</dd>
              {metric.hint && <span className='truncate text-[11px] text-mute'>{metric.hint}</span>}
            </div>
          ))}
        </dl>
      )}

      {service.usage && (
        <div className='flex flex-col gap-1.5'>
          <div className='flex justify-between text-xs text-mute'>
            <span>무료 한도 사용률</span>
            <span className='tabular-nums'>
              {service.usage.label} · {(service.usage.ratio * 100).toFixed(service.usage.ratio < 0.01 ? 2 : 1)}%
            </span>
          </div>
          <div className='h-1.5 overflow-hidden rounded-full bg-field'>
            <div
              className={classNames('h-full rounded-full', service.usage.ratio > 0.8 ? 'bg-danger' : 'bg-ink')}
              style={{ width: `${Math.max(1, Math.min(100, service.usage.ratio * 100))}%` }}
            />
          </div>
        </div>
      )}

      {service.notes.length > 0 && (
        <ul className='flex flex-col gap-1 text-xs leading-relaxed text-ink/60'>
          {service.notes.map((note) => (
            <li key={note} className='break-keep'>
              · {note}
            </li>
          ))}
        </ul>
      )}

      <div className='mt-auto flex flex-wrap gap-x-4 gap-y-1 text-sm'>
        {service.links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            target='_blank'
            rel='noopener noreferrer'
            className='text-ink transition-colors hover:text-mute'
          >
            {link.label} ↗
          </a>
        ))}
      </div>
    </Panel>
  )
}
