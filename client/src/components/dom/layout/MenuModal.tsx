import * as S from './styles'
import { useRouter } from 'next/router'
import { useState } from 'react'

interface MenuModalProps {
  onHandleMenu: (isMenuOpen: boolean) => void
}

export default function MenuModal({ onHandleMenu }: MenuModalProps) {
  const router = useRouter()
  const onClickEvent = (path: string) => () => {
    router.push(`/${path}`)
    onHandleMenu(false)
  }

  return (
    <S.MenuModal>
      <S.MenuModalContent>
        <S.MenuModalItem onClick={onClickEvent('#')}>
          <span>First</span>
          <S.MenuModalItemHidden> | SubTitle</S.MenuModalItemHidden>
        </S.MenuModalItem>
        <S.MenuModalItem onClick={onClickEvent('#')}>
          <span>Second</span>
          <S.MenuModalItemHidden> | SubTitle </S.MenuModalItemHidden>
        </S.MenuModalItem>
        <S.MenuModalItem onClick={onClickEvent('#')}>
          <span>Third</span>
          <S.MenuModalItemHidden> | SubTitle</S.MenuModalItemHidden>
        </S.MenuModalItem>
      </S.MenuModalContent>
    </S.MenuModal>
  )
}
