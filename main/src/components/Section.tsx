import classNames from 'classnames'

export const Section = ({
  children,
  className,
  fixed = false,
}: {
  children: React.ReactNode
  className?: string
  fixed?: boolean
}) => {
  return (
    <section
      className={classNames(
        'w-full relative snap-start',
        className,
        fixed ? 'h-screen' : 'min-h-screen h-fit overflow-y-scroll',
      )}
    >
      {children}
    </section>
  )
}
