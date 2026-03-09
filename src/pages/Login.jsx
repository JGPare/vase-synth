import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const result = await login(email, password)
    if (result.success) {
      navigate('/')
    } else {
      setError(result.detail || 'Login failed')
    }
  }

  return (
    <div className="flex items-center justify-center h-full">
      <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-lg w-80 space-y-4">
        <h2 className="text-xl font-bold text-center">Login</h2>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full bg-gray-700 rounded px-3 py-2 text-sm"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full bg-gray-700 rounded px-3 py-2 text-sm"
        />
        <button type="submit" className="w-full bg-purple-700 hover:bg-purple-600 rounded py-2 text-sm font-semibold">
          Log In
        </button>
        <div className="text-center text-sm text-gray-400 space-y-1">
          <Link to="/reset-password" className="hover:text-white block">Forgot password?</Link>
          <Link to="/register" className="hover:text-white block">Register</Link>
        </div>
      </form>
    </div>
  )
}
