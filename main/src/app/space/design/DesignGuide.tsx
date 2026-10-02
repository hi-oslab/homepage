'use client'

import { useState } from 'react'
import { GoPencil, GoPlus, GoTrash } from 'react-icons/go'
import { MemberModal } from '@/app/members/components/MemberModal'
import { Modal } from '@/components/admin/Modal'
import {
  BLOCK_GAP,
  BLOCK_PAD,
  buttonClass,
  iconButtonClass,
  surfaceClass,
  type ButtonSize,
  type ButtonVariant,
  type Surface,
} from '@/components/admin/styles'
import {
  Checkbox,
  Field,
  Input,
  Panel,
  SaveState,
  SectionCard,
  Select,
  StatusBadge,
  Switch,
  Textarea,
} from '@/components/admin/ui'
import { OperatorBadge } from '@/components/OperatorBadge'
import { ProfileImage } from '@/components/ProfileImage'
import { cn } from '@/lib/cn'
import type { Member } from '@/types/cms'
import { Segmented } from '../AccountFields'
import { BentoCard } from '../home/BentoCard'
import { HomeSection } from '../home/HomeSection'

const COLORS: { token: string; note: string }[] = [
  { token: 'accent', note: '가장 중요한 버튼 · 선택' },
  { token: 'accent-hover', note: '강조 버튼 올렸을 때' },
  { token: 'accent-soft', note: '강조 옅은 바탕' },
  { token: 'ink', note: '글자 · 검정 버튼' },
  { token: 'mute', note: '보조 글자' },
  { token: 'paper', note: '페이지 바탕' },
  { token: 'tile', note: '회색 바탕 블록' },
  { token: 'surface', note: '흰 블록' },
  { token: 'field', note: '입력칸' },
  { token: 'danger', note: '위험 · 오류' },
  { token: 'danger-soft', note: '위험 옅은 바탕' },
  { token: 'success', note: '정상 · 공개' },
]

const VARIANTS: { variant: ButtonVariant; note: string }[] = [
  { variant: 'primary', note: '화면에서 가장 중요한 동작 하나' },
  { variant: 'dark', note: '강조하되 파랑보다 한 단계 아래' },
  { variant: 'secondary', note: '일반 동작' },
  { variant: 'ghost', note: '덜 중요한 동작 · 취소' },
  { variant: 'danger', note: '삭제 · 되돌릴 수 없는 동작' },
]
const SIZES: ButtonSize[] = ['sm', 'md', 'lg']

const SURFACES: { tone: Surface; note: string }[] = [
  { tone: 'solid', note: '기본 블록: 흰 면' },
  { tone: 'glass', note: '떠 있는 블록: 반투명 (모달 · 팝오버)' },
  { tone: 'inverse', note: '강조 블록: 검정 면' },
  { tone: 'inset', note: '블록 안의 작은 면' },
]

/** 모달 · 떠 있는 창 목록 (공용이 아닌 것도 적어 둔다: 나중에 공용 Modal로 합칠 후보) */
const OVERLAYS: { name: string; file: string; used: string }[] = [
  {
    name: 'Modal (공용)',
    file: 'components/admin/Modal.tsx',
    used: '게시글 · 글쓰기 · 건의사항 · 멤버 상세 · 역할 · 알림 브리핑',
  },
  {
    name: 'MemberModal',
    file: 'app/members/components/MemberModal.tsx',
    used: '프로필카드 (공개 Members 페이지 · 홈 멤버 목록)',
  },
  { name: 'PreviewModal', file: 'components/admin/PreviewModal.tsx', used: '프로젝트 미리보기' },
  { name: 'ImageLightbox', file: 'components/ImageLightbox.tsx', used: '이미지 크게 보기' },
  { name: 'NotificationCenter 팝오버', file: 'app/space/NotificationCenter.tsx', used: '오른쪽 아래 알림' },
  { name: 'BlockMenu', file: 'components/admin/BlockEditor/BlockMenu.tsx', used: '블록 에디터 추가 메뉴' },
  { name: 'confirm() (브라우저 기본)', file: '여러 곳', used: '삭제 · 승인 · 역할 변경 확인' },
]

