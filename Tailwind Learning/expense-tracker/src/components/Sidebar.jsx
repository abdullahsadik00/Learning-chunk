import React, { useState } from 'react';
import {
  LayoutDashboard,
  CreditCard,
  Wallet,
  Calendar,
  ChevronLeft,
  Menu,
} from "lucide-react";
import { NavLink } from 'react-router-dom';

const menu = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { id: "transactions", label: "Transactions", icon: CreditCard, path: "/transactions" },
  { id: "accounts", label: "Accounts", icon: Wallet, path: "/accounts" },
  { id: "budgets", label: "Budgets", icon: Calendar, path: "/budgets" },
];

const Sidebar = ({ activeTab, setActiveTab }) => {
  const [collapsed, setCollapsed] = useState(false);
  
  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };
  
  return (
    <aside
      className={`bg-white h-screen shadow-sm transition-all duration-300 md:flex flex-col hidden ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      <div className="flex items-center justify-between p-4">
        {!collapsed && (
          <h1 className="text-xl font-bold text-blue-600 whitespace-nowrap">
            FinTrack
          </h1>
        )}
        <button
          onClick={toggleCollapse}
          className="text-gray-500 hover:text-blue-600"
        >
          {collapsed ? (
            <Menu className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menu.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.id}
              to={item.path}
              onClick={() => setActiveTab(item.id)}
              className={({ isActive }) =>
                `w-full flex items-center gap-3 p-3 rounded-md text-sm font-medium ${
                  isActive
                    ? "bg-blue-100 text-blue-600"
                    : "text-gray-700 hover:bg-gray-100"
                }`
              }
            >
              <Icon className="w-5 h-5" />
              {!collapsed && item.label}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;