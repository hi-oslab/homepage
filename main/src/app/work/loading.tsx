import { ConsoleLoading } from '@/components'

export default function Loading() {
  return (
    <ConsoleLoading
      lines={[
        '> initializing work page...',
        '> connecting to open source lab...',
        '> fetching projects...',
        '> rendering...',
      ]}
    />
  )
}
