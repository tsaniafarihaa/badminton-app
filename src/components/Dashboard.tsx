import React from 'react';
import { Users, UserCheck, Trophy, Calendar, CheckCircle, Clock, TrendingUp, Moon, Sun, Sunrise } from 'lucide-react';
import { useTournament } from '../context/TournamentContext';
import { getNightShiftGroup, getWeekRotation, ShiftGroup } from '../types';

export function Dashboard() {
  const { data } = useTournament();

  const gandaPutraPlayers = data.players.filter(p => p.category === 'Ganda Putra');
  const singlePutriPlayers = data.players.filter(p => p.category === 'Single Putri');

  const completedMatches = data.matches.filter(m => m.status === 'completed').length;
  const totalMatches = data.matches.length;
  const progress = totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Users className="w-6 h-6" />}
          label="Ganda Putra"
          value={gandaPutraPlayers.length}
          subValue={`${data.doublesPairs.length} Pasangan`}
          color="emerald"
        />
        <StatCard
          icon={<Users className="w-6 h-6" />}
          label="Single Putri"
          value={singlePutriPlayers.length}
          subValue="Peserta"
          color="gold"
        />
        <StatCard
          icon={<Trophy className="w-6 h-6" />}
          label="Total Pertandingan"
          value={totalMatches}
          subValue={`${completedMatches} Selesai`}
          color="blue"
        />
        <StatCard
          icon={<Clock className="w-6 h-6" />}
          label="Sisa Pertandingan"
          value={totalMatches - completedMatches}
          subValue="Belum Selesai"
          color="rose"
        />
      </div>

      {/* Progress Bar */}
      <div className="bg-navy-800/50 rounded-xl border border-navy-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-emerald-400" />
            <h3 className="text-lg font-semibold text-white">Tournament Progress</h3>
          </div>
          <span className="text-2xl font-bold text-emerald-400">{progress}%</span>
        </div>
        <div className="w-full bg-navy-900 rounded-full h-4 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-gray-400 mt-2">
          {completedMatches} dari {totalMatches} pertandingan telah selesai
        </p>
      </div>

      {/* Current Week Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-navy-800/50 rounded-xl border border-navy-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Rotasi Shift - Week {data.currentWeek}</h3>
          <div className="space-y-3">
            {(['Malam', 'Siang', 'Pagi'] as const).map(shift => {
              const rotation = getWeekRotation(data.currentWeek);
              const group = rotation[shift];
              const isNight = shift === 'Malam';

              const colors: Record<string, string> = {
                'Grup A': 'bg-amber-500/20 text-amber-400 border-amber-500/40',
                'Grup B': 'bg-rose-500/20 text-rose-400 border-rose-500/40',
                'Grup C': 'bg-blue-500/20 text-blue-400 border-blue-500/40',
                'Non Shift': 'bg-gray-500/20 text-gray-400 border-gray-500/40',
              };

              const icons = {
                'Malam': <Moon className="w-4 h-4 text-indigo-400" />,
                'Siang': <Sun className="w-4 h-4 text-yellow-400" />,
                'Pagi': <Sunrise className="w-4 h-4 text-orange-400" />,
              };

              return (
                <div
                  key={shift}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    isNight
                      ? 'bg-rose-500/10 border-rose-500/30'
                      : 'bg-navy-900/50 border-navy-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {icons[shift]}
                    <span className="text-gray-400">Shift {shift}</span>
                    {isNight && (
                      <span className="text-xs text-rose-400">(Prioritas)</span>
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${colors[group]}`}>
                    {group}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-navy-800/50 rounded-xl border border-navy-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Tournament Status</h3>
          <div className="space-y-3">
            <StatusItem
              label="Registrasi Peserta"
              done={gandaPutraPlayers.length >= 52 || singlePutriPlayers.length >= 8}
            />
            <StatusItem
              label="Pengundian"
              done={data.drawCompleted}
            />
            <StatusItem
              label="Penjadwalan"
              done={data.scheduleGenerated}
            />
            <StatusItem
              label="Turnamen Selesai"
              done={progress === 100}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  subValue: string;
  color: 'emerald' | 'gold' | 'blue' | 'rose';
}

function StatCard({ icon, label, value, subValue, color }: StatCardProps) {
  const colors = {
    emerald: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-400',
    gold: 'from-gold-500/20 to-gold-600/10 border-gold-500/30 text-gold-400',
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400',
    rose: 'from-rose-500/20 to-rose-600/10 border-rose-500/30 text-rose-400',
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-xl p-5`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`text-${color}-400`}>{icon}</div>
        <span className="text-sm text-gray-400">{label}</span>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{subValue}</p>
    </div>
  );
}

function StatusItem({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center justify-between p-3 bg-navy-900/50 rounded-lg">
      <span className="text-sm text-gray-300">{label}</span>
      {done ? (
        <CheckCircle className="w-5 h-5 text-emerald-400" />
      ) : (
        <div className="w-5 h-5 rounded-full border-2 border-gray-600" />
      )}
    </div>
  );
}
