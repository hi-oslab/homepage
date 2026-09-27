import { cn } from '@/lib/cn'
import { ROLE_LABELS } from '@/lib/roles'

/** 운영자 표시. 위계가 두드러지지 않도록 옅은 면 + 흐린 글자 */
export const OperatorBadge = ({ className }: { className?: string }) => (
  <span
    className={cn(
      'shrink-0 rounded-full bg-tile px-1.5 py-px text-[10px] font-normal tracking-normal text-ink/55',
      className,
    )}
  >
    {ROLE_LABELS.operator.en}
  </span>
)
