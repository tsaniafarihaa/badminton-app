import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Share2, ChevronLeft, ChevronRight, Loader2, Moon, Table } from 'lucide-react';
import { useTournament } from '../context/TournamentContext';
import { Match, DoublesPair, Player, getNightShiftGroup, getWeekRotation, getWeekStartDate, TOURNAMENT_INFO, ShiftGroup } from '../types';
import { ShiftRotationTable, CompactShiftRotation } from '../components/ShiftRotationTable';

export function ScheduleView() {
  const { data, generateSchedule } = useTournament();
  const [selectedWeek, setSelectedWeek] = useState(data.currentWeek || 1);
  const [showFullTable, setShowFullTable] = useState(true);

  const weekMatches = data.matches.filter(m => m.week === selectedWeek);
  const nightShift = getNightShiftGroup(selectedWeek);

  const handleGenerateSchedule = () => {
    generateSchedule();
  };

  const handleShareWhatsApp = () => {
    const text = generateWhatsAppMessage(selectedWeek, weekMatches, nightShift);
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  if (!data.drawCompleted) {
    return (
      <div className="p-6">
        <div className="bg-navy-800/50 rounded-xl border border-navy-700 p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Belum Ada Jadwal</h3>
          <p className="text-gray-400 mb-6">
            Silakan lakukan pengundian terlebih dahulu untuk membuat jadwal.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Shift Rotation Table - Always Visible */}
      <div className="bg-navy-800/50 rounded-xl border border-navy-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Table className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-semibold text-white">Rotasi Shift Otomatis</h3>
          </div>
          <button
            onClick={() => setShowFullTable(!showFullTable)}
            className="px-3 py-1.5 bg-navy-700 hover:bg-navy-600 rounded text-sm text-gray-300 transition-colors"
          >
            {showFullTable ? 'Sembunyikan' : 'Tampilkan'} Tabel
          </button>
        </div>

        {showFullTable && (
          <ShiftRotationTable
            currentWeek={data.currentWeek}
            highlightWeek={selectedWeek}
            onWeekClick={setSelectedWeek}
            weeksToShow={6}
          />
        )}
      </div>

      {/* Header Actions */}
      {!data.scheduleGenerated && (
        <div className="bg-navy-800/50 rounded-xl border border-navy-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Generate Jadwal</h3>
              <p className="text-sm text-gray-400 mt-1">
                Buat jadwal pertandingan otomatis berdasarkan rotasi shift
              </p>
            </div>
            <button
              onClick={handleGenerateSchedule}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white font-medium transition-colors"
            >
              <Loader2 className="w-4 h-4" />
              Buat Jadwal
            </button>
          </div>
        </div>
      )}

      {/* Week Selector */}
      <div className="bg-navy-800/50 rounded-xl border border-navy-700 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedWeek(prev => Math.max(1, prev - 1))}
              disabled={selectedWeek <= 1}
              className="p-2 text-gray-400 hover:text-white hover:bg-navy-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-emerald-400" />
              <h3 className="text-xl font-bold text-emerald-400">WEEK {selectedWeek}</h3>
            </div>
            <button
              onClick={() => setSelectedWeek(prev => prev + 1)}
              className="p-2 text-gray-400 hover:text-white hover:bg-navy-700 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-rose-500/20 border border-rose-500/30 rounded-lg">
              <Moon className="w-4 h-4 text-rose-400" />
              <span className="text-sm text-gray-400">Shift Malam: </span>
              <span className="text-sm font-bold text-rose-400">{nightShift}</span>
            </div>

            <button
              onClick={handleShareWhatsApp}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white font-medium transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Share ke WhatsApp
            </button>
          </div>
        </div>

        {/* Current Week Shift Rotation */}
        <div className="mb-6">
          <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Rotasi Minggu Ini</p>
          <CompactShiftRotation week={selectedWeek} />
        </div>

        {/* Weekly Schedule */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Court 1 */}
          <CourtColumn
            court={1}
            matches={weekMatches.filter(m => m.court === 1)}
            nightShift={nightShift}
          />

          {/* Court 2 */}
          <CourtColumn
            court={2}
            matches={weekMatches.filter(m => m.court === 2)}
            nightShift={nightShift}
          />
        </div>

        {weekMatches.length === 0 && (
          <div className="mt-6 p-8 bg-navy-900/50 rounded-lg border border-dashed border-navy-700 text-center">
            <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">Tidak ada pertandingan pada minggu ini</p>
          </div>
        )}
      </div>

      {/* Full Schedule Table */}
      <div className="bg-navy-800/50 rounded-xl border border-navy-700 overflow-hidden">
        <div className="p-4 border-b border-navy-700">
          <h3 className="text-lg font-semibold text-white">Jadwal Lengkap</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-navy-700 bg-navy-900/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Kategori</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Round</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Tanggal</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Jam</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Court</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Pertandingan</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Shift</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-700">
              {data.matches
                .filter(m => m.scheduledDate)
                .map(match => (
                  <tr key={match.id} className="hover:bg-navy-700/50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-400">M{match.matchNumber}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        match.category === 'Ganda Putra'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-gold-500/20 text-gold-400'
                      }`}>
                        {match.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">{match.round}</td>
                    <td className="px-4 py-3 text-sm text-white">{formatDate(match.scheduledDate!)}</td>
                    <td className="px-4 py-3 text-sm text-white">{match.scheduledTime}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">Court {match.court}</td>
                    <td className="px-4 py-3 text-sm text-white">
                      {getMatchLabel(match)}
                    </td>
                    <td className="px-4 py-3">
                      <ShiftBadges match={match} />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

interface CourtColumnProps {
  court: number;
  matches: Match[];
  nightShift: string;
}

function CourtColumn({ court, matches, nightShift }: CourtColumnProps) {
  // Sort matches: night shift priority first, then by time
  const sortedMatches = [...matches].sort((a, b) => {
    const aPriority = checkNightShift(a, nightShift) ? 0 : 1;
    const bPriority = checkNightShift(b, nightShift) ? 0 : 1;
    if (aPriority !== bPriority) return aPriority - bPriority;
    return (a.scheduledTime || '').localeCompare(b.scheduledTime || '');
  });

  return (
    <div className="bg-navy-900/50 rounded-lg border border-navy-700 p-4">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="w-5 h-5 text-emerald-400" />
        <h4 className="text-lg font-semibold text-white">Court {court}</h4>
      </div>

      <div className="space-y-3">
        {matches.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">Tidak ada pertandingan</p>
        ) : (
          sortedMatches.map(match => {
            const involvesNightShift = checkNightShift(match, nightShift);
            return (
              <div
                key={match.id}
                className={`p-3 rounded-lg border ${
                  involvesNightShift
                    ? 'bg-rose-500/10 border-rose-500/30'
                    : 'bg-navy-800/50 border-navy-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-mono text-gray-400">
                    {match.scheduledTime}
                  </span>
                  {involvesNightShift && (
                    <span className="px-2 py-0.5 bg-rose-500/20 text-rose-400 rounded text-xs font-medium flex items-center gap-1">
                      <Moon className="w-3 h-3" />
                      Night Shift
                    </span>
                  )}
                </div>
                <div className="text-sm text-white font-medium">
                  {getMatchLabel(match)}
                </div>
                <div className="mt-1">
                  <span className="text-xs text-gray-500">{match.round}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const day = date.getDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

function getMatchLabel(match: Match): string {
  if (!match.team1 || !match.team2) return 'TBD';

  const name1 = getTeamName(match.team1);
  const name2 = getTeamName(match.team2);

  return `${name1} vs ${name2}`;
}

function getTeamName(team: DoublesPair | Player): string {
  if ('player1' in team) {
    return `${team.player1.name} / ${team.player2.name}`;
  }
  return team.name;
}

function checkNightShift(match: Match, nightShift: string): boolean {
  const shifts1 = getTeamShifts(match.team1);
  const shifts2 = getTeamShifts(match.team2);

  return shifts1.includes(nightShift) || shifts2.includes(nightShift);
}

function getTeamShifts(team: DoublesPair | Player | undefined): string[] {
  if (!team) return [];
  if ('player1' in team) {
    return [team.player1.shiftGroup, team.player2.shiftGroup];
  }
  return [team.shiftGroup];
}

function ShiftBadges({ match }: { match: Match }) {
  const shifts = [...getTeamShifts(match.team1), ...getTeamShifts(match.team2)];
  const uniqueShifts = [...new Set(shifts)];

  const getShiftColor = (shift: ShiftGroup): string => {
    switch (shift) {
      case 'Grup A': return 'bg-amber-500/20 text-amber-400';
      case 'Grup B': return 'bg-rose-500/20 text-rose-400';
      case 'Grup C': return 'bg-blue-500/20 text-blue-400';
      case 'Non Shift': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="flex items-center gap-1">
      {uniqueShifts.map(shift => (
        <span key={shift} className={`px-2 py-0.5 rounded text-xs font-medium ${getShiftColor(shift)}`}>
          {shift}
        </span>
      ))}
    </div>
  );
}

function generateWhatsAppMessage(week: number, matches: Match[], nightShift: string): string {
  const lines: string[] = [];

  lines.push('🏸 JABIL FEST 5.0');
  lines.push('');
  lines.push(`📅 WEEK ${week} - ${(matches[0]?.scheduledDate ? formatDate(matches[0].scheduledDate) : 'TBD')}`);
  lines.push('');

  // Court 1
  const court1 = matches.filter(m => m.court === 1).sort((a, b) =>
    (a.scheduledTime || '').localeCompare(b.scheduledTime || '')
  );
  if (court1.length > 0) {
    lines.push('🏟 COURT 1');
    court1.forEach(m => {
      lines.push('');
      lines.push(m.scheduledTime || 'TBD');
      if (m.team1 && m.team2) {
        const name1 = getTeamName(m.team1);
        const name2 = getTeamName(m.team2);
        lines.push(name1);
        lines.push('vs');
        lines.push(name2);
      }
    });
    lines.push('');
  }

  // Court 2
  const court2 = matches.filter(m => m.court === 2).sort((a, b) =>
    (a.scheduledTime || '').localeCompare(b.scheduledTime || '')
  );
  if (court2.length > 0) {
    lines.push('🏟 COURT 2');
    court2.forEach(m => {
      lines.push('');
      lines.push(m.scheduledTime || 'TBD');
      if (m.team1 && m.team2) {
        const name1 = getTeamName(m.team1);
        const name2 = getTeamName(m.team2);
        lines.push(name1);
        lines.push('vs');
        lines.push(name2);
      }
    });
  }

  lines.push('');
  lines.push('Mohon hadir 15 menit sebelum pertandingan.');
  lines.push('');
  lines.push('Terima kasih.');

  return lines.join('\n');
}
