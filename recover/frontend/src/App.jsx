
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import RegisterItem from './pages/RegisterItem';
import Search from './pages/Search';
import Map from './pages/Map';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import RequireAuth from './components/RequireAuth';
import LoginSupabase from './pages/LoginSupabase';
import RegisterSupabase from './pages/RegisterSupabase';

function App() {
  return (
    <Router>
      <nav className="bg-white shadow p-4 flex gap-4 justify-center">
        <Link to="/" className="text-primary font-bold hover:underline">Home</Link>
        <Link to="/login" className="text-secondary font-bold hover:underline">Login</Link>
        <Link to="/dashboard" className="text-primary font-bold hover:underline">Dashboard</Link>
        <Link to="/register-item" className="text-accent font-bold hover:underline">Registrar Item</Link>
        <Link to="/search" className="text-primary font-bold hover:underline">Buscar</Link>
        <Link to="/map" className="text-primary font-bold hover:underline">Mapa</Link>
        <Link to="/chat" className="text-secondary font-bold hover:underline">Chat</Link>
        <Link to="/profile" className="text-primary font-bold hover:underline">Perfil</Link>
        <Link to="/admin" className="text-accent font-bold hover:underline">Admin</Link>
        <Link to="/login" className="text-secondary font-bold hover:underline">Login</Link>
        <Link to="/register" className="text-primary font-bold hover:underline">Registrar Usuário</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginSupabase />} />
        <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/register-item" element={<RequireAuth><RegisterItem /></RequireAuth>} />
        <Route path="/search" element={<Search />} />
        <Route path="/map" element={<Map />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
        <Route path="/admin" element={<RequireAuth><Admin /></RequireAuth>} />
        <Route path="/register" element={<RegisterSupabase />} />
      </Routes>
    </Router>
  );
}

export default App
