import classNames from 'classnames'

export function DividerBlock({ className }: { className?: string }) {
  return <div aria-hidden='true' className={classNames('my-16 size-1.5 rounded-full bg-black/25 md:my-24', className)} />
}
