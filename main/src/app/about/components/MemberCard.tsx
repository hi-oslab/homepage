import { ParsedType } from '@/types'
import { MdAlternateEmail, MdLink } from 'react-icons/md'

type MemberCardProps = {
  member: ParsedType['members']
}

export const MemberCard = ({ member }: MemberCardProps) => {
  const { name, subName, role, coverImage, email, website, field } = member.properties

  const shortUrl = (url: string) => {
    return url.replace(/^https?:\/\//, '').replace(/\/$/, '').slice(0, 24) + (url.replace(/^https?:\/\//, '').length > 24 ? '...' : '')
  }

  return (
    <div className='group w-full flex flex-col gap-4 border border-neutral-800 rounded-2xl p-5 hover:border-neutral-600 transition-colors duration-200'>
      {/* 이미지 + 이름 영역 */}
      <div className='flex items-center gap-4'>
        <div className='relative shrink-0 w-16 h-16 rounded-full overflow-hidden bg-neutral-800'>
          {coverImage ? (
            <img src={coverImage} alt={name} className='w-full h-full object-cover' />
          ) : (
            <div className='w-full h-full bg-neutral-700' />
          )}
        </div>
        <div className='flex flex-col gap-1 min-w-0'>
          {subName && <p className='text-xs text-neutral-400 truncate'>{subName}</p>}
          <h2 className='text-lg font-bold text-white leading-tight truncate'>{name}</h2>
          {role && (
            <span className='self-start text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700'>
              {role}
            </span>
          )}
        </div>
      </div>

      {/* 분야 태그 */}
      {field.length > 0 && (
        <div className='flex flex-wrap gap-1.5'>
          {field.map((f) => (
            <span key={f} className='text-xs px-2.5 py-1 rounded-full bg-neutral-900 text-neutral-400 border border-neutral-800'>
              {f}
            </span>
          ))}
        </div>
      )}

      {/* 연락처 */}
      <div className='flex flex-col gap-1.5 mt-auto pt-2 border-t border-neutral-800'>
        {email && (
          <a
            href={`mailto:${email}`}
            className='flex items-center gap-2 text-xs text-neutral-400 hover:text-white transition-colors truncate'
          >
            <MdAlternateEmail className='shrink-0 text-base' />
            <span className='truncate'>{email}</span>
          </a>
        )}
        {website && (
          <a
            href={website}
            target='_blank'
            rel='noopener noreferrer'
            className='flex items-center gap-2 text-xs text-neutral-400 hover:text-white transition-colors truncate'
          >
            <MdLink className='shrink-0 text-base' />
            <span className='truncate'>{shortUrl(website)}</span>
          </a>
        )}
      </div>
    </div>
  )
}
