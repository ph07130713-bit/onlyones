import { useEffect, useMemo, useState } from 'react'
import Card from '../components/Card'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

type ProductRow = {
  id: string
  title: string
  brand: string | null
  price_cents: number
  images: string[] | null
  tags: string[] | null
  attributes: {
    occasion?: string[] | string
  } | null
}

type QuizAnswerRow = {
  answer: string | string[] | number | null
}

type RecommendationRow = {
  id: string
  score: number
  product: ProductRow
}

export default function Results() {
  const { currentUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<RecommendationRow[]>([])

  useEffect(() => {
    let active = true

    const run = async () => {
      if (!currentUser) {
        setError('Failed to generate recommendations')
        setLoading(false)
        return
      }

      const { data: answerData, error: answerError } = await supabase
        .from('quiz_answers')
        .select('answer')
        .eq('user_id', currentUser.id)

      if (answerError) {
        console.error('quiz_answers fetch failed', {
          code: answerError.code,
          message: answerError.message,
        })
        throw answerError
      }

      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('id, title, brand, price_cents, images, tags, attributes, active')
        .eq('active', true)

      if (productError) {
        console.error('products fetch failed', {
          code: productError.code,
          message: productError.message,
        })
        throw productError
      }

      if (!active) return

      const { preferredTags, occasionTags, budget } = buildPreferences(
        (answerData ?? []) as QuizAnswerRow[],
      )

      const recommendations = (productData ?? [])
        .map((product) => {
          const casted = product as ProductRow
          const score = scoreProduct(casted, preferredTags, occasionTags, budget)
          return { id: casted.id, product: casted, score }
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 12)

      setItems(recommendations)
      setLoading(false)
    }

    run().catch((err) => {
      if (!active) return
      console.error('recommendations failed', {
        code: err?.code,
        message: err?.message,
      })
      setError('Failed to generate recommendations')
      setLoading(false)
    })

    return () => {
      active = false
    }
  }, [currentUser])

  return (
    <section className="page results">
      <Card>
        <h1>Results</h1>
        {loading ? <p>Generating your recommendations...</p> : null}
        {error ? <p className="error">{error}</p> : null}
        {!loading && !error ? (
          <div className="results-grid">
            {items.map((item) => {
              const product = item.product
              return (
                <article key={item.id} className="result-card">
                  <div className="result-media">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt={product.title} />
                    ) : (
                      <div className="media-placeholder">No image</div>
                    )}
                  </div>
                  <div className="result-body">
                    <div className="result-brand">{product.brand ?? 'OnlyOnes'}</div>
                    <h3>{product.title}</h3>
                    <p className="result-price">
                      ${(product.price_cents / 100).toFixed(2)}
                    </p>
                    <div className="result-tags">
                      {(product.tags ?? []).slice(0, 4).map((tag) => (
                        <span key={tag}>{tag}</span>
                      ))}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        ) : null}
      </Card>
    </section>
  )
}

type BudgetRange = {
  min: number
  max: number | null
}

const normalize = (value: string) => value.trim().toLowerCase()

const budgetFromScale = (value: number): BudgetRange => {
  switch (value) {
    case 1:
      return { min: 0, max: 30000 }
    case 2:
      return { min: 30000, max: 50000 }
    case 3:
      return { min: 50000, max: 100000 }
    case 4:
      return { min: 100000, max: 200000 }
    case 5:
      return { min: 200000, max: null }
    default:
      return { min: 0, max: null }
  }
}

const buildPreferences = (answers: QuizAnswerRow[]) => {
  const preferredTags = new Set<string>()
  const occasionTags = new Set<string>()
  let budget: BudgetRange | null = null

  for (const row of answers) {
    const value = row.answer
    if (typeof value === 'string') {
      preferredTags.add(normalize(value))
      if (['work', 'casual', 'date', 'travel', 'workout', 'events'].includes(
        normalize(value),
      )) {
        occasionTags.add(normalize(value))
      }
      continue
    }

    if (Array.isArray(value)) {
      value
        .filter((item): item is string => typeof item === 'string')
        .forEach((item) => {
          const normalized = normalize(item)
          preferredTags.add(normalized)
          if (
            ['work', 'casual', 'date', 'travel', 'workout', 'events'].includes(
              normalized,
            )
          ) {
            occasionTags.add(normalized)
          }
        })
      continue
    }

    if (typeof value === 'number') {
      budget = budgetFromScale(value)
    }
  }

  return { preferredTags, occasionTags, budget }
}

const scoreProduct = (
  product: ProductRow,
  preferredTags: Set<string>,
  occasionTags: Set<string>,
  budget: BudgetRange | null,
) => {
  let score = 0
  const tags = (product.tags ?? []).map(normalize)
  for (const tag of preferredTags) {
    if (tags.includes(tag)) {
      score += 2
    }
  }

  const occasions = Array.isArray(product.attributes?.occasion)
    ? product.attributes?.occasion ?? []
    : product.attributes?.occasion
      ? [product.attributes.occasion]
      : []

  const normalizedOccasions = occasions.map((item) => normalize(item))
  for (const occ of occasionTags) {
    if (normalizedOccasions.includes(occ)) {
      score += 2
    }
  }

  if (budget) {
    if (budget.max !== null && product.price_cents > budget.max) {
      score -= 2
    } else if (product.price_cents >= budget.min) {
      score += 2
    } else {
      score -= 1
    }
  }

  return score
}
