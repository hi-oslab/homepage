'use client'

import { Field, ImageDrop, Input, Panel, Select, Switch, TagInput, Textarea } from '@/components/admin/ui'
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

/** 내 프로필 편집 폼 */
export function MemberForm({
  draft,
  patch,
  onUpload,
  onEditImage,
  roles = [],
  fieldSuggestions = [],
}: {
  draft: MemberDraft
  patch: <K extends keyof MemberDraft>(key: K, value: MemberDraft[K]) => void
  onUpload: (file: File) => Promise<void>
  /** 지금 프로필 이미지를 다시 자르기 */
  onEditImage?: () => void
  /** 운영자가 관리하는 역할 목록 */
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
            onEdit={onEditImage}
            onRemove={() => patch('cover_image_url', null)}
            aspect='aspect-[5/5]'
            label='프로필 이미지 (투명 PNG 추천)'
            // 투명 PNG를 자르지 않고, 모양을 따라 그림자
            imageClassName='object-contain p-[8%] drop-shadow-[0_8px_18px_rgba(17,17,17,0.18)]'
          />
          <div className='flex flex-col gap-3'>
            <Field label='이름'>
              <Input value={draft.name} onChange={(event) => patch('name', event.target.value)} />
            </Field>
            <Field label='한 줄 소개' hint='이름 아래 회색으로 표시됩니다. 예: 재밌는 것을 따라가는'>
              <Input value={draft.sub_name} onChange={(event) => patch('sub_name', event.target.value)} />
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
          </div>
        </div>
        <Field label='자기소개' hint='사이트에서 사진에 마우스를 올리면 보입니다.'>
          <Textarea rows={3} value={draft.description} onChange={(event) => patch('description', event.target.value)} />
        </Field>
        <Field label='분야'>
          <TagInput value={draft.fields} onChange={(value) => patch('fields', value)} suggestions={fieldSuggestions} />
        </Field>
      </Panel>

      <Panel title='연락처'>
        <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
          <Field label='이메일'>
            <Input type='email' value={draft.email} onChange={(event) => patch('email', event.target.value)} />
          </Field>
          <Field label='웹사이트'>
            <Input
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
