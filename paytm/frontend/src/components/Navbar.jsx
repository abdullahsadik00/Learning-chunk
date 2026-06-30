import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center">
      <Link to="/dashboard" className="text-xl font-bold text-blue-600">Paytm</Link>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">Hi, {user?.firstName}</span>
        <Link to="/history" className="text-sm text-gray-600 hover:text-blue-600">History</Link>
        <button onClick={handleLogout} className="text-sm text-red-500 hover:text-red-700">Logout</button>
      </div>
    </nav>
  )
}
