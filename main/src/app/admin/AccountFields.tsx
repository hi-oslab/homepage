'use client'

import classNames from 'classnames'
import type { AccountProfileInput } from '@/types/cms'

export const emptyAccountProfile = (): AccountProfileInput => ({
  name: '',
  student_id: '',
  is_hongik: true,
  phone: '',
  joined_year: new Date().getFullYear(),
  joined_half: new Date().getMonth() < 6 ? 'H1' : 'H2',
})

const YEARS = Array.from({ length: new Date().getFullYear() - 2018 + 1 }, (_, index) => new Date().getFullYear() - index)

/** 두세 개 중 하나를 고르는 버튼 그룹 */
export function Segmented<T extends string | boolean>({
  value,
  options,
  onChange,
  large,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
  large?: boolean
}) {
  return (
    <div className={classNames('flex rounded-lg p-0.5', large ? 'bg-tile' : 'bg-field')}>
      {options.map((option) => (
        <button
          key={String(option.value)}
          type='button'
          onClick={() => onChange(option.value)}
          className={classNames(
            'flex-1 rounded-md px-3 text-sm transition-colors',
            large ? 'py-2.5' : 'py-1.5',
            value === option.value ? 'bg-surface text-ink' : 'text-mute hover:text-ink',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

/** 실명 · 전화번호 · 홍익대 여부 · 학번 · 오픈소스랩 가입 시기 */
export function AccountFields({
  value,
  onChange,
  large,
}: {
  value: AccountProfileInput
  onChange: (value: AccountProfileInput) => void
  /** 로그인 화면처럼 큰 입력칸 */
  large?: boolean
}) {
  const set = <K extends keyof AccountProfileInput>(key: K, next: AccountProfileInput[K]) => onChange({ ...value, [key]: next })
  const inputClass = large ? 'bg-tile! py-3.5! text-base!' : ''
  const label = (text: string, optional?: boolean) => (
    <span className='text-xs text-mute'>
      {text}
      {optional && <span className='ml-1 text-ink/30'>(선택)</span>}
    </span>
  )

  return (
    <div className='flex flex-col gap-3'>
      <label className='flex flex-col gap-1.5'>
        {label('실명')}
        <input required autoComplete='name' value={value.name} onChange={(event) => set('name', event.target.value)} className={inputClass} />
      </label>
      <label className='flex flex-col gap-1.5'>
        {label('전화번호')}
        <input
          required
          type='tel'
          inputMode='tel'
          autoComplete='tel'
          placeholder='010-0000-0000'
          value={value.phone}
          onChange={(event) => set('phone', event.target.value)}
          className={inputClass}
        />
      </label>
      <div className='flex flex-col gap-1.5'>
        {label('홍익대학교 학생(졸업생 포함)인가요?')}
        <Segmented
          large={large}
          value={value.is_hongik}
          onChange={(next) => set('is_hongik', next)}
          options={[
            { value: true, label: '네' },
            { value: false, label: '아니요' },
          ]}
        />
      </div>
      <label className='flex flex-col gap-1.5'>
        {label('학번', true)}
        <input
          inputMode='numeric'
          placeholder={value.is_hongik ? '예: B812345' : '학번이 있다면 입력해 주세요'}
          value={value.student_id}
          onChange={(event) => set('student_id', event.target.value)}
          className={inputClass}
        />
      </label>
      <div className='flex flex-col gap-1.5'>
        {label('오픈소스랩 가입 시기')}
        <div className='grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-2'>
          <select
            aria-label='가입 연도'
            value={value.joined_year ?? ''}
            onChange={(event) => set('joined_year', Number(event.target.value))}
            className={inputClass}
          >
            {YEARS.map((year) => (
              <option key={year} value={year}>
                {year}년
              </option>
            ))}
          </select>
          <Segmented
            large={large}
            value={value.joined_half ?? 'H1'}
            onChange={(next) => set('joined_half', next)}
            options={[
              { value: 'H1', label: '상반기' },
              { value: 'H2', label: '하반기' },
            ]}
          />
        </div>
      </div>
    </div>
  )
}

export const formatJoined = (year: number | null, half: 'H1' | 'H2' | null) =>
  year ? `${year}년 ${half === 'H2' ? '하반기' : '상반기'}` : '—'
