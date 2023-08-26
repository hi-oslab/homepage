import * as S from './styles'

export function Spinner(props) {
  return (
    <>
      <div className='w-fit h-fit flex flex-col justify-center items-center'>
        <S.Spinner />
        <div className='mt-4 w-[150px] h-[10px] border-2 border-black flex justify-start items-center rounded-full'>
          <div
            className=' h-[100%] bg-black rounded-full'
            style={{
              width: `${props.progress}%`,
            }}></div>
        </div>
        <div className='py-1 text-xl font-bold text-black h-fit'>{props.progress}%</div>
      </div>
    </>
  )
}
