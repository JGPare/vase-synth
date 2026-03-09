import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

export default function Register() {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [passConfirm, setPassConfirm] = useState('')
  const [notARobot, setNotARobot] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const register = useAuthStore((s) => s.register)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password !== passConfirm) {
      setError('Passwords must match')
      return
    }
    const result = await register(email, username, password, passConfirm, notARobot)
    if (result.message) {
      setSuccess(true)
      setTimeout(() => navigate('/login'), 1500)
    } else {
      setError(result.detail || 'Registration failed')
    }
  }

  return (
    <div className="flex items-center justify-center h-full">
      <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-lg w-80 space-y-4">
        <h2 className="text-xl font-bold text-center">Register</h2>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        {success && <p className="text-green-400 text-sm">Registration successful! Redirecting...</p>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full bg-gray-700 rounded px-3 py-2 text-sm"
        />
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
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
        <input
          type="password"
          placeholder="Confirm Password"
          value={passConfirm}
          onChange={(e) => setPassConfirm(e.target.value)}
          required
          className="w-full bg-gray-700 rounded px-3 py-2 text-sm"
        />
        {/* Honeypot — hidden from real users */}
        <div style={{ display: 'none' }}>
          <label>
            <input
              type="checkbox"
              checked={notARobot}
              onChange={(e) => setNotARobot(e.target.checked)}
            />
            Not a robot
          </label>
        </div>
        <button type="submit" className="w-full bg-purple-700 hover:bg-purple-600 rounded py-2 text-sm font-semibold">
          Register
        </button>
        <div className="text-center text-sm text-gray-400">
          <Link to="/login" className="hover:text-white">Already have an account?</Link>
        </div>
      </form>
    </div>
  )
}
