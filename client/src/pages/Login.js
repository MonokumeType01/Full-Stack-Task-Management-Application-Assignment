import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const apiUrl = process.env.REACT_APP_API_URL;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        const data = await res.json();
        setToken(data.token);
        localStorage.setItem("token", data.token);
        navigate('/dashboard');
      } else {
        setError('Invalid username or password');
      }
    } catch (err) {
      setError('Error connecting to server');
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f3f3f3' }}>
      <div style={{ background: '#f3f3f3', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>
        <h2 style={{ color:"black", fontSize: '24px', fontWeight: 'bold', textAlign: 'center', marginBottom: '1.5rem' }}>Login</h2>
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '1rem' }}>
            <input
              name="username"
              placeholder="Username"
              value={form.username}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <input
              name="password"
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>
          <button
            type="submit"
            style={{ width: '100%', padding: '0.5rem', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Login
          </button>
        </form>

        {error && (
          <p style={{ color: 'red', marginTop: '1rem', textAlign: 'center' }}>{error}</p>
        )}

        {token && (
          <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#e6f4ea', border: '1px solid #c3e6cb', borderRadius: '4px' }}>
            <h4 style={{ fontWeight: 'bold' }}>JWT Token:</h4>
            <code style={{ display: 'block', wordBreak: 'break-all', marginTop: '0.5rem', fontSize: '0.85rem' }}>
              {token}
            </code>
          </div>
        )}
      </div>
    </div>
  );
}
