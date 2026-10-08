import { NextResponse } from 'next/server'
import { getCurrentUser, isApproved } from '@/lib/admin-auth'
import { createAdminSupabaseClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

type VisitRow = {
  today_visitors: number | string
  current_visitors: number | string
  average_visitors: number | string
  my_average_visits: number | string
}

export async function POST() {
  const user = await getCurrentUser().catch(() => null)
  if (!isApproved(user)) return NextResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 })

  const supabase = createAdminSupabaseClient()
  const [{ data: visits, error }, communityPosts, labPosts, communityComments, labComments] = await Promise.all([
    supabase.rpc('record_space_visit', { p_user_id: user.id }).single(),
    supabase.from('community_posts').select('id', { count: 'exact', head: true }).eq('author_id', user.id),
    supabase.from('lab_articles').select('id', { count: 'exact', head: true }).eq('created_by', user.id),
    supabase.from('community_comments').select('id', { count: 'exact', head: true }).eq('author_id', user.id),
    supabase.from('lab_comments').select('id', { count: 'exact', head: true }).eq('author_id', user.id),
  ])

  if (error) {
    console.error('record_space_visit', error.message)
    return NextResponse.json({ message: '방문 통계를 불러오지 못했습니다.' }, { status: 503 })
  }

  const row = visits as VisitRow
  return NextResponse.json({
    todayVisitors: Number(row.today_visitors),
    currentVisitors: Number(row.current_visitors),
    averageVisitors: Number(row.average_visitors),
    myAverageVisits: Number(row.my_average_visits),
    myPosts: (communityPosts.count ?? 0) + (labPosts.count ?? 0),
    myComments: (communityComments.count ?? 0) + (labComments.count ?? 0),
  })
}
