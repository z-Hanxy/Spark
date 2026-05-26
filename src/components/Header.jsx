import { NavLink, useLocation } from 'react-router-dom'

export default function Header() {
  const location = useLocation()
  const isActive = (path) => location.pathname === path

  return (
    <header className="flex h-14 shrink-0 items-center border-b border-gray-200 bg-white px-6">
      <NavLink to="/" className="mr-8 text-xl font-bold text-gray-900 no-underline">
        闪亮
      </NavLink>
      <nav className="flex gap-1">
        <NavLink
          to="/"
          className={`cursor-pointer rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
            isActive('/')
              ? 'bg-indigo-100 text-indigo-700'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          Dashboard
        </NavLink>
        <NavLink
          to="/learning"
          className={`cursor-pointer rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
            isActive('/learning')
              ? 'bg-indigo-100 text-indigo-700'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          Learning
        </NavLink>
      </nav>
    </header>
  )
}
