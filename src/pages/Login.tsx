import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import Button from '../components/Button'
import Card from '../components/Card'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const loginMessage =
    typeof location.state === 'object' &&
    location.state &&
    'message' in location.state
      ? String((location.state as { message?: string }).message ?? '')
      : ''
  const {
    currentUser,
    loading: authLoading,
    signInWithGoogle,
    signInWithEmailPassword,
    signUpWithEmailPassword,
  } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return
    if (currentUser) {
      const nextPath =
        typeof location.state === 'object' &&
        location.state &&
        'from' in location.state &&
        location.state.from &&
        typeof location.state.from === 'object' &&
        'pathname' in location.state.from
          ? String(location.state.from.pathname)
          : '/quiz'

      navigate(nextPath, { replace: true })
    }
  }, [authLoading, currentUser, location.state, navigate])

  const getErrorMessage = (err: unknown) => {
    if (err && typeof err === 'object' && 'message' in err) {
      return String((err as { message?: string }).message)
    }

    if (err instanceof Error) {
      return err.message
    }

    return 'Login failed'
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError(null)

    try {
      await signInWithGoogle()
    } catch (err) {
      setError(getErrorMessage(err))
      setLoading(false)
    }
  }

  const handleEmailLogin = async () => {
    setLoading(true)
    setError(null)

    try {
      await signInWithEmailPassword(email, password)
    } catch (err) {
      setError(getErrorMessage(err))
      setLoading(false)
    }
  }

  const handleEmailSignup = async () => {
    setLoading(true)
    setError(null)

    try {
      await signUpWithEmailPassword(email, password)
      setLoading(false)
      setError('Check your email to confirm your account before signing in.')
    } catch (err) {
      setError(getErrorMessage(err))
      setLoading(false)
    }
  }

  return (
    <section className="page login">
      <Card>
        <h1>Welcome back</h1>
        <p>Sign in or create an account to continue.</p>
        <div className="login-form">
          <label>
            Email
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Your password"
            />
          </label>
        </div>
        <div className="login-actions">
          <Button onClick={handleEmailLogin} disabled={loading || authLoading}>
            {loading ? 'Signing in...' : 'Sign in with Email'}
          </Button>
          <Button
            variant="ghost"
            onClick={handleEmailSignup}
            disabled={loading || authLoading}
          >
            {loading ? 'Signing up...' : 'Create account'}
          </Button>
          <Button onClick={handleGoogleLogin} disabled={loading || authLoading}>
            {loading ? 'Redirecting...' : 'Start with Google'}
          </Button>
        </div>
        {loginMessage ? <p className="error">{loginMessage}</p> : null}
        {error ? <p className="error">{error}</p> : null}
      </Card>
    </section>
  )
}
