import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar.js';
import { HomePage } from './pages/HomePage.js';
import { ProblemsPage } from './pages/ProblemsPage.js';
import { ProblemDetailPage } from './pages/ProblemDetailPage.js';
import { ContestsPage } from './pages/ContestsPage.js';
import { ContestDetailPage } from './pages/ContestDetailPage.js';
import { LeaderboardPage } from './pages/LeaderboardPage.js';
import { GroupsPage } from './pages/GroupsPage.js';
import { ProfilePage } from './pages/ProfilePage.js';
import { LoginPage } from './pages/LoginPage.js';
import { RegisterPage } from './pages/RegisterPage.js';
import { AdminPage } from './pages/AdminPage.js';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/problems" element={<ProblemsPage />} />
            <Route path="/problems/:slug" element={<ProblemDetailPage />} />
            <Route path="/contests" element={<ContestsPage />} />
            <Route path="/contests/:id" element={<ContestDetailPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/groups" element={<GroupsPage />} />
            <Route path="/profile/:handle" element={<ProfilePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </main>
        <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500 font-mono">
          Dagna (ዳኛ) Online Judge & Contest Platform &copy; 2026. Production-grade sandboxed competitive programming.
        </footer>
      </div>
    </BrowserRouter>
  );
};
