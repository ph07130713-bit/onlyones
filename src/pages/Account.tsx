import Card from '../components/Card'
import { useAuth } from '../lib/auth'

export default function Account() {
  const { user } = useAuth()

  return (
    <section className="page account">
      <Card>
        <h1>Account</h1>
        <p>Signed in as {user?.displayName ?? user?.email}</p>
      </Card>
    </section>
  )
}
