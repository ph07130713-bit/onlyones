import { Route, Routes } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Quiz from './pages/Quiz'
import Results from './pages/Results'
import ItemDetail from './pages/ItemDetail'
import Account from './pages/Account'
import AuthCallback from './pages/AuthCallback'
import Checkout from './pages/Checkout'
import ProtectedRoute from './routes/ProtectedRoute'

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Landing />} />
        <Route path="login" element={<Login />} />
        <Route path="auth/callback" element={<AuthCallback />} />
        <Route element={<ProtectedRoute />}>
          <Route path="quiz" element={<Quiz />} />
          <Route path="results" element={<Results />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="item/:id" element={<ItemDetail />} />
          <Route path="account" element={<Account />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
