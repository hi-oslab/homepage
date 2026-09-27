'use client'

import classNames from 'classnames'
import { useState } from 'react'
import type { AccountProfileInput, MemberAffiliation } from '@/types/cms'
import { DEFAULT_MAJORS } from '@/lib/majors'
import { GoCheck, GoCheckCircle, GoCheckCircleFill } from 'react-icons/go'
import { Input, Select } from '@/components/admin/ui'
import { LARGE_FIELD } from '@/components/admin/styles'

export const emptyAccountProfile = (): AccountProfileInput => ({
  name: '',
  affiliation: null,
  major: '',
  student_id: '',
  is_hongik: true,
  phone: '',
  joined_year: new Date().getFullYear(),
  joined_half: new Date().getMonth() < 6 ? 'H1' : 'H2',
})

const YEARS = Array.from(
  { length: new Date().getFullYear() - 2018 + 1 },
  (_, index) => new Date().getFullYear() - index,
)

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
            'flex-1 text-nowrap rounded-md px-3 text-sm transition-colors',
            large ? 'py-2.5' : 'py-1.5',
            value === option.value ? 'bg-surface text-ink' : 'text-mute hover:text-ink',
          )}
        >
          {option.label}{' '}
          {value === option.value && <GoCheckCircleFill className='ml-1 -mr-1 mb-0.5 inline-block size-4 text-ink' />}
        </button>
      ))}
    </div>
  )
}

export const AFFILIATION_LABELS: Record<MemberAffiliation, string> = {
  club: '학교 소모임',
  external: '외부 활동',
}

type FieldsProps = {
  value: AccountProfileInput
  onChange: (value: AccountProfileInput) => void
  /** 로그인 화면처럼 큰 입력칸 */
  large?: boolean
}

const FieldLabel = ({ text, optional }: { text: string; optional?: boolean }) => (
  <span className='text-xs text-mute'>
    {text}
    {optional && <span className='ml-1 text-ink/30'>(선택)</span>}
  </span>
)

/** 실명 · 전화번호 */
export function IdentityFields({ value, onChange, large, autoFocus }: FieldsProps & { autoFocus?: boolean }) {
  const set = <K extends keyof AccountProfileInput>(key: K, next: AccountProfileInput[K]) =>
    onChange({ ...value, [key]: next })
  const inputClass = large ? LARGE_FIELD : ''

  return (
    <div className='flex flex-col gap-3'>
      <label className='flex flex-col gap-1.5'>
        <FieldLabel text='실명' />
        <Input
          required
          autoFocus={autoFocus}
          autoComplete='name'
          value={value.name}
          onChange={(event) => set('name', event.target.value)}
          className={inputClass}
        />
      </label>
      <label className='flex flex-col gap-1.5'>
        <FieldLabel text='전화번호' />
        <Input
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
    </div>
  )
}

/** 소속(필수) · 홍익대 여부 · 학번 · 오픈소스랩 가입 시기 */
export function AffiliationFields({ value, onChange, large }: FieldsProps) {
  const set = <K extends keyof AccountProfileInput>(key: K, next: AccountProfileInput[K]) =>
    onChange({ ...value, [key]: next })
  const inputClass = large ? LARGE_FIELD : ''

  return (
    <div className='flex flex-col gap-3'>
      <div className='flex flex-col gap-1.5'>
        <FieldLabel text='소속' />
        <div className='grid grid-cols-2 gap-2'>
          {(
            [
              { value: 'club', label: AFFILIATION_LABELS.club, hint: '현재 학교 소모임에서 활동 중' },
              { value: 'external', label: AFFILIATION_LABELS.external, hint: '졸업생 · 타 학교 · 외부 협업' },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              type='button'
              aria-pressed={value.affiliation === option.value}
              onClick={() =>
                onChange({
                  ...value,
                  affiliation: option.value,
                  ...(option.value === 'club' ? { is_hongik: true } : {}),
                })
              }
              className={classNames(
                'flex flex-col items-start gap-0.5 rounded-lg px-3 text-left transition-colors',
                large ? 'py-3' : 'py-2',
                value.affiliation === option.value
                  ? 'bg-ink text-white'
                  : classNames(large ? 'bg-tile' : 'bg-field', 'text-ink hover:bg-ink/10'),
              )}
            >
              <span className='text-sm'>{option.label}</span>
              <span
                className={classNames(
                  'text-[11px]',
                  value.affiliation === option.value ? 'text-white/60' : 'text-mute',
                )}
              >
                {option.hint}
              </span>
            </button>
          ))}
        </div>
      </div>
      {/* 학교 소모임 멤버는 홍익대 학생이므로 묻지 않는다 */}
      {value.affiliation === 'external' && (
        <div className='flex flex-col gap-1.5'>
          <FieldLabel text='홍익대학교 학생(졸업생 포함)인가요?' />
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
      )}
      <label className='flex flex-col gap-1.5'>
        <FieldLabel text='학번' optional />
        <Input
          // 학번에 영문이 섞여 있어(B812345) 숫자 키패드가 아닌 일반 텍스트 입력
          type='text'
          autoCapitalize='characters'
          autoCorrect='off'
          spellCheck={false}
          placeholder={value.is_hongik ? '예: B812345' : '학번이 있다면 입력해 주세요'}
          value={value.student_id}
          onChange={(event) => set('student_id', event.target.value)}
          className={inputClass}
        />
      </label>
      <MajorField value={value.major} onChange={(next) => set('major', next)} large={large} />
      <div className='flex flex-col gap-1.5'>
        <FieldLabel text='오픈소스랩 가입 시기' />
        <div className='grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-2'>
          <Select
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
          </Select>
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

const CUSTOM_MAJOR = '__custom'

/** 전공: 기본 선택지에서 고르고, 없으면 직접 입력 */
function MajorField({ value, onChange, large }: { value: string; onChange: (value: string) => void; large?: boolean }) {
  const isDefault = (DEFAULT_MAJORS as readonly string[]).includes(value)
  // 목록에 없는 전공이 이미 있으면 처음부터 직접 입력으로
  const [custom, setCustom] = useState(Boolean(value) && !isDefault)
  const inputClass = large ? LARGE_FIELD : ''

  return (
    <div className='flex flex-col gap-1.5'>
      <FieldLabel text='전공' optional />
      <Select
        aria-label='전공'
        value={custom ? CUSTOM_MAJOR : value}
        onChange={(event) => {
          const next = event.target.value
          setCustom(next === CUSTOM_MAJOR)
          onChange(next === CUSTOM_MAJOR ? '' : next)
        }}
        className={inputClass}
      >
        <option value=''>선택 안 함</option>
        {DEFAULT_MAJORS.map((major) => (
          <option key={major} value={major}>
            {major}
          </option>
        ))}
        <option value={CUSTOM_MAJOR}>직접 입력</option>
      </Select>
      {custom && (
        <Input
          autoFocus={!value}
          value={value}
          maxLength={50}
          placeholder='전공 또는 학과 이름'
          onChange={(event) => onChange(event.target.value)}
          className={inputClass}
        />
      )}
    </div>
  )
}

/** 내 계정 화면: 본인 정보 + 소속 */
export function AccountFields(props: FieldsProps) {
  return (
    <div className='flex flex-col gap-3'>
      <IdentityFields {...props} />
      <AffiliationFields {...props} />
    </div>
  )
}

export const formatJoined = (year: number | null, half: 'H1' | 'H2' | null) =>
  year ? `${year}년 ${half === 'H2' ? '하반기' : '상반기'}` : '—'
