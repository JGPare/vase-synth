import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import ResetPassword from './pages/ResetPassword'
import ResetVerified from './pages/ResetVerified'
import Navbar from './components/Navbar'
import { useAuthStore } from './stores/authStore'

export default function App() {
  const checkAuth = useAuthStore((s) => s.checkAuth)

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return (
    <BrowserRouter>
      <div className="flex flex-col h-screen w-screen bg-gray-900 text-white">
        <Navbar />
        <div className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/reset-verified/:token" element={<ResetVerified />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  )
}
