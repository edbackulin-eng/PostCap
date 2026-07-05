import { useState } from 'react';
import Login from './components/Login';
import Pos from './components/Pos';

function App() {
  const [user, setUser] = useState(null);

  if (!user) {
    return <Login onLoginSuccess={setUser} />;
  }

  return <Pos user={user} />;
}

export default App;