const SAMPLE_MEMBER: Member = {
  id: 'sample',
  name: '홍길동',
  sub_name: 'Hong Gildong',
  description: '프로필카드 모달 예시예요. 실제 데이터가 아니에요.',
  role: 'Designer',
  fields: ['Interaction', 'Web'],
  email: 'hello@example.com',
  website: 'example.com',
  cover_image_url: null,
  published: true,
  display_order: 0,
  created_at: '',
  updated_at: '',
}

export function DesignGuide() {
  const [modal, setModal] = useState<'md' | 'lg' | 'tall' | null>(null)
  const [member, setMember] = useState<Member | null>(null)
  const [switchOn, setSwitchOn] = useState(true)
  const [segment, setSegment] = useState<'club' | 'external'>('club')

  return (
    <div className={cn('flex flex-col', BLOCK_GAP)}>
      <Toc />

      <Section id='colors' title='색' file='styles/globals.css (@theme)'>
        <div className={cn('grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6', BLOCK_GAP)}>
          {COLORS.map(({ token, note }) => (
            <div key={token} className='flex flex-col gap-1.5'>
              <span
                className='h-14 rounded-inner ring-1 ring-ink/5 ring-inset'
                style={{ background: `var(--color-${token})` }}
              />
              <span className='font-mono text-xs'>{token}</span>
              <span className='text-[11px] text-mute'>{note}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section id='buttons' title='버튼' file='components/admin/styles.ts (buttonClass · iconButtonClass)'>
        <div className='flex flex-col gap-3'>
          {VARIANTS.map(({ variant, note }) => (
            <div
              key={variant}
              className='grid grid-cols-[88px_minmax(0,1fr)] items-center gap-3 md:grid-cols-[88px_minmax(0,1fr)_220px]'
            >
              <span className='font-mono text-xs'>{variant}</span>
              <div className='flex flex-wrap items-center gap-2'>
                {SIZES.map((size) => (
                  <button key={size} type='button' className={buttonClass(variant, size)}>
                    버튼 {size}
                  </button>
                ))}
                <button type='button' disabled className={buttonClass(variant, 'md')}>
                  비활성
                </button>
              </div>
              <span className='hidden text-xs text-mute md:block'>{note}</span>
            </div>
          ))}
          <div className='grid grid-cols-[88px_minmax(0,1fr)] items-center gap-3'>
            <span className='font-mono text-xs'>icon</span>
            <div className='flex items-center gap-1'>
              <button type='button' aria-label='추가' className={iconButtonClass()}>
                <GoPlus size={14} />
              </button>
              <button type='button' aria-label='수정' className={iconButtonClass({ size: 'sm' })}>
                <GoPencil size={12} />
              </button>
              <button type='button' aria-label='삭제' className={iconButtonClass({ danger: true })}>
                <GoTrash size={14} />
              </button>
            </div>
          </div>
        </div>
      </Section>

      <Section id='fields' title='입력' file='components/admin/styles.ts (fieldClass) · components/admin/ui.tsx'>
        <div className={cn('grid md:grid-cols-2', 'gap-4')}>
          <Field label='Input' hint='도움말은 이렇게 작게'>
            <Input placeholder='입력해 주세요' />
          </Field>
          <Field label='Select'>
            <Select defaultValue='a'>
              <option value='a'>선택지 A</option>
              <option value='b'>선택지 B</option>
            </Select>
          </Field>
          <Field label='Textarea' className='md:col-span-2'>
            <Textarea rows={3} placeholder='여러 줄 입력' />
          </Field>
          <div className='flex flex-col gap-1.5'>
            <span className='text-xs text-mute'>Segmented (app/space/AccountFields.tsx)</span>
            <Segmented<'club' | 'external'>
              value={segment}
              onChange={setSegment}
              options={[
                { value: 'club', label: '학교 소모임' },
                { value: 'external', label: '외부 활동' },
              ]}
            />
          </div>
          <div className='flex flex-col gap-3'>
            <span className='text-xs text-mute'>Switch · Checkbox</span>
            <Switch checked={switchOn} onChange={setSwitchOn} label={switchOn ? '켜짐' : '꺼짐'} />
            <label className='flex items-center gap-2 text-sm'>
              <Checkbox defaultChecked /> 체크박스
            </label>
          </div>
        </div>
      </Section>

      <Section
        id='surfaces'
        title='블록 면 · 간격'
        file='components/admin/styles.ts (surfaceClass · BLOCK_PAD · BLOCK_GAP)'
      >
        <p className='text-xs text-mute'>
          회색 바탕 위에 둥근 면(rounded-block · rounded-inner, globals.css)으로 올려요. 안쪽 여백{' '}
          <code className='font-mono'>{BLOCK_PAD}</code>, 블록 사이 <code className='font-mono'>{BLOCK_GAP}</code>.
        </p>
        {/* 유리 면이 보이도록 강조색 빛을 깐 바탕 */}
        <div className='relative isolate overflow-hidden rounded-inner bg-paper p-4'>
          <div
            aria-hidden
            className='absolute inset-0 -z-10 bg-[radial-gradient(60%_120%_at_30%_0%,color-mix(in_oklab,var(--color-accent)_22%,transparent),transparent)]'
          />
          <div className={cn('grid md:grid-cols-4', BLOCK_GAP)}>
            {SURFACES.map(({ tone, note }) => (
              <div key={tone} className={cn('flex h-32 flex-col justify-between', surfaceClass(tone), BLOCK_PAD)}>
                <span className='font-mono text-xs'>{tone}</span>
                <span className='text-xs text-mute'>{note}</span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section id='frames' title='공용 틀' file='각 칸 제목의 파일'>
        <div className={cn('grid md:grid-cols-2', BLOCK_GAP)}>
          <Frame name='Panel' file='components/admin/ui.tsx'>
            <Panel title='패널 제목'>
              <p className='text-sm'>설정 · 상세 화면의 한 구역</p>
            </Panel>
          </Frame>
          <Frame name='SectionCard' file='components/admin/ui.tsx'>
            <SectionCard
              title='섹션 카드'
              description='프로필 · 계정 설정 · 프로젝트 편집이 같이 써요.'
              actions={<button className={buttonClass('secondary', 'sm')}>버튼</button>}
            >
              <p className='text-sm'>내용</p>
            </SectionCard>
          </Frame>
          <Frame name='HomeSection · tile / lg' file='app/space/home/HomeSection.tsx'>
            <HomeSection title='홈 섹션' meta='12개' description='제목 아래 한 줄 설명'>
              <div className={cn(surfaceClass('solid'), BLOCK_PAD, 'text-sm')}>안에 담긴 흰 블록</div>
            </HomeSection>
          </Frame>
          <Frame name='HomeSection · surface / sm' file='app/space/home/HomeSection.tsx'>
            <HomeSection title='작은 섹션' tone='surface' size='sm'>
              <p className='text-sm text-mute'>촘촘한 버전</p>
            </HomeSection>
          </Frame>
          <Frame name='BentoCard · light (href 있으면 올릴 때 들림)' file='app/space/home/BentoCard.tsx'>
            <div className='h-32'>
              <BentoCard href='#frames'>
                <span className='text-sm text-mute'>카드 제목</span>
                <span className='mt-auto text-2xl font-medium '>12개</span>
              </BentoCard>
            </div>
          </Frame>
          <Frame name='BentoCard · dark' file='app/space/home/BentoCard.tsx'>
            <div className='h-32'>
              <BentoCard tone='dark'>
                <span className='text-sm text-paper/60'>카드 제목</span>
                <span className='mt-auto text-2xl font-medium '>강조 카드</span>
              </BentoCard>
            </div>
          </Frame>
        </div>
      </Section>

      <Section id='overlays' title='모달 · 떠 있는 창' file='아래 표의 파일'>
        <div className='flex flex-wrap gap-2'>
          <button type='button' className={buttonClass('secondary', 'sm')} onClick={() => setModal('md')}>
            Modal md
          </button>
          <button type='button' className={buttonClass('secondary', 'sm')} onClick={() => setModal('lg')}>
            Modal lg
          </button>
          <button type='button' className={buttonClass('secondary', 'sm')} onClick={() => setModal('tall')}>
            Modal lg + tall
          </button>
          <button type='button' className={buttonClass('secondary', 'sm')} onClick={() => setMember(SAMPLE_MEMBER)}>
            MemberModal (프로필카드)
          </button>
        </div>
        <div className='overflow-x-auto'>
          <table className='w-full min-w-[560px] text-left text-sm'>
            <thead className='text-xs text-mute'>
              <tr>
                <th className='py-2 pr-4 font-normal'>종류</th>
                <th className='py-2 pr-4 font-normal'>파일</th>
                <th className='py-2 font-normal'>쓰는 곳</th>
              </tr>
            </thead>
            <tbody>
              {OVERLAYS.map((item) => (
                <tr key={item.name} className='border-t border-ink/5'>
                  <td className='py-2 pr-4'>{item.name}</td>
                  <td className='py-2 pr-4 font-mono text-xs text-mute'>{item.file}</td>
                  <td className='py-2 text-xs'>{item.used}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section
        id='badges'
        title='배지 · 상태 · 프로필 이미지'
        file='components/admin/ui.tsx · components/OperatorBadge.tsx · components/ProfileImage.tsx'
      >
        <div className='flex flex-wrap items-center gap-5'>
          <OperatorBadge />
          <StatusBadge published />
          <StatusBadge published={false} />
          <SaveState dirty={false} saving={false} />
          <SaveState dirty saving={false} />
          <SaveState dirty={false} saving />
          <span className='size-2 rounded-full bg-danger' title='알림 점' />
          <span className='size-2 rounded-full bg-accent' title='강조 점' />
          <ProfileImage src={null} name='홍길동' size='sm' className='size-8 text-xs' />
          <ProfileImage src={null} name='홍길동' size='sm' className='size-14 text-lg' />
        </div>
      </Section>

      <Section id='type' title='글자' file='각 부품 안 (정리 전)'>
        <div className='flex flex-col gap-3'>
          <span className='text-4xl font-medium '>페이지 제목 text-4xl</span>
          <span className='text-2xl font-medium '>섹션 제목 text-2xl</span>
          <span className='text-base font-medium '>카드 제목 text-base</span>
          <span className='text-sm'>본문 text-sm</span>
          <span className='text-xs text-mute'>보조 text-xs · mute</span>
        </div>
      </Section>

      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title='모달 제목'
        meta='제목 옆 보조 정보'
        size={modal === 'md' ? 'md' : 'lg'}
        tall={modal === 'tall'}
        footer={
          <>
            <button type='button' className={buttonClass('primary', 'sm')} onClick={() => setModal(null)}>
              확인
            </button>
            <button type='button' className={buttonClass('ghost', 'sm')} onClick={() => setModal(null)}>
              취소
            </button>
          </>
        }
      >
        <div className='flex flex-col gap-3'>
          <p className='text-sm'>공용 Modal이에요. 모바일에서는 아래에서 올라오는 시트가 돼요.</p>
          <Panel title='안에 담긴 패널'>
            <Input placeholder='입력칸' />
          </Panel>
        </div>
      </Modal>
      <MemberModal member={member} onClose={() => setMember(null)} />
    </div>
  )
}

const TOC = [
  ['colors', '색'],
  ['buttons', '버튼'],
  ['fields', '입력'],
  ['surfaces', '블록 면'],
  ['frames', '공용 틀'],
  ['overlays', '모달'],
  ['badges', '배지'],
  ['type', '글자'],
]

function Toc() {
  return (
    <nav className='sticky top-header z-10 -mx-1 flex gap-1 overflow-x-auto bg-paper/80 px-1 py-2 backdrop-blur-xl'>
      {TOC.map(([id, label]) => (
        <a key={id} href={`#${id}`} className={buttonClass('ghost', 'sm')}>
          {label}
        </a>
      ))}
    </nav>
  )
}

function Section({
  id,
  title,
  file,
  children,
}: {
  id: string
  title: string
  file: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className={cn('flex scroll-mt-28 flex-col gap-4', surfaceClass('solid'), BLOCK_PAD, 'md:p-5')}>
      <div className='flex flex-wrap items-baseline justify-between gap-2'>
        <h2 className='text-2xl font-medium '>{title}</h2>
        <span className='font-mono text-[11px] text-mute'>{file}</span>
      </div>
      {children}
    </section>
  )
}

/** 공용 틀 하나를 회색 바탕 위에 올려 보여준다 */
function Frame({ name, file, children }: { name: string; file: string; children: React.ReactNode }) {
  return (
    <div className='flex flex-col gap-2 rounded-inner bg-paper p-3'>
      <div className='flex flex-wrap items-baseline justify-between gap-2'>
        <span className='text-xs'>{name}</span>
        <span className='font-mono text-[11px] text-mute'>{file}</span>
      </div>
      {children}
    </div>
  )
}
