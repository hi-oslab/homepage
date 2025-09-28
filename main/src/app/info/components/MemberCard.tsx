import { ParsedType } from '@/types'

export const MemberCard = (member: ParsedType['members']) => {
  return (
    <div
      key={member.id}
      className='bg-black text-white p-4 w-full h-auto aspect-square rounded-lg shadow-lg flex flex-col items-center gap-2'
    >
      <div className='w-full h-[30%] flex flex-col justify-center items-center'>
        <h3 className='text-base font-semibold text-gray-500'>{member.properties.subName}</h3>
        <h2 className='text-3xl font-bold text-white'>{member.properties.name}</h2>
      </div>
      <div className='w-full h-[60%] flex justify-center items-center'>
        <img
          src={member.properties.coverImage}
          alt={member.properties.name}
          className='w-auto h-full aspect-square rounded-xl border'
        />
      </div>
      <div className='w-full h-[10%] flex justify-center items-center'>
        <p className='mt-2 text-md'>Role: {member.properties.role.join(', ')}</p>
      </div>

      {/* <p className='mt-1 text-md'>Field: {member.properties.field.join(', ')}</p> */}
      {/* <p className='mt-4 text-lg'>{member.properties.description}</p> */}
      {/* <p className='mt-1 text-md'>Email: {member.properties.email}</p> */}
      {/* <p className='mt-1 text-md'>Website: {member.properties.website}</p> */}
    </div>
  )
}
