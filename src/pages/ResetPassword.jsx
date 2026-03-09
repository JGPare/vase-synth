import { useState } from 'react'
import { Link } from 'react-router-dom'
import { apiJson } from '../api/client'

export default function ResetPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    await apiJson('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
    setSent(true)
  }

  return (
    <div className="flex items-center justify-center h-full">
      <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-lg w-80 space-y-4">
        <h2 className="text-xl font-bold text-center">Reset Password</h2>
        {sent ? (
          <p className="text-green-400 text-sm text-center">
            If that email exists, a reset link has been sent.
          </p>
        ) : (
          <>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-gray-700 rounded px-3 py-2 text-sm"
            />
            <button type="submit" className="w-full bg-purple-700 hover:bg-purple-600 rounded py-2 text-sm font-semibold">
              Reset
            </button>
          </>
        )}
        <div className="text-center text-sm text-gray-400">
          <Link to="/login" className="hover:text-white">Back to login</Link>
        </div>
      </form>
    </div>
  )
}
