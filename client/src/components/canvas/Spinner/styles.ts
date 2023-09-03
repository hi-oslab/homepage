import styled from 'styled-components'
import tw from 'twin.macro'

export const Spinner = styled.svg`
  width: 200px;
  fill: white;
  @keyframes loading {
    0%,
    20%,
    50%,
    80%,
    100% {
      transform: translateY(0);
    }
    40% {
      transform: translateY(-30px);
    }
    60% {
      transform: translateY(-20px);
    }
  }
`
