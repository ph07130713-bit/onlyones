import Card from '../components/Card'
import { useAuth } from '../lib/auth'

export default function Account() {
  const { currentUser } = useAuth()
  const displayName =
    currentUser?.user_metadata?.full_name ??
    currentUser?.user_metadata?.name ??
    currentUser?.email

  return (
    <section className="page account">
      <Card>
        <h1>Account</h1>
        <p>Signed in as {displayName ?? 'Unknown user'}</p>
      </Card>
    </section>
  )
}
