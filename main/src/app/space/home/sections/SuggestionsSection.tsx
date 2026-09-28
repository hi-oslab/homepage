import { Suggestions } from '../../suggestions/Suggestions'
import { getHomeSuggestions, getHomeViewer } from '../data'

/** 웹사이트 건의사항 (화면 · 동작은 suggestions/ 폴더) */
export async function SuggestionsSection({ className }: { className?: string }) {
  const [items, viewer] = await Promise.all([getHomeSuggestions(), getHomeViewer()])
  return <Suggestions initialItems={items} viewer={viewer} className={className} />
}
