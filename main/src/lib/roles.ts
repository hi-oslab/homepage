// 화면에 보이는 역할 이름 — 위계보다 협업 느낌으로 운영자(Operator) / 멤버(Member)
// 코드와 DB에서는 그대로 is_master(운영자 여부)를 쓴다.

export const ROLE_LABELS = {
  operator: { ko: '운영자', en: 'Operator' },
  member: { ko: '멤버', en: 'Member' },
} as const
