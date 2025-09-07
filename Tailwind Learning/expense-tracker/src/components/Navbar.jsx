import React from 'react'

const Navbar = () => {
  return (
    <header className="bg-white shadow-md h-16 flex items-center justify-between px-6">
      <h2 className="text-xl font-semibold">Dashboard</h2>
      <div>
        <span className="text-gray-700">Hello, User</span>
      </div>
    </header>
  )
}

export default Navbar