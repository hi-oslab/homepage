import { ParsedType } from '@/types'
import { MdAlternateEmail, MdLink } from 'react-icons/md'

type MemberCardProps = {
  member: ParsedType['members']
}

export const MemberCard = ({ member }: MemberCardProps) => {
  const { name, subName, role, coverImage, email, website, field } = member.properties

  return (
    <div className='group w-full flex flex-col gap-5 p-6 border border-neutral-800 hover:border-neutral-500 transition-colors duration-300'>
      {/* 아바타 + 이름 */}
      <div className='flex items-center gap-4'>
        <div className='shrink-0 w-14 h-14 overflow-hidden bg-neutral-900 border border-neutral-800'>
          {coverImage ? (
            <img src={coverImage} alt={name} className='w-full h-full object-cover' />
          ) : (
            <div className='w-full h-full flex items-center justify-center text-neutral-500 text-lg font-bold'>
              {name?.[0] ?? '?'}
            </div>
          )}
        </div>
        <div className='min-w-0'>
          {subName && <p className='text-xs text-neutral-500 mb-0.5 truncate'>{subName}</p>}
          <h2 className='text-base font-semibold text-white leading-snug truncate'>{name}</h2>
          {role && <p className='text-xs text-neutral-400 mt-0.5'>{role}</p>}
        </div>
      </div>

      {/* 분야 태그 */}
      {field.length > 0 && (
        <div className='flex flex-wrap gap-1.5'>
          {field.map((f) => (
            <span key={f} className='text-xs px-2 py-0.5 text-neutral-400 border border-neutral-800 bg-neutral-950'>
              {f}
            </span>
          ))}
        </div>
      )}

      {/* 연락처 */}
      {(email || website) && (
        <div className='flex flex-col gap-1.5 pt-4 border-t border-neutral-800/60'>
          {email && (
            <a
              href={`mailto:${email}`}
              className='flex items-center gap-2 text-xs text-neutral-500 hover:text-neutral-200 transition-colors'
            >
              <MdAlternateEmail className='shrink-0' />
              <span className='truncate'>{email}</span>
            </a>
          )}
          {website && (
            <a
              href={website}
              target='_blank'
              rel='noopener noreferrer'
              className='flex items-center gap-2 text-xs text-neutral-500 hover:text-neutral-200 transition-colors'
            >
              <MdLink className='shrink-0' />
              <span className='truncate'>{website.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
            </a>
          )}
        </div>
      )}
    </div>
  )
}
