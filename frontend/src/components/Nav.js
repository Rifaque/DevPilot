'use client';
import Link from 'next/link';
import styles from './Nav.module.css';
import { getToken, clearToken } from '../lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Nav() {
  const router = useRouter();
  const [token, setToken] = useState(null);

  useEffect(()=> setToken(getToken()), []);

  function handleLogout() {
    clearToken();
    router.push('/login');
  }

  return (
    <nav className={styles.nav}>
      <div className={styles.left}>
        <Link href="/" className={styles.brand}>DevPilot</Link>
      </div>

      <div className={styles.right}>
        <Link href="/projects">Projects</Link>
        <Link href="/admin/dashboard">Admin</Link>
        {token ? (
          <button onClick={handleLogout} className={styles.logout}>Logout</button>
        ) : (
          <Link href="/login">Login</Link>
        )}
      </div>
    </nav>
  );
}
