import { Link } from 'react-router-dom'
import Button from '../components/Button'
import Card from '../components/Card'

export default function Landing() {
  return (
    <section className="page landing">
      <Card>
        <h1>onlyones</h1>
        <p>Discover your personalized picks with a short quiz.</p>
        <div className="actions">
          <Link to="/login">
            <Button>Start with Google</Button>
          </Link>
        </div>
      </Card>
    </section>
  )
}
