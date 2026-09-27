/**
 * 입력하는 동안 전화번호에 하이픈을 넣는다 (숫자만 남기고 최대 11자리)
 * 입력 중에는 가운데 4자리를 먼저 채우고, 번호가 다 들어오면 자리에 맞춘다
 * 010-1234-5678 · 010-123-4567 · 02-1234-5678 · 02-123-4567
 */
export function formatPhone(input: string): string {
  const digits = input.replace(/[^\d]/g, '').slice(0, 11)
  // 서울 지역번호 02는 두 자리
  const head = digits.startsWith('02') ? 2 : 3
  const rest = digits.slice(head)
  if (!rest) return digits
  // 가운데 3자리로 끝나는 번호 (010-123-4567, 02-123-4567)
  const shortMiddle = rest.length === 7 && digits.length < 11
  const middle = shortMiddle ? 3 : 4
  if (rest.length <= middle) return `${digits.slice(0, head)}-${rest}`
  return `${digits.slice(0, head)}-${rest.slice(0, middle)}-${rest.slice(middle)}`
}
