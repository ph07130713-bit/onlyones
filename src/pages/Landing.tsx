import { Link, useLocation } from 'react-router-dom'
import Button from '../components/Button'
import Card from '../components/Card'

const content = {
  en: {
    title: 'onlyones',
    description: 'Discover your personalized picks with a short quiz.',
    cta: 'Start with Google',
  },
  ko: {
    title: '온리원즈',
    description: '짧은 스타일 퀴즈로 나만의 추천을 받아보세요.',
    cta: '구글로 시작하기',
  },
} as const

export default function Landing() {
  const location = useLocation()
  const language = location.pathname === '/ko' ? 'ko' : 'en'
  const text = content[language]

  return (
    <section className="page landing">
      <Card>
        <h1>{text.title}</h1>
        <p>{text.description}</p>
        <div className="actions">
          <Link to="/login">
            <Button>{text.cta}</Button>
          </Link>
        </div>
      </Card>
    </section>
  )
}
