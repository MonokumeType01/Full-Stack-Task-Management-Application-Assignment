import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';       // adjust path if needed
import Dashboard from './pages/Dashboard'; // make sure Dashboard component exists
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace={true} />}/>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
              <Dashboard />
          </ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
