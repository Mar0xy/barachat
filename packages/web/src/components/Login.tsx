import { Component, createSignal } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { API_URL } from '../utils/constants';

export const Login: Component = () => {
  const [isRegister, setIsRegister] = createSignal(false);
  const [email, setEmail] = createSignal('');
  const [username, setUsername] = createSignal('');
  const [password, setPassword] = createSignal('');
  const navigate = useNavigate();

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    const endpoint = isRegister() ? '/auth/register' : '/auth/login';
    const body = isRegister()
      ? { email: email(), username: username(), password: password() }
      : { email: email(), password: password() };

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/app');
      } else {
        alert(data.error || 'Authentication failed');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred');
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        'align-items': 'center',
        'justify-content': 'center',
        height: '100vh',
        'background-color': '#36393f'
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          'background-color': '#2f3136',
          padding: '2rem',
          'border-radius': '8px',
          width: '320px'
        }}
      >
        <h2 style={{ color: '#fff', 'margin-bottom': '1.5rem', 'text-align': 'center' }}>
          {isRegister() ? 'Create Account' : 'Welcome Back'}
        </h2>

        {isRegister() && (
          <input
            type="text"
            placeholder="Username"
            value={username()}
            onInput={(e) => setUsername(e.currentTarget.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              'margin-bottom': '1rem',
              'background-color': '#40444b',
              border: 'none',
              'border-radius': '4px',
              color: '#fff'
            }}
          />
        )}

        <input
          type="email"
          placeholder="Email"
          value={email()}
          onInput={(e) => setEmail(e.currentTarget.value)}
          style={{
            width: '100%',
            padding: '0.75rem',
            'margin-bottom': '1rem',
            'background-color': '#40444b',
            border: 'none',
            'border-radius': '4px',
            color: '#fff'
          }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password()}
          onInput={(e) => setPassword(e.currentTarget.value)}
          style={{
            width: '100%',
            padding: '0.75rem',
            'margin-bottom': '1.5rem',
            'background-color': '#40444b',
            border: 'none',
            'border-radius': '4px',
            color: '#fff'
          }}
        />

        <button
          type="submit"
          style={{
            width: '100%',
            padding: '0.75rem',
            'background-color': '#5865f2',
            border: 'none',
            'border-radius': '4px',
            color: '#fff',
            'font-size': '1rem',
            cursor: 'pointer',
            'font-weight': '500'
          }}
        >
          {isRegister() ? 'Register' : 'Login'}
        </button>

        <div style={{ 'text-align': 'center', 'margin-top': '1rem' }}>
          <span style={{ color: '#b9bbbe' }}>
            {isRegister() ? 'Already have an account?' : "Don't have an account?"}
          </span>
          <button
            type="button"
            onClick={() => setIsRegister(!isRegister())}
            style={{
              'margin-left': '0.5rem',
              background: 'none',
              border: 'none',
              color: '#00b0f4',
              cursor: 'pointer',
              'text-decoration': 'none'
            }}
          >
            {isRegister() ? 'Login' : 'Register'}
          </button>
        </div>
      </form>
    </div>
  );
};
