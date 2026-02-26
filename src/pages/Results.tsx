import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '../components/Card'
import Button from '../components/Button'
import { useAuth } from '../lib/auth'
import { generateRecommendationsForUser } from '../lib/recommend'
import { supabase } from '../lib/supabase'

type RecommendationRow = {
  id: string
  score: number
  reason: string | null
  product: {
    id: string
    title: string
    brand: string | null
    price_cents: number
    images: string[] | null
    tags: string[] | null
  } | null
}

type RecommendationApiRow = {
  id: string
  score: number
  reason: string | null
  product: {
    id: string
    title: string
    brand: string | null
    price_cents: number
    images: string[] | null
    tags: string[] | null
  }[]
}

export default function Results() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<RecommendationRow[]>([])
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState<Record<string, RecommendationRow>>({})

  useEffect(() => {
    let active = true

    const run = async () => {
      if (!currentUser) {
        setError('Sign in to view your results.')
        setLoading(false)
        return
      }

      await generateRecommendationsForUser(currentUser.id)
      const { data, error: fetchError } = await supabase
        .from('recommendations')
        .select(
          'id, score, reason, product:products(id, title, brand, price_cents, images, tags)',
        )
        .eq('user_id', currentUser.id)
        .order('score', { ascending: false })

      if (fetchError) {
        throw fetchError
      }

      if (!active) return
      const normalized = (data ?? []).map((row) => {
        const record = row as RecommendationApiRow
        return {
          id: record.id,
          score: record.score,
          reason: record.reason,
          product: record.product?.[0] ?? null,
        }
      })

      setItems(normalized)
      setLoading(false)
    }

    run().catch((err) => {
      if (!active) return
      console.error(err)
      setError('Failed to generate recommendations. Please try again.')
      setLoading(false)
    })

    return () => {
      active = false
    }
  }, [currentUser])

  const selectedList = useMemo(() => Object.values(selected), [selected])

  const totalAmount = useMemo(
    () =>
      selectedList.reduce(
        (sum, item) => sum + (item.product?.price_cents ?? 0),
        0,
      ),
    [selectedList],
  )

  const toggleSelect = (item: RecommendationRow) => {
    if (!item.product) return
    setSelected((prev) => {
      const exists = prev[item.product!.id]
      if (exists) {
        const next = { ...prev }
        delete next[item.product!.id]
        return next
      }
      if (Object.keys(prev).length >= 5) {
        return prev
      }
      return { ...prev, [item.product!.id]: item }
    })
  }

  const handleCreateOrder = async () => {
    if (!currentUser || selectedList.length === 0) return
    setSaving(true)
    setError(null)

    try {
      const itemsPayload = selectedList.map((item) => ({
        product_id: item.product?.id,
        title: item.product?.title,
        price_cents: item.product?.price_cents,
      }))

      const { data, error: insertError } = await supabase
        .from('orders')
        .insert({
          user_id: currentUser.id,
          status: 'pending',
          items: itemsPayload,
          amount_cents: totalAmount,
          currency: 'USD',
        })
        .select('id')
        .single()

      if (insertError) {
        throw insertError
      }

      navigate('/checkout', { replace: true, state: { orderId: data?.id } })
    } catch (err) {
      console.error(err)
      setError('Failed to create your Fix Box. Please try again.')
    } finally {
      setSaving(false)
    }
  }

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
              if (!product) return null
              const selectedState = Boolean(selected[product.id])
              return (
                <article
                  key={item.id}
                  className={`result-card ${selectedState ? 'is-selected' : ''}`}
                >
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
                    {item.reason ? (
                      <p className="result-reason">{item.reason}</p>
                    ) : null}
                    <Button
                      variant={selectedState ? 'ghost' : 'primary'}
                      onClick={() => toggleSelect(item)}
                    >
                      {selectedState ? 'Remove' : 'Add to Fix Box'}
                    </Button>
                  </div>
                </article>
              )
            })}
          </div>
        ) : null}
      </Card>
      {!loading && !error ? (
        <Card>
          <h2>My Fix Box</h2>
          <p className="muted">
            Select up to 5 items. {selectedList.length}/5 chosen.
          </p>
          {selectedList.length > 0 ? (
            <ul className="fix-list">
              {selectedList.map((item) => (
                <li key={item.product?.id}>
                  <span>{item.product?.title}</span>
                  <span>
                    ${(item.product?.price_cents ?? 0) / 100}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">Pick items you want to try on.</p>
          )}
          <div className="fix-actions">
            <span className="fix-total">
              Total: ${(totalAmount / 100).toFixed(2)}
            </span>
            <Button
              onClick={handleCreateOrder}
              disabled={saving || selectedList.length === 0}
            >
              {saving ? 'Creating...' : 'Create Fix Box'}
            </Button>
          </div>
        </Card>
      ) : null}
    </section>
  )
}
