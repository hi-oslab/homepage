import { ParsedType } from '@/types'
import { MdAlternateEmail, MdLink } from 'react-icons/md'

export const MemberCard = (member: ParsedType['members']) => {
  const linkShortener = (url: string) => {
    // url에 http:// 또는 https:// 가 포함되어 있으면 제거
    if (url.startsWith('http://')) {
      url = url.replace('http://', '')
    } else if (url.startsWith('https://')) {
      url = url.replace('https://', '')
    }

    //url 끝에 / 가 있으면 제거
    if (url.endsWith('/')) {
      url = url.slice(0, -1)
    }

    // url이 너무 길면 20자 이후로는 ... 으로 대체
    if (url.length > 20) {
      return url.slice(0, 20) + '...'
    }
    return url
  }

  return (
    <div key={member.id} className='w-full h-fit grid grid-cols-[1fr_3fr] grid-rows-[1fr_auto] gap-4'>
      <div className='w-full h-auto aspect-square flex justify-center items-center relative'>
        {member.properties.role && (
          <div className='absolute top-0 left-0 bg-neutral-50 uppercase text-black px-2 py-1 leading-none text-sm rounded-full shadow-sm'>
            {member.properties.role}
          </div>
        )}
        <img src={member.properties.coverImage} alt={member.properties.name} className='w-auto h-full aspect-square' />
      </div>
      <div className='w-full flex flex-col justify-start items-start'>
        <h3 className='text-base'>{member.properties.subName}</h3>
        <h2 className='text-2xl font-bold text-white mb-2'>{member.properties.name}</h2>
        <a className='text-base flex items-center' href={`mailto:${member.properties.email}`}>
          <MdAlternateEmail className='mr-2' />
          {member.properties.email}
        </a>
        <a
          className='text-base flex items-center'
          href={member.properties.website}
          target='_blank'
          rel='noopener noreferrer'
        >
          <MdLink className='mr-2' />
          {linkShortener(member.properties.website)}
        </a>
      </div>

      <div className='col-span-full w-full h-fit flex flex-wrap justify-start items-start'>
        {member.properties.field.map((field) => (
          <span key={field} className='inline-block bg-neutral-800 text-white text-xs px-3 py-1 mr-2 mb-2 rounded-full'>
            {field}
          </span>
        ))}
        {/* <p className='mt-4 text-lg'>{member.properties.description}</p> */}
      </div>
    </div>
  )
}
