import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Card from '../components/Card'
import Button from '../components/Button'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'

type RecommendationItem = {
  id: string
  title: string
  brand: string | null
  price_krw: number | null
  image_url: string | null
  tags: string[] | null
  match_score: number
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export default function Results() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const [searchParams] = useSearchParams()
  const sid = useMemo(() => searchParams.get('sid')?.trim() ?? '', [searchParams])
  const [loading, setLoading] = useState(true)
  const [recovering, setRecovering] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<RecommendationItem[]>([])

  const loadRecommendations = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: rpcError, status } = await supabase.rpc(
        'get_recommendations',
        {
          p_submission_id: sid,
          p_limit: 12,
        },
      )

      if (rpcError) {
        console.error('get_recommendations raw error', rpcError)
        console.error('get_recommendations failed', {
          status,
          message: rpcError.message,
          hint: rpcError.hint,
          details: rpcError.details,
          code: rpcError.code,
        })
        throw rpcError
      }

      const nextItems = (data ?? []) as RecommendationItem[]

      if (nextItems.length === 0) {
        console.error('products empty or no active rows', {
          status,
          message: 'RPC returned 0 recommendations',
          hint: 'Seed products table and ensure active=true rows exist.',
        })
        setError('No products available yet. Please seed products and retry.')
        setItems([])
        return
      }

      if (nextItems.length < 8) {
        console.error('not enough recommendations', {
          status,
          message: `Expected >= 8 items, got ${nextItems.length}`,
          hint: 'Check products active rows and function logic.',
        })
      }

      setItems(nextItems)
    } catch (err) {
      const casted = err as {
        message?: string
        hint?: string
        code?: string
      }
      console.error('recommendations request failed', {
        status: 'rpc_error',
        message: casted?.message,
        hint: casted?.hint,
        code: casted?.code,
      })
      setError('Failed to generate recommendations. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [sid])

  useEffect(() => {
    let active = true

    const recoverSid = async () => {
      if (!sid || !UUID_REGEX.test(sid)) {
        console.error('sid recovery started', {
          status: 'sid_missing_or_invalid',
          message: sid ? `Invalid sid format: ${sid}` : 'Missing sid query parameter',
        })

        if (!currentUser) {
          if (!active) return
          setError('No quiz submission found. Please take the quiz.')
          setRecovering(false)
          setLoading(false)
          return
        }

        const { data, error: latestError } = await supabase
          .from('quiz_submissions')
          .select('id')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (!active) return

        if (latestError) {
          console.error('sid recovery failed', latestError)
          setError('Failed to generate recommendations. Please try again.')
          setRecovering(false)
          setLoading(false)
          return
        }

        if (!data?.id) {
          console.error('sid recovery no submission', {
            status: 'not_found',
            message: 'No quiz_submissions rows for current user',
          })
          setError('No quiz submission found. Please take the quiz.')
          setRecovering(false)
          setLoading(false)
          return
        }

        const target = `/results?sid=${data.id}`
        navigate(target, { replace: true })
        setTimeout(() => {
          if (!window.location.search.includes(`sid=${data.id}`)) {
            window.location.assign(target)
          }
        }, 0)
        return
      }

      if (!active) return
      setRecovering(false)
    }

    void recoverSid()

    return () => {
      active = false
    }
  }, [currentUser, navigate, sid])

  useEffect(() => {
    if (recovering) return
    void loadRecommendations()
  }, [loadRecommendations, recovering])

  return (
    <section className="page results">
      <Card>
        <h1>Results</h1>
        {recovering ? <p>Restoring your latest quiz submission...</p> : null}
        {!recovering && loading ? <p>Generating your recommendations...</p> : null}
        {error ? (
          <div className="results-error-box">
            <p className="error">{error}</p>
            <Button onClick={loadRecommendations}>Retry</Button>
          </div>
        ) : null}
        {!loading && !error ? (
          <div className="results-grid">
            {items.map((item) => (
              <article key={item.id} className="result-card">
                <div className="result-media">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.title} />
                  ) : (
                    <div className="media-placeholder">No image</div>
                  )}
                </div>
                <div className="result-body">
                  <div className="result-brand">{item.brand ?? 'OnlyOnes'}</div>
                  <h3>{item.title}</h3>
                  <p className="result-price">
                    {typeof item.price_krw === 'number'
                      ? `₩${item.price_krw.toLocaleString()}`
                      : 'Price TBD'}
                  </p>
                  <p className="result-reason">Match score: {item.match_score}</p>
                  <div className="result-tags">
                    {(item.tags ?? []).slice(0, 5).map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </Card>
    </section>
  )
}
