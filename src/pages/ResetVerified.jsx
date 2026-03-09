import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { apiJson } from '../api/client'

export default function ResetVerified() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [passConfirm, setPassConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password !== passConfirm) {
      setError('Passwords must match')
      return
    }
    const res = await apiJson(`/api/auth/reset-verified/${token}`, {
      method: 'POST',
      body: JSON.stringify({ password, pass_confirm: passConfirm }),
    })
    if (res.message === 'Password reset successful') {
      setSuccess(true)
      setTimeout(() => navigate('/login'), 1500)
    } else {
      setError(res.detail || 'Reset failed')
    }
  }

  return (
    <div className="flex items-center justify-center h-full">
      <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-lg w-80 space-y-4">
        <h2 className="text-xl font-bold text-center">Set New Password</h2>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        {success && <p className="text-green-400 text-sm">Password reset! Redirecting...</p>}
        <input
          type="password"
          placeholder="New Password"
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
        <button type="submit" className="w-full bg-purple-700 hover:bg-purple-600 rounded py-2 text-sm font-semibold">
          Set Password
        </button>
      </form>
    </div>
  )
}
