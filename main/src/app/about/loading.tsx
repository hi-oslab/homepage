export default function Loading() {
  return (
    <>
      {/* intro section skeleton */}
      <div className='px-4 md:px-8 h-[calc(100dvh-128px)] flex flex-col gap-4 md:gap-8 md:flex-row items-center justify-center'>
        <div className='w-full h-fit md:h-full flex items-center'>
          <div className='h-10 md:h-14 w-2/3 bg-neutral-700 rounded animate-pulse' />
        </div>
        <div className='w-full h-fit md:h-full flex flex-col justify-center gap-2'>
          <div className='h-4 w-full bg-neutral-700 rounded animate-pulse' />
          <div className='h-4 w-5/6 bg-neutral-700 rounded animate-pulse' />
          <div className='h-4 w-4/6 bg-neutral-700 rounded animate-pulse' />
        </div>
      </div>

      {/* members grid skeleton */}
      <div className='w-full h-fit flex flex-col gap-8 md:gap-16 p-4 md:p-8 justify-start items-center'>
        <div className='h-8 w-64 bg-neutral-700 rounded animate-pulse' />
        <div className='w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 p-4 gap-8 pb-32 md:pb-48'>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className='w-full h-fit grid grid-cols-[1fr_3fr] grid-rows-[1fr_auto] gap-4'>
              <div className='w-full aspect-square bg-neutral-800 rounded animate-pulse' />
              <div className='w-full flex flex-col justify-start gap-2'>
                <div className='h-4 w-1/2 bg-neutral-700 rounded animate-pulse' />
                <div className='h-6 w-3/4 bg-neutral-700 rounded animate-pulse' />
                <div className='h-4 w-2/3 bg-neutral-800 rounded animate-pulse mt-2' />
                <div className='h-4 w-1/2 bg-neutral-800 rounded animate-pulse' />
              </div>
              <div className='col-span-full flex gap-2'>
                <div className='h-5 w-16 bg-neutral-800 rounded-full animate-pulse' />
                <div className='h-5 w-20 bg-neutral-800 rounded-full animate-pulse' />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
