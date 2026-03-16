import { ConsoleLoading } from '@/components'

export default function Loading() {
  return (
    <ConsoleLoading
      lines={[
        '> initializing about page...',
        '> connecting to notion api...',
        '> fetching crew members...',
        '> rendering...',
      ]}
    />
  )
}
