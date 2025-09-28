// ✅ Works 타입 정의
export interface WORKS_TYPE {
  id: string
  properties: {
    // 제목, 슬러그, 썸네일, 카테고리, 부제목, 프로젝트 기간, 태그, 설명, 생성일
    slug?: { rich_text: { plain_text: string }[] }
    thumbnail?: { files: { file: { url: string } }[] }
    title?: { title: { plain_text: string }[] }
    projectDate?: { created_time: string }
    subtitle?: { rich_text: { plain_text: string }[] }
    description?: { rich_text: { plain_text: string }[] }
    businessType?: { select: { name: string } }
    category?: { select: { name: string } }
    tags?: { multi_select: { name: string }[] }

    createdTime?: { created_time: string }
    lastEditedTime?: { last_edited_time: string }
  }
}

// ✅ Members 타입 정의

export interface MEMBERS_TYPE {
  id: string
  properties: {
    // 이름, 직책, 이메일, 웹사이트, 프로필 이미지, 설명, 역할, 분야
    coverImage?: { files: { file: { url: string } }[] }
    name?: { title: { plain_text: string }[] }
    subName?: { rich_text: { plain_text: string }[] }
    description?: { rich_text: { plain_text: string }[] }
    role?: { multi_select: { name: string }[] }

    field?: { multi_select: { name: string }[] }
    email?: { rich_text: { plain_text: string }[] }
    website?: { url: string }
  }
}
