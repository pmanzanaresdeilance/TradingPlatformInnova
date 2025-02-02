import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SessionContextProvider, useSupabaseClient } from '@supabase/auth-helpers-react';
import { AuthProvider } from './contexts/AuthContext';
import { MetaAPIProvider } from './contexts/MetaAPIContext';
import { supabase } from './lib/supabase';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import Calendar from './pages/Calendar';
import Charts from './pages/Charts';
import Journal from './pages/Journal';
import Premarket from './pages/Premarket';
import Backtesting from './pages/Backtesting';
import Accounts from './pages/Accounts';
import Rankings from './pages/Rankings';
import Profile from './pages/Profile';
import Support from './pages/Support';
import Community from './pages/Community';
import TagExplore from './pages/community/TagExplore';

function App() {
  return (
    <React.StrictMode>
      <SessionContextProvider supabaseClient={supabase}>
        <AuthProvider>
        <MetaAPIProvider>
        <Router>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="/dashboard" element={<Navigate to="/" replace />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/charts" element={<Charts />} />
              <Route path="/journal" element={<Journal />} />
              <Route path="/accounts" element={<Accounts />} />
              <Route path="/rankings" element={<Rankings />} />
              <Route path="/premarket" element={<Premarket />} />
              <Route path="/backtesting" element={<Backtesting />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/support" element={<Support />} />
              <Route path="/community" element={<Community />} />
              <Route path="/community/tags/:tag" element={<TagExplore />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </Router>
        </MetaAPIProvider>
        </AuthProvider>
      </SessionContextProvider>
    </React.StrictMode>
  );
}

export default App;