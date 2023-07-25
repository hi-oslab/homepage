import styled from 'styled-components'
import tw from 'twin.macro'
import { MotionModal } from '@/styles/common.styles'

export const Header = styled.div<{
  height: number
  scrollPosition: number
}>`
  ${tw`
  fixed
  top-0
    w-full
    h-20
    bg-white
    flex
    flex-row
    justify-between
    items-center
    text-black
    text-3xl
    font-bold
    text-center 
    z-40
    border-b
    border-black
    `}
  ${({ scrollPosition }) => (scrollPosition < 20 ? tw`mix-blend-normal` : tw` mix-blend-difference`)}
`

export const HeaderLogo = styled.div`
  ${tw`
  flex 
  items-center
  pt-1
  h-full
  px-4
  cursor-pointer
  w-fit 
  active:opacity-50
  md:hover:opacity-50
  `}
`

export const MenuButton = styled.div`
  ${tw`
  flex 
  items-center 
  h-full 
  px-4 
  cursor-pointer 
  w-fit
  active:opacity-50
  md:hover:opacity-50
  `}
`
export const MenuModal = styled(MotionModal)`
  ${tw`
fixed
  z-30 
  w-full 
  h-full 
  flex
  justify-center
  items-center
  bg-white 
  text-black
  py-20
  px-10
  `}
`

export const MenuModalContent = styled.div`
  ${tw`
  flex
  flex-col
  w-fit
  h-full
  gap-4
  justify-center
  items-center
  md:items-start
  `}
`
export const MenuModalItem = styled.div`
  ${tw`
  flex
  flex-row
  justify-start
  items-center
  w-full
  px-8
  pt-2
  h-20
  text-4xl
  font-[hel-bd]
  cursor-pointer
  rounded-full
  active:opacity-50
  md:hover:opacity-50
  `}
`
export const MenuModalItemHidden = styled.p`
  ${tw`
  whitespace-pre
  font-[hel-th]
  hidden
  md:flex
  `}
`
