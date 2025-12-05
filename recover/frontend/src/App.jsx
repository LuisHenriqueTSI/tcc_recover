
import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LogoutButton from './components/LogoutButton';
import NotificationBell from './components/NotificationBell';
import { useUnreadMessages } from './hooks/useUnreadMessages';
import Welcome from './pages/Welcome';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import RegisterItem from './pages/RegisterItem';
import Search from './pages/Search';
import Map from './pages/Map';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';
import Admin from './pages/Admin';
import RequireAuth from './components/RequireAuth';
import { Navigate } from 'react-router-dom';
import LoginSupabase from './pages/LoginSupabase';
import RegisterSupabase from './pages/RegisterSupabase';


function AppContent() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, isAdmin } = useAuth();
  const { unreadCount } = useUnreadMessages();
  
  console.log('[App] unreadCount:', unreadCount, 'user:', user?.email);

  function RequireAdmin({ children }) {
    if (!user) return <Navigate to="/login" replace />;
    if (!isAdmin) return <Navigate to="/" replace />;
    return children;
  }

  return (
    <Router>
      <nav className="bg-white shadow px-6 py-3 flex items-center justify-between relative">
        <div className="flex items-center gap-4">
          <Link to={user ? "/home" : "/"} className="text-2xl font-heading font-bold text-primary hover:underline">Recover</Link>
          <div className="hidden md:flex items-center gap-4">
            {user && <Link to="/home" className="text-primary font-semibold hover:underline">Buscar Itens</Link>}
            {user && <Link to="/register-item" className="text-accent font-semibold hover:underline">Registrar Item</Link>}
          </div>
        </div>
        <div className="hidden md:flex items-center gap-4">
          {user && <Link to="/dashboard" className="text-primary font-semibold hover:underline">Painel</Link>}
          {user && (
            <Link to="/chat" className="text-secondary font-semibold hover:underline relative">
              Chat
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-2 inline-flex items-center justify-center w-2 h-2 bg-red-600 rounded-full"></span>
              )}
            </Link>
          )}
          {user && isAdmin && <Link to="/admin" className="text-accent font-semibold hover:underline">Admin</Link>}
          {user && <NotificationBell />}
          {!user && <Link to="/login" className="text-secondary font-semibold hover:underline">Login</Link>}
          {!user && <Link to="/register" className="text-primary font-semibold hover:underline">Registrar</Link>}
          {user && <LogoutButton />}
        </div>
        {/* Mobile menu button */}
        <button className="md:hidden flex items-center px-2 py-1 border rounded text-primary border-primary" onClick={() => setMenuOpen(!menuOpen)}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
        {/* Mobile menu */}
        {menuOpen && (
          <div className="absolute top-full left-0 w-full bg-white shadow-md z-50 flex flex-col gap-2 p-4 md:hidden animate-slide-down">
            {user && <Link to="/home" className="text-primary font-semibold hover:underline" onClick={() => setMenuOpen(false)}>Buscar Itens</Link>}
            {user && <Link to="/register-item" className="text-accent font-semibold hover:underline" onClick={() => setMenuOpen(false)}>Registrar Item</Link>}
            {user && <Link to="/dashboard" className="text-primary font-semibold hover:underline" onClick={() => setMenuOpen(false)}>Painel</Link>}
            {user && (
              <Link to="/chat" className="text-secondary font-semibold hover:underline relative inline-block" onClick={() => setMenuOpen(false)}>
                Chat
                {unreadCount > 0 && (
                  <span className="inline-flex items-center justify-center ml-2 w-2 h-2 bg-red-600 rounded-full"></span>
                )}
              </Link>
            )}
            {user && isAdmin && <Link to="/admin" className="text-accent font-semibold hover:underline" onClick={() => setMenuOpen(false)}>Admin</Link>}
            {!user && <Link to="/login" className="text-secondary font-semibold hover:underline" onClick={() => setMenuOpen(false)}>Login</Link>}
            {!user && <Link to="/register" className="text-primary font-semibold hover:underline" onClick={() => setMenuOpen(false)}>Registrar</Link>}
            {user && <div className="mt-2"><LogoutButton /></div>}
          </div>
        )}
      </nav>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<LoginSupabase />} />
        <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/register-item" element={<RequireAuth><RegisterItem /></RequireAuth>} />
        <Route path="/search" element={<Search />} />
        <Route path="/admin" element={<RequireAdmin><Admin /></RequireAdmin>} />
        <Route path="/map" element={<Map />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
        <Route path="/profile/edit" element={<RequireAuth><EditProfile /></RequireAuth>} />
        <Route path="/admin" element={<RequireAuth><Admin /></RequireAuth>} />
        <Route path="/register" element={<RegisterSupabase />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App
