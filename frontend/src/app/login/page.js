'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './Login.module.css';
import { saveToken } from '../../lib/auth';

const API = process.env.NEXT_PUBLIC_API_BASE;

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const router = useRouter();

  async function submit(e) {
    e.preventDefault();
    setErr('');
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || 'Login failed');
        return;
      }
      saveToken(data.token);
      router.push('/');
    } catch (e) {
      setErr('Network error');
    }
  }

  return (
    <div className="container">
      <div className={styles.card}>
        <h1>Sign in</h1>
        <form onSubmit={submit}>
          <label className={styles.formLabel}>Email</label>
          <input
            className={styles.formInput}
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="admin@devpilot.local"
          />
          <label className={styles.formLabel}>Password</label>
          <input
            type="password"
            className={styles.formInput}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="password123"
          />
          {err && <p className={styles.err}>{err}</p>}
          <button className={styles.btn}>Sign in</button>
        </form>
      </div>
    </div>
  );
}
