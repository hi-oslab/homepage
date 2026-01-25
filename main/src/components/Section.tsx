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
        className ? className : 'px-4 py-4 md:px-8 md:py-8',
        fixed ? 'h-screen' : 'min-h-screen h-fit overflow-y-scroll',
      )}
    >
      {children}
    </section>
  )
}
