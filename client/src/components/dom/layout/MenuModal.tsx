import * as S from './styles'
import { useRouter } from 'next/router'
import { useState } from 'react'

interface MenuModalProps {
  onHandleMenu: (isMenuOpen: boolean) => void
}

export default function MenuModal({ onHandleMenu }: MenuModalProps) {
  const router = useRouter()

  const pages = [
    {
      title: 'Home',
      path: '/',
    },
    {
      title: 'Intro',
      path: '/intro',
    },
    {
      title: 'Yes or No, Really?',
      path: '/yes-or-no-really',
    },
    {
      title: 'Rainbow Reflection',
      path: '/rainbow-reflection',
    },
    {
      title: 'Momo',
      path: '/momo',
    },
    {
      title: 'Happy Box',
      path: '/happy-box',
    },
    {
      title: 'Paranormal Sapiens',
      path: '/paranormal-sapiens',
    },
  ]

  const onClickEvent = (path: string) => () => {
    router.push(`/${path}`)
    onHandleMenu(false)
  }

  return (
    <S.MenuModal>
      <S.MenuModalContent>
        {pages.map((page, index) => (
          <S.MenuModalItem key={index} onClick={onClickEvent(page.path)}>
            <span>{page.title}</span>
          </S.MenuModalItem>
        ))}
      </S.MenuModalContent>
    </S.MenuModal>
  )
}
