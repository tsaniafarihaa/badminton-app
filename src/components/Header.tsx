import React from 'react';
import { Calendar, MapPin, Clock, RefreshCw, Database, Layers, Play } from 'lucide-react';
import { useTournament } from '../context/TournamentContext';

export function Header() {
  const { resetTournament, data, useDatabase, toggleDatabaseMode, simulateAllMatches } = useTournament();

  const handleReset = () => {
    if (window.confirm('Apakah Anda yakin ingin menghapus seluruh data turnamen?')) {
      resetTournament();
    }
  };

  const handleSimulateAll = () => {
    if (window.confirm('Simulasikan semua pertandingan yang tersisa?')) {
      simulateAllMatches();
    }
  };

  return (
    <header className="bg-gradient-to-r from-navy-900 via-navy-800 to-navy-900 border-b border-navy-700 px-6 py-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            JABIL FEST <span className="text-gold-400">5.0</span>
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Badminton Tournament Manager
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Toggle */}
          <div className="flex items-center gap-1 px-1 py-1 bg-navy-800 rounded-lg border border-navy-700">
            <button
              onClick={() => toggleDatabaseMode(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-all ${
                useDatabase
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Mode Database - Data tersimpan permanen"
            >
              <Database className="w-4 h-4" />
              <span className="hidden sm:inline">Database</span>
            </button>
            <button
              onClick={() => toggleDatabaseMode(false)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-all ${
                !useDatabase
                  ? 'bg-amber-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Mode Simulasi - Data tersimpan lokal"
            >
              <Layers className="w-4 h-4" />
              <span className="hidden sm:inline">Simulasi</span>
            </button>
          </div>

          {/* Simulate All Button - only show when draw completed */}
          {data.drawCompleted && data.matches.some(m => m.status !== 'completed') && (
            <button
              onClick={handleSimulateAll}
              className="flex items-center gap-2 px-4 py-2 bg-navy-800 hover:bg-blue-900/50 border border-navy-600 hover:border-blue-500/50 rounded-lg text-gray-300 hover:text-blue-400 text-sm font-medium transition-all"
              title="Simulasikan semua pertandingan"
            >
              <Play className="w-4 h-4" />
              <span className="hidden sm:inline">Simulasi Semua</span>
            </button>
          )}

          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-navy-800 hover:bg-rose-900/50 border border-navy-600 hover:border-rose-500/50 rounded-lg text-gray-300 hover:text-rose-400 text-sm font-medium transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Mode Status Bar */}
      <div className={`mt-4 px-3 py-2 rounded-lg text-xs flex items-center gap-2 ${
        useDatabase
          ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
          : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
      }`}>
        {useDatabase ? (
          <>
            <Database className="w-3.5 h-3.5" />
            <span>Mode Database Aktif - Data tersimpan permanen di cloud</span>
          </>
        ) : (
          <>
            <Layers className="w-3.5 h-3.5" />
            <span>Mode Simulasi Aktif - Data tersimpan lokal di browser</span>
          </>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
        <div className="flex items-center gap-3 px-4 py-3 bg-navy-800/50 rounded-lg border border-navy-700">
          <Calendar className="w-5 h-5 text-emerald-400" />
          <div>
            <p className="text-xs text-gray-400">Tanggal Mulai</p>
            <p className="text-sm font-semibold text-white">2 Juli 2026</p>
          </div>
        </div>

        <div className="flex items-center gap-3 px-4 py-3 bg-navy-800/50 rounded-lg border border-navy-700">
          <MapPin className="w-5 h-5 text-emerald-400" />
          <div>
            <p className="text-xs text-gray-400">Lokasi</p>
            <p className="text-sm font-semibold text-white">Progresif Arena</p>
          </div>
        </div>

        <div className="flex items-center gap-3 px-4 py-3 bg-navy-800/50 rounded-lg border border-navy-700">
          <Clock className="w-5 h-5 text-emerald-400" />
          <div>
            <p className="text-xs text-gray-400">Waktu</p>
            <p className="text-sm font-semibold text-white">19:00 - 22:00 WIB</p>
          </div>
        </div>

        <div className="flex items-center gap-3 px-4 py-3 bg-navy-800/50 rounded-lg border border-navy-700">
          <Calendar className="w-5 h-5 text-emerald-400" />
          <div>
            <p className="text-xs text-gray-400">Hari</p>
            <p className="text-sm font-semibold text-white">Kamis</p>
          </div>
        </div>
      </div>
    </header>
  );
}
