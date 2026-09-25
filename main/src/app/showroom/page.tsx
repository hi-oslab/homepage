import type { Metadata } from 'next'
import { TerminalShowroom } from './TerminalShowroom'

export const metadata: Metadata = {
  title: 'Terminal Showroom',
  robots: { index: false, follow: false },
}

export default function ShowroomPage() {
  return <TerminalShowroom />
}
