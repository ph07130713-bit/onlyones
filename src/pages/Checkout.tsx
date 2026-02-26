import { useLocation } from 'react-router-dom'
import Card from '../components/Card'

export default function Checkout() {
  const location = useLocation()
  const orderId =
    typeof location.state === 'object' &&
    location.state &&
    'orderId' in location.state
      ? String((location.state as { orderId?: string }).orderId ?? '')
      : ''

  return (
    <section className="page checkout">
      <Card>
        <h1>Checkout</h1>
        <p>Your Fix Box is being prepared.</p>
        {orderId ? <p className="muted">Order: {orderId}</p> : null}
      </Card>
    </section>
  )
}
