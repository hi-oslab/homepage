import type { Member } from '@/types/cms'
import { Arrow } from '@/components'

interface MemberCardProps {
  member: Member
}

export const MemberCard = ({ member }: MemberCardProps) => {
  const { name, sub_name: subName, role, description, cover_image_url: coverImage, email, website, fields } = member
  const websiteUrl = website && (/^https?:\/\//.test(website) ? website : `https://${website}`)

  return (
    <article className='group flex flex-col gap-4'>
      {/* 사진: hover 시 소개 문구 */}
      <div className='relative aspect-[5/5] w-full overflow-hidden bg-tile'>
        {coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverImage}
            alt={name}
            loading='lazy'
            className='size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]'
          />
        ) : (
          <span className='absolute inset-0 flex items-center justify-center text-7xl font-medium tracking-tight text-ink/15'>
            {name?.[0] ?? '?'}
          </span>
        )}
        {description && (
          <div className='absolute inset-0 hidden items-end bg-ink/85 p-5 opacity-0 transition-opacity duration-300 group-hover:opacity-100 md:flex'>
            <p className='break-keep text-sm leading-relaxed text-white'>{description}</p>
          </div>
        )}
      </div>

      {/* 이름 + 한 줄 소개 */}
      <div className='flex flex-col gap-1'>
        <div className='flex items-baseline justify-between gap-3'>
          <h3 className='text-xl font-medium tracking-[-0.02em]'>{name}</h3>
          {role && <span className='shrink-0 text-xs text-mute'>{role}</span>}
        </div>
        {subName && <p className='break-keep text-sm leading-snug text-mute'>{subName}</p>}
        {description && <p className='mt-1 break-keep text-sm leading-relaxed md:hidden'>{description}</p>}
      </div>

      {fields.length > 0 && <p className='break-keep text-xs leading-relaxed text-mute'>{fields.join(' · ')}</p>}

      {(email || websiteUrl) && (
        <div className='flex flex-wrap gap-x-4 gap-y-1 text-sm'>
          {email && (
            <a
              href={`mailto:${email.trim()}`}
              className='inline-flex items-center gap-1 transition-colors hover:text-mute'
            >
              Email
              <Arrow className='size-3.5' />
            </a>
          )}
          {websiteUrl && (
            <a
              href={websiteUrl}
              target='_blank'
              rel='noopener noreferrer'
              className='inline-flex items-center gap-1 transition-colors hover:text-mute'
            >
              Website
              <Arrow className='size-3.5' />
            </a>
          )}
        </div>
      )}
    </article>
  )
}
