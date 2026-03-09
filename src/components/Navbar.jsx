import { Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore()

  return (
    <nav className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700 flex-shrink-0">
      <Link to="/" className="text-xl font-bold text-purple-400 no-underline">
        Vase Synth
      </Link>
      <div className="flex items-center gap-4 text-sm">
        {isAuthenticated ? (
          <>
            <span className="text-gray-400">{user?.username}</span>
            <button
              onClick={logout}
              className="text-gray-300 hover:text-white cursor-pointer bg-transparent border-none"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-gray-300 hover:text-white no-underline">
              Login
            </Link>
            <Link to="/register" className="text-gray-300 hover:text-white no-underline">
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}
