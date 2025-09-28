//@/types/index.ts

// ✅ 데이터 파싱

export interface ParsedType {
  works: {
    id: string
    properties: {
      slug: string
      thumbnail: string
      title: string
      projectDate: string
      subtitle: string
      description: string
      businessType: string
      category: string
      tags: { name: string }[]
      createdTime: string
      lastEditedTime: string
    }
  }
  members: {
    id: string
    properties: {
      coverImage: string
      name: string
      subName: string
      description: string
      role: string[]
      field: string[]
      email: string
      website: string
    }
  }
}
