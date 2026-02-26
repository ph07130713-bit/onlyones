import { supabase } from './supabase'

type QuizAnswerRow = {
  question_id: string
  answer: unknown
}

type ProductRow = {
  id: string
  title: string
  brand: string | null
  price_cents: number
  tags: string[] | null
  attributes: {
    style?: string
    color?: string
    season?: string[] | string
    fit?: string
    occasion?: string[] | string
  } | null
  active: boolean
}

type Preferences = {
  styles: Set<string>
  colors: Set<string>
  occasions: Set<string>
  seasons: Set<string>
  budget?: { min: number; max: number | null }
}

const STYLE_SET = new Set([
  'minimal',
  'casual',
  'street',
  'classic',
  'athleisure',
  'vintage',
  'preppy',
])
const COLOR_SET = new Set([
  'black',
  'white',
  'gray',
  'navy',
  'beige',
  'brown',
  'olive',
  'blue',
  'red',
  'pastels',
  'ivory',
  'cream',
  'charcoal',
  'taupe',
  'sand',
  'sage',
  'camel',
  'forest',
  'clay',
  'rust',
])
const OCCASION_SET = new Set([
  'work',
  'casual',
  'date',
  'travel',
  'workout',
  'events',
])
const SEASON_SET = new Set(['spring', 'summer', 'fall', 'winter'])

const budgetFromAnswer = (value: string) => {
  const normalized = value.toLowerCase()
  if (normalized.includes('under')) return { min: 0, max: 5000 }
  if (normalized.includes('$50-$100')) return { min: 5000, max: 10000 }
  if (normalized.includes('$100-$200')) return { min: 10000, max: 20000 }
  if (normalized.includes('$200')) return { min: 20000, max: null }
  return undefined
}

const toArray = (value: string[] | string | undefined) => {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

const normalize = (value: string) => value.trim().toLowerCase()

const extractPreferences = (answers: QuizAnswerRow[]): Preferences => {
  const prefs: Preferences = {
    styles: new Set(),
    colors: new Set(),
    occasions: new Set(),
    seasons: new Set(),
  }

  for (const row of answers) {
    const answer = row.answer
    if (typeof answer === 'string') {
      const value = normalize(answer)
      if (STYLE_SET.has(value)) prefs.styles.add(value)
      if (COLOR_SET.has(value)) prefs.colors.add(value)
      if (OCCASION_SET.has(value)) prefs.occasions.add(value)
      if (SEASON_SET.has(value)) prefs.seasons.add(value)
      if (!prefs.budget) {
        const budget = budgetFromAnswer(answer)
        if (budget) prefs.budget = budget
      }
      continue
    }

    if (Array.isArray(answer)) {
      for (const item of answer) {
        if (typeof item !== 'string') continue
        const value = normalize(item)
        if (STYLE_SET.has(value)) prefs.styles.add(value)
        if (COLOR_SET.has(value)) prefs.colors.add(value)
        if (OCCASION_SET.has(value)) prefs.occasions.add(value)
        if (SEASON_SET.has(value)) prefs.seasons.add(value)
        if (!prefs.budget) {
          const budget = budgetFromAnswer(item)
          if (budget) prefs.budget = budget
        }
      }
    }
  }

  return prefs
}

const scoreProduct = (product: ProductRow, prefs: Preferences) => {
  let score = 0
  const reasons: string[] = []
  const tags = (product.tags ?? []).map(normalize)
  const attrs = product.attributes ?? {}
  const attrStyle = attrs.style ? normalize(attrs.style) : ''
  const attrColor = attrs.color ? normalize(attrs.color) : ''
  const attrSeasons = toArray(attrs.season).map(normalize)
  const attrOccasions = toArray(attrs.occasion).map(normalize)

  for (const style of prefs.styles) {
    if (tags.includes(style) || attrStyle === style) {
      score += 3
      reasons.push(`${style} 스타일`)
    }
  }

  for (const color of prefs.colors) {
    if (tags.includes(color) || attrColor === color) {
      score += 2
      reasons.push(`${color} 선호`)
    }
  }

  for (const season of prefs.seasons) {
    if (tags.includes(season) || attrSeasons.includes(season)) {
      score += 1.5
      reasons.push(`${season} 시즌`)
    }
  }

  for (const occasion of prefs.occasions) {
    if (tags.includes(occasion) || attrOccasions.includes(occasion)) {
      score += 1.5
      reasons.push(`${occasion} 상황`)
    }
  }

  if (prefs.budget) {
    const { min, max } = prefs.budget
    if (max !== null && product.price_cents > max) {
      score -= 3
    } else if (product.price_cents >= min) {
      score += 2
    } else {
      score -= 1
    }
  }

  const reason =
    reasons.length > 0
      ? reasons.slice(0, 3).join(' + ')
      : '기본 추천'

  return { score, reason }
}

export const generateRecommendationsForUser = async (userId: string) => {
  const { data: answers, error: answersError } = await supabase
    .from('quiz_answers')
    .select('question_id, answer')
    .eq('user_id', userId)

  if (answersError) {
    throw answersError
  }

  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, title, brand, price_cents, tags, attributes, active')
    .eq('active', true)

  if (productsError) {
    throw productsError
  }

  const prefs = extractPreferences((answers ?? []) as QuizAnswerRow[])

  const scored = (products ?? []).map((product) => {
    const { score, reason } = scoreProduct(product as ProductRow, prefs)
    return {
      product_id: (product as ProductRow).id,
      score,
      reason,
    }
  })

  const top = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)
    .map((item) => ({
      user_id: userId,
      product_id: item.product_id,
      score: item.score,
      reason: item.reason,
    }))

  const { error: deleteError } = await supabase
    .from('recommendations')
    .delete()
    .eq('user_id', userId)

  if (deleteError) {
    throw deleteError
  }

  const { error: insertError } = await supabase
    .from('recommendations')
    .insert(top)

  if (insertError) {
    throw insertError
  }

  return top.length
}
