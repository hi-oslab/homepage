# Notion 데이터베이스 스키마 관리 가이드

노션 DB를 수정할 때는 **`schema.ts` 파일 하나만** 편집하면 됩니다.
타입과 파싱 로직은 자동으로 반영됩니다.

---

## 속성 추가/수정/삭제

`schema.ts`의 `DATABASE_REGISTRY` 안에서 해당 DB의 `schema` 객체를 수정합니다.

```ts
// schema.ts > DATABASE_REGISTRY > works > schema
schema: {
  slug: 'rich_text',
  thumbnail: 'files_image',
  title: 'title',
  newField: 'select',   // ← 추가
  // removedField: ...  // ← 삭제 (줄 전체 제거)
}
```

### 사용 가능한 속성 타입

| Notion 속성 타입 | schema.ts에 쓸 값 | 파싱 결과 타입 |
|---|---|---|
| 제목(Title) | `'title'` | `string` |
| 텍스트(Rich text) | `'rich_text'` | `string` |
| 숫자(Number) | `'number'` | `number` |
| 선택(Select) | `'select'` | `string` |
| 다중 선택(Multi-select) | `'multi_select'` | `{ name: string }[]` |
| 다중 선택 (이름만) | `'multi_select_names'` | `string[]` |
| 날짜(Date) | `'date'` | `{ start: string; end?: string }` |
| 파일/미디어 → 이미지 URL | `'files_image'` | `string` |
| URL | `'url'` | `string` |
| 생성 일시 | `'created_time'` | `string` |
| 마지막 편집 일시 | `'last_edited_time'` | `string` |

> `'multi_select'`는 `{ name }` 객체 배열, `'multi_select_names'`는 이름 문자열 배열입니다.

---

## 새 데이터베이스 추가

**Step 1.** `.env`에 데이터베이스 ID 환경변수를 추가합니다.

```env
NEXT_PUBLIC_NOTION_NEW_DB_DATABASE_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Step 2.** `schema.ts`의 `DATABASE_REGISTRY`에 항목을 추가합니다.

```ts
export const DATABASE_REGISTRY = {
  works: { ... },
  members: { ... },

  // 새 DB 추가
  blog: {
    envKey: 'NEXT_PUBLIC_NOTION_NEW_DB_DATABASE_ID',
    schema: {
      title: 'title',
      content: 'rich_text',
      publishedAt: 'date',
      tags: 'multi_select_names',
    },
  },
}
```

이것만 하면 자동으로:
- `TableType`에 `'blog'` 추가
- `ParsedItem<'blog'>` 타입 사용 가능
- `getParsedDataByTableType('blog')` 사용 가능

**Step 3.** (선택) 컴포넌트에서 쓸 named 타입이 필요하면 추가합니다.

```ts
// schema.ts 하단
export type BlogItem = ParsedItem<'blog'>
```

**Step 4.** 페이지에서 사용합니다.

```ts
const blogs = await getParsedDataByTableType('blog')
// blogs는 BlogItem[] 타입으로 자동 추론됩니다.
```

---

## 데이터베이스 삭제

`DATABASE_REGISTRY`에서 해당 항목을 제거합니다.
TypeScript가 삭제된 DB를 참조하는 코드를 자동으로 에러로 표시해줍니다.

---

## 파일 구조

```
src/app/api/
├── schema.ts          ← ✏️ 노션 DB 수정 시 여기만 편집
├── notion.ts          ← Notion API 통신 로직 (건드릴 일 없음)
└── NOTION_SCHEMA_GUIDE.md

src/types/
└── index.ts           ← ParsedType re-export (건드릴 일 없음)
```

---

## published 필터

`getPagesByTableType()`은 노션 DB의 `published` 체크박스가 체크된 항목만 가져옵니다.
노션에서 `published` 속성을 켜야 데이터가 표시됩니다.
