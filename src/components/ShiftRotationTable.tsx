import React from 'react';
import { Calendar, Moon, Sun, Sunrise, ArrowRight } from 'lucide-react';
import { WEEK_ROTATIONS, getWeekRotation, getWeekStartDate, TOURNAMENT_INFO, ShiftGroup } from '../types';

interface ShiftRotationTableProps {
  currentWeek?: number;
  highlightWeek?: number;
  onWeekClick?: (week: number) => void;
  weeksToShow?: number;
}

export function ShiftRotationTable({ currentWeek, highlightWeek, onWeekClick, weeksToShow = 6 }: ShiftRotationTableProps) {
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const day = date.getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const month = months[date.getMonth()];
    return `${day} ${month}`;
  };

  const formatFullDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const day = date.getDate();
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const getShiftIcon = (shift: string) => {
    switch (shift) {
      case 'Malam': return <Moon className="w-4 h-4" />;
      case 'Siang': return <Sun className="w-4 h-4" />;
      case 'Pagi': return <Sunrise className="w-4 h-4" />;
      default: return null;
    }
  };

  const getGroupColor = (group: ShiftGroup): string => {
    switch (group) {
      case 'Grup A': return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'Grup B': return 'bg-rose-500/20 text-rose-400 border-rose-500/40';
      case 'Grup C': return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
      case 'Non Shift': return 'bg-gray-500/20 text-gray-400 border-gray-500/40';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/40';
    }
  };

  const weeks = Array.from({ length: weeksToShow }, (_, i) => i + 1);

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mb-4 p-3 bg-navy-900/50 rounded-lg">
        <span className="text-xs text-gray-500 font-medium">Rotasi Siklus (3 Minggu):</span>
        <div className="flex items-center gap-2">
          {[1, 2, 3].map(cycle => (
            <React.Fragment key={cycle}>
              <span className="text-xs text-gray-400">Week {cycle}</span>
              <ArrowRight className="w-3 h-3 text-gray-600" />
            </React.Fragment>
          ))}
          <span className="text-xs text-emerald-400">→ Ulang</span>
        </div>
      </div>

      {/* Rotation Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-navy-700">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Week
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Tanggal</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase">
                <div className="flex items-center justify-center gap-1">
                  <Moon className="w-3 h-3 text-indigo-400" />
                  <span>Shift Malam</span>
                </div>
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase">
                <div className="flex items-center justify-center gap-1">
                  <Sun className="w-3 h-3 text-yellow-400" />
                  <span>Shift Siang</span>
                </div>
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase">
                <div className="flex items-center justify-center gap-1">
                  <Sunrise className="w-3 h-3 text-orange-400" />
                  <span>Shift Pagi</span>
                </div>
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase">Prioritas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-700">
            {weeks.map(week => {
              const rotation = getWeekRotation(week);
              const startDate = getWeekStartDate(week);
              const isHighlighted = highlightWeek === week;
              const isCurrentWeek = currentWeek === week;

              return (
                <tr
                  key={week}
                  onClick={() => onWeekClick?.(week)}
                  className={`transition-colors ${
                    onWeekClick ? 'cursor-pointer hover:bg-navy-700/50' : ''
                  } ${isHighlighted || isCurrentWeek ? 'bg-emerald-500/10' : ''}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${
                        isHighlighted || isCurrentWeek ? 'text-emerald-400' : 'text-white'
                      }`}>
                        {week}
                      </span>
                      {isCurrentWeek && (
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-xs">
                          Current
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-300">{formatFullDate(startDate)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center">
                      <span className={`px-3 py-1.5 rounded-lg border text-sm font-medium ${getGroupColor(rotation['Malam'])}`}>
                        {rotation['Malam']}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center">
                      <span className={`px-3 py-1.5 rounded-lg border text-sm font-medium ${getGroupColor(rotation['Siang'])}`}>
                        {rotation['Siang']}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center">
                      <span className={`px-3 py-1.5 rounded-lg border text-sm font-medium ${getGroupColor(rotation['Pagi'])}`}>
                        {rotation['Pagi']}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center">
                      <span className="px-3 py-1.5 bg-rose-500/20 border border-rose-500/40 text-rose-400 rounded-lg text-sm font-medium">
                        {rotation['Malam']}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Visual Rotation Guide */}
      <div className="mt-6 p-4 bg-navy-900/50 rounded-lg border border-navy-700">
        <h4 className="text-sm font-semibold text-white mb-3">Visual Rotasi Shift</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {WEEK_ROTATIONS.map((rotation, index) => (
            <div key={index} className="p-3 bg-navy-800/50 rounded-lg border border-navy-600">
              <p className="text-xs text-gray-400 mb-2">Week {index + 1}, 4, 7, ...</p>
              <div className="space-y-2">
                {(['Malam', 'Siang', 'Pagi'] as const).map(shift => (
                  <div key={shift} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getShiftIcon(shift)}
                      <span className="text-xs text-gray-400">{shift}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getGroupColor(rotation[shift])}`}>
                      {rotation[shift]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-3">
          * Rotasi berulang setiap 3 minggu. Week 4 = Week 1, Week 5 = Week 2, dst.
        </p>
      </div>
    </div>
  );
}

export function CompactShiftRotation({ week }: { week: number }) {
  const rotation = getWeekRotation(week);

  const getGroupColor = (group: ShiftGroup): string => {
    switch (group) {
      case 'Grup A': return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'Grup B': return 'bg-rose-500/20 text-rose-400 border-rose-500/40';
      case 'Grup C': return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
      case 'Non Shift': return 'bg-gray-500/20 text-gray-400 border-gray-500/40';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/40';
    }
  };

  return (
    <div className="grid grid-cols-3 gap-2">
      {(['Malam', 'Siang', 'Pagi'] as const).map(shift => {
        const group = rotation[shift];
        return (
          <div
            key={shift}
            className={`p-3 rounded-lg border text-center ${
              shift === 'Malam'
                ? 'bg-rose-500/10 border-rose-500/30'
                : 'bg-navy-900/50 border-navy-700'
            }`}
          >
            <div className="flex items-center justify-center gap-1 mb-1">
              {shift === 'Malam' && <Moon className="w-3 h-3 text-indigo-400" />}
              {shift === 'Siang' && <Sun className="w-3 h-3 text-yellow-400" />}
              {shift === 'Pagi' && <Sunrise className="w-3 h-3 text-orange-400" />}
              <span className="text-xs text-gray-400">{shift}</span>
            </div>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getGroupColor(group)}`}>
              {group}
            </span>
          </div>
        );
      })}
    </div>
  );
}
