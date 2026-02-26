import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Card from '../components/Card'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [message, setMessage] = useState('Completing sign-in...')

  useEffect(() => {
    let active = true

    const finalizeSignIn = async () => {
      const { data, error } = await supabase.auth.getSession()
      if (error) {
        throw error
      }

      const session = data.session
      const user = session?.user

      if (!user) {
        const info = 'No session found. Please sign in again.'
        setMessage(info)
        navigate('/login', { replace: true, state: { message: info } })
        return
      }

      const { error: upsertError } = await supabase
        .from('users')
        .upsert(
          {
            id: user.id,
            email: user.email ?? '',
          },
          {
            onConflict: 'id',
            ignoreDuplicates: true,
          },
        )

      if (upsertError) {
        throw upsertError
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('quiz_completed')
        .eq('id', user.id)
        .single()

      if (userError) {
        throw userError
      }

      const nextPath = userData?.quiz_completed ? '/results' : '/quiz'
      navigate(nextPath, { replace: true })
    }

    finalizeSignIn().catch((err) => {
      if (!active) return
      console.error(err)
      const info = 'Sign-in failed. Please try again.'
      setMessage(info)
      navigate('/login', { replace: true, state: { message: info } })
    })

    return () => {
      active = false
    }
  }, [navigate])

  return (
    <section className="page auth-callback">
      <Card>
        <h1>Signing you in</h1>
        <p>{message}</p>
      </Card>
    </section>
  )
}
