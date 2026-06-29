import React from 'react';
import {
  LayoutDashboard,
  Users,
  GitCompare,
  Calendar,
  Trophy,
  Shuffle,
  CalendarClock,
  Share2,
  RotateCcw,
} from 'lucide-react';

type View =
  | 'dashboard'
  | 'players'
  | 'draw'
  | 'schedule'
  | 'bracket'
  | 'matches';

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  drawCompleted: boolean;
}

export function Sidebar({ currentView, setCurrentView, drawCompleted }: SidebarProps) {
  const menuItems: { id: View; icon: React.ReactNode; label: string; disabled?: boolean }[] = [
    { id: 'dashboard', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard' },
    { id: 'players', icon: <Users className="w-5 h-5" />, label: 'Peserta' },
    { id: 'draw', icon: <Shuffle className="w-5 h-5" />, label: 'Pengundian' },
    { id: 'bracket', icon: <Trophy className="w-5 h-5" />, label: 'Bracket' },
    { id: 'schedule', icon: <Calendar className="w-5 h-5" />, label: 'Jadwal' },
    { id: 'matches', icon: <GitCompare className="w-5 h-5" />, label: 'Pertandingan' },
  ];

  return (
    <aside className="w-64 bg-navy-900 border-r border-navy-700 min-h-screen flex flex-col">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white text-lg">
            🏸
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">Jabil Fest</h1>
            <p className="text-xs text-gold-400 font-medium">5.0</p>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3 leading-relaxed">
          Badminton Tournament Manager
        </p>
      </div>

      <nav className="flex-1 px-3">
        <div className="space-y-1">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              disabled={item.disabled}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                currentView === item.id
                  ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-gray-400 hover:bg-navy-800 hover:text-white'
              } ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      <div className="p-4 border-t border-navy-700">
        <p className="text-xs text-gray-500 text-center">
          One Team, One Spirit, One Jabil!
        </p>
      </div>
    </aside>
  );
}
