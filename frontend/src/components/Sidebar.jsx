import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Video, 
  MessageSquare, 
  FileText, 
  BookOpen, 
  HelpCircle, 
  Settings, 
  LogOut,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Process Video', path: '/process', icon: Video },
    { name: 'AI Tutor Chat', path: '/chat', icon: MessageSquare },
    { name: 'Summaries', path: '/summaries', icon: FileText },
    { name: 'Study Notes', path: '/notes', icon: BookOpen },
    { name: 'Quiz Practice', path: '/quizzes', icon: HelpCircle },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#10141d] border-r border-[#242c3d] flex flex-col h-screen sticky top-0 shrink-0">
      {/* Brand Logo */}
      <div className="h-16 flex items-center px-6 border-b border-[#242c3d] gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-amber-500 flex items-center justify-center shadow-lg shadow-brand-500/20 text-white font-bold">
          <GraduationCap className="w-5 h-5" />
        </div>
        <div>
          <span className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
            LearnTube <span className="text-xs px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-400 font-semibold uppercase">AI</span>
          </span>
          <p className="text-[11px] text-gray-400 -mt-0.5 font-medium">Smart Lecture Assistant</p>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-brand-500 text-white shadow-md shadow-brand-500/25 font-semibold'
                    : 'text-gray-400 hover:text-gray-100 hover:bg-[#181f2c]'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User profile footer */}
      <div className="p-3 border-t border-[#242c3d] bg-[#0c0f17]">
        <div className="flex items-center justify-between p-2 rounded-xl bg-[#151a24] border border-[#232b3b]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-brand-600/30 text-brand-400 font-bold flex items-center justify-center border border-brand-500/40 text-xs shrink-0">
              {user?.full_name ? user.full_name[0].toUpperCase() : 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-200 truncate">{user?.full_name || 'Student'}</p>
              <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Log out"
            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
