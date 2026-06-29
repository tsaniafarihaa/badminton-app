import React, { useState } from 'react';
import { TournamentProvider } from './context/TournamentContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { PlayerManagement } from './components/PlayerManagement';
import { DrawView } from './components/DrawView';
import { BracketView } from './components/BracketView';
import { ScheduleView } from './components/ScheduleView';
import { MatchesView } from './components/MatchesView';
import { ToastContainer } from './components/Toast';
import { useTournament } from './context/TournamentContext';

type View = 'dashboard' | 'players' | 'draw' | 'schedule' | 'bracket' | 'matches';

function AppContent() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const { data } = useTournament();

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'players':
        return <PlayerManagement />;
      case 'draw':
        return <DrawView />;
      case 'bracket':
        return <BracketView />;
      case 'schedule':
        return <ScheduleView />;
      case 'matches':
        return <MatchesView />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 font-jakarta flex">
      {/* Sidebar */}
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        drawCompleted={data.drawCompleted}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <Header />

        <main className="flex-1 overflow-auto bg-navy-950">
          {renderView()}
        </main>

        {/* Footer */}
        <footer className="bg-navy-900 border-t border-navy-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Jabil Fest 5.0 - Badminton Tournament Manager
            </p>
            <p className="text-xs text-emerald-500 font-medium">
              One Team, One Spirit, One Jabil!
            </p>
          </div>
        </footer>
      </div>

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
}

function App() {
  return (
    <TournamentProvider>
      <AppContent />
    </TournamentProvider>
  );
}

export default App;
