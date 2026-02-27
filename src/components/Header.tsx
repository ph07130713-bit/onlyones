import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import Button from './Button'

const getCurrentLanguage = (pathname: string) => {
  if (pathname === '/ko' || pathname.startsWith('/ko/')) return 'ko'
  if (pathname === '/en' || pathname.startsWith('/en/')) return 'en'
  const saved = window.localStorage.getItem('app_locale')
  if (saved === 'ko' || saved === 'en') return saved
  return 'en'
}

export default function Header() {
  const { currentUser, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const language = getCurrentLanguage(location.pathname)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const handleLanguageChange = (nextLanguage: string) => {
    window.localStorage.setItem('app_locale', nextLanguage)
    navigate(nextLanguage === 'ko' ? '/ko' : '/en')
  }

  return (
    <header className="app-header">
      <div className="brand">
        <Link to={language === 'ko' ? '/ko' : '/en'}>onlyones</Link>
      </div>
      <nav className="app-nav">
        <Link to="/quiz">Quiz</Link>
        <Link to="/results">Results</Link>
        <Link to="/account">Account</Link>
      </nav>
      <div className="app-actions">
        <select
          aria-label="Language"
          value={language}
          onChange={(event) => handleLanguageChange(event.target.value)}
          className="lang-select"
        >
          <option value="ko">한국어</option>
          <option value="en">English</option>
        </select>
        {currentUser ? (
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
