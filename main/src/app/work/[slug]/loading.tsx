export default function Loading() {
  return (
    <>
      {/* header skeleton */}
      <div className='w-full h-fit px-4 md:px-8 py-6 md:py-12 flex flex-col items-start justify-start gap-4'>
        <div className='h-4 w-32 bg-neutral-700 rounded animate-pulse' />
        <div className='h-12 md:h-16 w-3/4 bg-neutral-700 rounded animate-pulse' />
        <div className='h-6 w-1/2 bg-neutral-700 rounded animate-pulse' />
      </div>
      {/* content skeleton */}
      <div className='w-full bg-white text-black min-h-dvh h-fit px-4 md:px-8 py-6 md:py-12 flex flex-col items-start justify-start gap-4'>
        <div className='h-4 w-full bg-neutral-200 rounded animate-pulse' />
        <div className='h-4 w-5/6 bg-neutral-200 rounded animate-pulse' />
        <div className='h-4 w-4/6 bg-neutral-200 rounded animate-pulse' />
        <div className='h-4 w-full bg-neutral-200 rounded animate-pulse mt-4' />
        <div className='h-4 w-5/6 bg-neutral-200 rounded animate-pulse' />
        <div className='h-48 w-full bg-neutral-200 rounded animate-pulse mt-4' />
        <div className='h-4 w-full bg-neutral-200 rounded animate-pulse mt-4' />
        <div className='h-4 w-3/4 bg-neutral-200 rounded animate-pulse' />
      </div>
    </>
  )
}
