import styled from 'styled-components'
import tw from 'twin.macro'
export const SpinnerCover = styled.div`
  ${tw`
  fixed
  top-1/2
  left-1/2
  -translate-x-1/2
  -translate-y-1/2
  flex
  justify-center
  items-center
  `}
`

export const Spinner = styled.span`
  width: 48px;
  height: 48px;
  border: 2px solid #fff;
  border-radius: 50%;
  display: inline-block;
  position: relative;
  box-sizing: border-box;
  animation: rotation 1s linear infinite;
  ::after {
    content: '';
    box-sizing: border-box;
    position: absolute;
    left: 50%;
    top: 0;
    background: white;
    width: 3px;
    height: 24px;
    transform: translateX(-50%);
  }

  @keyframes rotation {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`
