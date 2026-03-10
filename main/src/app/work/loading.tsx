export default function Loading() {
  return (
    <div className='w-full min-h-dvh h-fit flex flex-col gap-8 md:gap-16 p-4 md:p-8 justify-start items-center'>
      <div className='h-10 w-48 bg-neutral-700 rounded animate-pulse' />
      <div className='w-full flex flex-col gap-4 md:gap-8 p-4'>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className='w-full flex flex-col md:flex-row gap-2 md:gap-8'>
            <div className='w-full md:w-1/3 aspect-video bg-neutral-800 rounded animate-pulse' />
            <div className='w-full md:w-2/3 flex flex-col gap-2'>
              <div className='h-6 w-2/3 bg-neutral-700 rounded animate-pulse' />
              <div className='h-4 w-full bg-neutral-700 rounded animate-pulse' />
              <div className='h-4 w-4/5 bg-neutral-700 rounded animate-pulse' />
              <div className='h-4 w-24 bg-neutral-800 rounded animate-pulse mt-2' />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
