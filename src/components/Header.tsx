import { Link, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { useAuth } from '../lib/auth'
import Button from './Button'

export default function Header() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut(auth)
    navigate('/login')
  }

  return (
    <header className="app-header">
      <div className="brand">
        <Link to="/">onlyones</Link>
      </div>
      <nav className="app-nav">
        <Link to="/quiz">Quiz</Link>
        <Link to="/results">Results</Link>
        <Link to="/account">Account</Link>
      </nav>
      <div className="app-actions">
        {user ? (
          <Button variant="ghost" onClick={handleSignOut}>
            Sign out
          </Button>
        ) : (
          <Link to="/login">Login</Link>
        )}
      </div>
    </header>
  )
}
