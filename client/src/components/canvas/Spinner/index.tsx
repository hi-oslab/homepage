import * as S from './styles'

export function Spinner(props) {
  return (
    <>
      <div className='w-fit h-fit flex flex-col justify-center items-center'>
        <div className='mt-4 w-[150px] h-[10px] border-2 border-black flex justify-start items-center'>
          <div
            className=' h-[100%] bg-black transition-all duration-500'
            style={{
              width: `${props.progress}%`,
            }}></div>
        </div>
        <div className='py-1 text-xl font-bold text-black h-fit'>{props.progress}%</div>
      </div>
    </>
  )
}