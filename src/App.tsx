import { Route, Routes } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Quiz from './pages/Quiz'
import Results from './pages/Results'
import ItemDetail from './pages/ItemDetail'
import Account from './pages/Account'
import ProtectedRoute from './routes/ProtectedRoute'

function AppLayout() {
  return (
    <div className="app-shell">
      <Header />
      <main className="app-main">
        <Routes>
          <Route index element={<Landing />} />
          <Route path="login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route path="quiz" element={<Quiz />} />
            <Route path="results" element={<Results />} />
            <Route path="item/:id" element={<ItemDetail />} />
            <Route path="account" element={<Account />} />
          </Route>
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default AppLayout
