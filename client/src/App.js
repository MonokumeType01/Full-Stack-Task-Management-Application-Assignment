import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';       // adjust path if needed
import Dashboard from './pages/Dashboard'; // make sure Dashboard component exists

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
