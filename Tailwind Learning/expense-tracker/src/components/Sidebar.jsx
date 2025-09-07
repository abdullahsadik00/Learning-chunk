import React from 'react'

const Sidebar = () => {
  return (
    <div className='w-64 bg-white shadow-md'>
        <h1 className="text-2xl font-bold mb-6">MyDashboard</h1>
      <nav className="flex flex-col gap-4">
        <a href="#" className="hover:bg-gray-700 p-2 rounded">Dashboard</a>
        <a href="#" className="hover:bg-gray-700 p-2 rounded">Users</a>
        <a href="#" className="hover:bg-gray-700 p-2 rounded">Settings</a>
      </nav>
    </div>
  )
}

export default Sidebar