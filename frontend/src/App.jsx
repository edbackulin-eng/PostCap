import { useState } from 'react';
import Login from './components/Login';
import Pos from './components/Pos';
import AdminPanel from './components/Admin/AdminPanel';

function App() {
  const [user, setUser] = useState(null);

  if (!user) {
    return <Login onLoginSuccess={setUser} />;
  }

  if (user.role === 'admin') {
    return <AdminPanel user={user} />;
  }

  return <Pos user={user} />;
}

export default App;
