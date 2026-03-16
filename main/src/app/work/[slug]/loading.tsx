import { ConsoleLoading } from '@/components'

export default function Loading() {
  return (
    <ConsoleLoading
      lines={[
        '> loading project...',
        '> connecting to open source lab...',
        '> fetching content blocks...',
        '> rendering...',
      ]}
    />
  )
}
