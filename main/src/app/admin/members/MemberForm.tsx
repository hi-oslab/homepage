'use client'

import { Field, ImageDrop, Panel, Switch, TagInput } from '@/components/admin/ui'
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

/** 멤버 프로필 편집 폼 (마스터의 멤버 관리 / 본인 프로필 공용) */
export function MemberForm({
  draft,
  patch,
  onUpload,
  roles = [],
  fieldSuggestions = [],
}: {
  draft: MemberDraft
  patch: <K extends keyof MemberDraft>(key: K, value: MemberDraft[K]) => void
  onUpload: (file: File) => Promise<void>
  roles?: string[]
  fieldSuggestions?: string[]
}) {
  return (
    <>
      <Panel>
        <div className='flex items-center justify-between'>
          <span className='text-sm'>공개 상태</span>
          <Switch
            checked={draft.published}
            onChange={(value) => patch('published', value)}
            label={draft.published ? '공개' : '비공개'}
          />
        </div>
        <p className='-mt-2 text-xs text-mute'>
          {draft.published ? '저장하면 Members 페이지에 표시됩니다.' : '비공개 프로필은 사이트에 표시되지 않습니다.'}
        </p>
      </Panel>

      <Panel title='기본 정보'>
        <div className='grid grid-cols-1 gap-3 sm:grid-cols-[180px_minmax(0,1fr)]'>
          <ImageDrop
            url={draft.cover_image_url}
            onUpload={onUpload}
            onRemove={() => patch('cover_image_url', null)}
            aspect='aspect-[5/5]'
            label='프로필 사진'
          />
          <div className='flex flex-col gap-3'>
            <Field label='이름'>
              <input value={draft.name} onChange={(event) => patch('name', event.target.value)} />
            </Field>
            <Field label='한 줄 소개' hint='이름 아래 회색으로 표시됩니다. 예: 재밌는 것을 따라가는'>
              <input value={draft.sub_name} onChange={(event) => patch('sub_name', event.target.value)} />
            </Field>
            <Field label='역할'>
              <input
                list='member-roles'
                value={draft.role}
                onChange={(event) => patch('role', event.target.value)}
                placeholder='예: Lead Member'
              />
              <datalist id='member-roles'>
                {roles.map((role) => (
                  <option key={role} value={role} />
                ))}
              </datalist>
            </Field>
          </div>
        </div>
        <Field label='자기소개' hint='사이트에서 사진에 마우스를 올리면 보입니다.'>
          <textarea rows={3} value={draft.description} onChange={(event) => patch('description', event.target.value)} />
        </Field>
        <Field label='분야'>
          <TagInput value={draft.fields} onChange={(value) => patch('fields', value)} suggestions={fieldSuggestions} />
        </Field>
      </Panel>

      <Panel title='연락처'>
        <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
          <Field label='이메일'>
            <input type='email' value={draft.email} onChange={(event) => patch('email', event.target.value)} />
          </Field>
          <Field label='웹사이트'>
            <input
              value={draft.website}
              onChange={(event) => patch('website', event.target.value)}
              placeholder='https://'
            />
          </Field>
        </div>
      </Panel>
    </>
  )
}
