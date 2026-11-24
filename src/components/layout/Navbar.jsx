import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Search, ShieldCheck, UserCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Navbar({ onOpenMobileSidebar }) {
  const { profile, user } = useAuth();
  const [globalQuery, setGlobalQuery] = useState('');
  const navigate = useNavigate();

  const handleGlobalSearch = (e) => {
    e.preventDefault();
    if (!globalQuery.trim()) return;
    navigate(`/students?q=${encodeURIComponent(globalQuery.trim())}`);
    setGlobalQuery('');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-2xs sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          aria-label="Open Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Quick Global Search Bar */}
        <form onSubmit={handleGlobalSearch} className="hidden sm:block">
          <div className="relative w-72 md:w-96">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={globalQuery}
              onChange={(e) => setGlobalQuery(e.target.value)}
              placeholder="Quick search student, form no., mobile..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-sm text-slate-800 placeholder-slate-400 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none"
            />
          </div>
        </form>
      </div>

      {/* User Info Pill */}
      <div className="flex items-center gap-3">
        <span className="hidden items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold capitalize text-blue-700 md:inline-flex">
          <ShieldCheck className="h-3.5 w-3.5" />
          {profile?.role || 'Admin'}
        </span>

        <div className="flex items-center gap-2.5 border-l border-slate-200 pl-3">
          <UserCircle className="h-8 w-8 text-blue-600" />
          <div className="hidden text-left sm:block">
            <p className="text-xs font-semibold text-slate-900">
              {profile?.full_name || user?.email?.split('@')[0]}
            </p>
            <p className="text-[11px] text-slate-500">{user?.email}</p>
          </div>
        </div>
      </div>
    </header>
  );
}