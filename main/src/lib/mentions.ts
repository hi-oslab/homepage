// 멘션 (서버 · 브라우저 공용)
// - '@'로 목록에서 고르면 '@실명(아이디)'로 저장된다. 괄호 안 로그인 아이디로 사람을 찾으므로
//   이름이 같은 멤버가 있거나 나중에 이름을 바꿔도 정확히 그 사람이다. 화면에는 '@실명'만 보인다.
// - 목록을 거치지 않고 '@실명'만 직접 쓴 경우는 실명으로 찾는다 (이름이 같으면 모두).

export type Mentionable = { id: string; name: string; username: string }

export type MentionMatch<T extends Mentionable> = {
  start: number
  end: number
  /** 화면에 보일 글자 ('@실명', 아이디는 숨긴다) */
  label: string
  members: T[]
}

/** '@' 앞이 글자 · 숫자면 멘션이 아니다 (메일 주소 등) */
const WORD = new RegExp('[\\p{L}\\p{N}]', 'u')
/** '@실명(아이디)' — 아이디 규칙은 admin-auth.ts의 USERNAME_PATTERN과 같다 */
const TOKEN = /^@([^()@\n]{1,40})\(([a-z][a-z0-9_]{3,19})\)/

/** 목록에서 골랐을 때 본문에 넣는 글자 */
export const mentionToken = (member: Mentionable) => `@${member.name}(${member.username})`

/**
 * 글에서 멘션을 찾는다.
 * 1) '@이름(아이디)' → 아이디로 (지금 이름으로 보여준다)
 * 2) '@이름' → 가장 긴 이름부터 ('@오세진'이 '오세' · '오세진' 둘 다에 걸리면 '오세진')
 */
export function findMentions<T extends Mentionable>(text: string, members: T[]): MentionMatch<T>[] {
  if (!text.includes('@') || members.length === 0) return []
  const byLength = Array.from(new Set(members.map((member) => member.name.trim()).filter(Boolean))).sort(
    (a, b) => b.length - a.length,
  )
  const matches: MentionMatch<T>[] = []
  let index = text.indexOf('@')
  while (index !== -1) {
    let end = -1
    if (index === 0 || !WORD.test(text[index - 1])) {
      const token = text.slice(index).match(TOKEN)
      const byUsername = token && members.find((member) => member.username === token[2])
      if (token && byUsername) {
        end = index + token[0].length
        matches.push({ start: index, end, label: `@${byUsername.name}`, members: [byUsername] })
      } else {
        const name = byLength.find((item) => text.startsWith(item, index + 1))
        if (name) {
          end = index + 1 + name.length
          const same = members.filter((member) => member.name.trim() === name)
          matches.push({ start: index, end, label: `@${name}`, members: same })
        }
      }
    }
    index = text.indexOf('@', end === -1 ? index + 1 : end)
  }
  return matches
}

/** 이 글이 이 사람을 언급했는지 */
export const mentions = (text: string | null | undefined, members: Mentionable[], userId: string) =>
  Boolean(text) &&
  findMentions(text as string, members).some((match) => match.members.some((member) => member.id === userId))
