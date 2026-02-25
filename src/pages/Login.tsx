import { useState } from 'react'
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { useLocation, useNavigate } from 'react-router-dom'
import { auth } from '../lib/firebase'
import Button from '../components/Button'
import Card from '../components/Card'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const redirectPath =
    (location.state as { from?: { pathname?: string } } | null)?.from
      ?.pathname || '/quiz'

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError(null)

    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
      navigate(redirectPath, { replace: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="page login">
      <Card>
        <h1>Welcome back</h1>
        <p>Sign in with Google to continue.</p>
        <Button onClick={handleGoogleLogin} disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in with Google'}
        </Button>
        {error ? <p className="error">{error}</p> : null}
      </Card>
    </section>
  )
}
