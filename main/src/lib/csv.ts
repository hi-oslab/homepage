// CSV 만들기 · 내려받기 (브라우저 전용)

const escapeCell = (value: string) => (/[",\n\r]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value)

export const toCsv = (rows: string[][]) => rows.map((row) => row.map(escapeCell).join(',')).join('\r\n')

/** 엑셀에서 한글이 깨지지 않도록 UTF-8 BOM을 붙여 내려받는다 */
export function downloadCsv(filename: string, rows: string[][]) {
  const blob = new Blob(['﻿', toCsv(rows)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
