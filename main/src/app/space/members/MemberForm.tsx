'use client'

import { Field, Input, SectionCard, Select, TagInput, Textarea } from '@/components/admin/ui'
import type { Member } from '@/types/cms'

export type MemberDraft = Omit<Member, 'id' | 'created_at' | 'updated_at' | 'display_order'>

export const toMemberDraft = ({
  name,
  sub_name,
  description,
  role,
  fields,
  email,
  website,
  cover_image_url,
  published,
}: Member): MemberDraft => ({ name, sub_name, description, role, fields, email, website, cover_image_url, published })

/**
 * 내 프로필 편집 양식: 기본 정보 · 소개 · 연락처 상자
 * (프로필 이미지 · 공개 여부는 화면의 왼쪽 칸 · 상단 바에서 다룬다)
 */
export function MemberForm({
  draft,
  patch,
  roles = [],
  fieldSuggestions = [],
}: {
  draft: MemberDraft
  patch: <K extends keyof MemberDraft>(key: K, value: MemberDraft[K]) => void
  /** 운영자가 관리하는 역할 목록 */
  roles?: string[]
  fieldSuggestions?: string[]
}) {
  return (
    <>
      <SectionCard title='기본 정보' description='Members 카드에 크게 보이는 정보예요.'>
        <Field label='이름'>
          <Input value={draft.name} onChange={(event) => patch('name', event.target.value)} placeholder='실명 또는 활동명' />
        </Field>
        <Field label='한 줄 소개' hint='이름 아래 회색으로 보여요.'>
          <Input
            value={draft.sub_name}
            onChange={(event) => patch('sub_name', event.target.value)}
            placeholder='예: 재밌는 것을 따라가는'
          />
        </Field>
        <Field label='역할' hint='운영자가 관리하는 목록에서 골라요.'>
          <Select value={draft.role} onChange={(event) => patch('role', event.target.value)}>
            <option value=''>선택 안 함</option>
            {roles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
            {/* 목록에서 빠진 예전 역할도 그대로 보이게 */}
            {draft.role && !roles.includes(draft.role) && <option value={draft.role}>{draft.role} (목록에 없음)</option>}
          </Select>
        </Field>
      </SectionCard>

      <SectionCard title='소개' description='카드에 마우스를 올리거나 눌렀을 때 보여요.'>
        <Field label='자기소개'>
          <Textarea
            rows={4}
            value={draft.description}
            onChange={(event) => patch('description', event.target.value)}
            placeholder='어떤 작업을 좋아하고, 오픈소스랩에서 무엇을 하고 있는지 자유롭게 적어 주세요.'
          />
        </Field>
        <Field label='분야' hint='Enter로 하나씩 추가해요.'>
          <TagInput value={draft.fields} onChange={(value) => patch('fields', value)} suggestions={fieldSuggestions} />
        </Field>
      </SectionCard>

      <SectionCard title='연락처' description='적은 것만 카드에 링크로 보여요.'>
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
          <Field label='이메일'>
            <Input
              type='email'
              value={draft.email}
              onChange={(event) => patch('email', event.target.value)}
              placeholder='name@example.com'
            />
          </Field>
          <Field label='웹사이트'>
            <Input
              value={draft.website}
              onChange={(event) => patch('website', event.target.value)}
              placeholder='https://'
            />
          </Field>
        </div>
      </SectionCard>
    </>
  )
}
