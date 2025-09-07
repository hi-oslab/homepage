import classNames from 'classnames'

export const Section = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return (
    <section
      className={classNames('w-full relative h-screen flex flex-col items-center justify-center snap-start', className)}
    >
      {children}
    </section>
  )
}
