import { useParams } from 'react-router-dom'
import Card from '../components/Card'

export default function ItemDetail() {
  const { id } = useParams()

  return (
    <section className="page item-detail">
      <Card>
        <h1>Item Detail</h1>
        <p>Item id: {id}</p>
      </Card>
    </section>
  )
}
