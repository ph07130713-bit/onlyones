export type AnswerValue = string | string[] | number | null

const STYLE_TAGS = new Set([
  'minimal',
  'casual',
  'street',
  'classic',
  'athleisure',
  'sporty',
  'vintage',
  'preppy',
  'work',
])

const COLOR_TAGS = new Set([
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
])

const SEASON_TAGS = new Set(['spring', 'summer', 'fall', 'winter'])
const FIT_TAGS = new Set(['oversized', 'slim', 'regular', 'relaxed', 'wide', 'straight'])
const OCCASION_TAGS = new Set(['work', 'casual', 'date', 'travel', 'workout', 'events'])
const FABRIC_TAGS = new Set(['cotton', 'linen', 'wool', 'denim', 'knit', 'technical'])

const normalize = (value: string) => value.trim().toLowerCase()

const mapBudgetTags = (value: string) => {
  const normalized = normalize(value)
  if (normalized.includes('50,000') && normalized.includes('이하')) {
    return ['budget-low']
  }
  if (normalized.includes('50,000-') || normalized.includes('$50-$100')) {
    return ['budget-mid']
  }
  if (normalized.includes('100,000-') || normalized.includes('$100-$200')) {
    return ['budget-high']
  }
  if (normalized.includes('200,000+') || normalized.includes('$200+')) {
    return ['budget-premium']
  }
  return []
}

export const deriveTagsFromAnswers = (answers: Record<string, AnswerValue>) => {
  const tags = new Set<string>()

  for (const rawValue of Object.values(answers)) {
    if (typeof rawValue === 'number') {
      if (rawValue <= 2) tags.add('minimal')
      if (rawValue >= 4) tags.add('street')
      continue
    }

    if (typeof rawValue === 'string') {
      const value = normalize(rawValue)
      if (STYLE_TAGS.has(value)) tags.add(value)
      if (COLOR_TAGS.has(value)) tags.add(value)
      if (SEASON_TAGS.has(value)) tags.add(value)
      if (FIT_TAGS.has(value)) tags.add(value)
      if (OCCASION_TAGS.has(value)) tags.add(value)
      if (FABRIC_TAGS.has(value)) tags.add(value)
      mapBudgetTags(value).forEach((tag) => tags.add(tag))
      continue
    }

    if (Array.isArray(rawValue)) {
      for (const item of rawValue) {
        if (typeof item !== 'string') continue
        const value = normalize(item)
        if (STYLE_TAGS.has(value)) tags.add(value)
        if (COLOR_TAGS.has(value)) tags.add(value)
        if (SEASON_TAGS.has(value)) tags.add(value)
        if (FIT_TAGS.has(value)) tags.add(value)
        if (OCCASION_TAGS.has(value)) tags.add(value)
        if (FABRIC_TAGS.has(value)) tags.add(value)
      }
    }
  }

  if (tags.size === 0) {
    tags.add('casual')
    tags.add('minimal')
  }

  return Array.from(tags)
}
