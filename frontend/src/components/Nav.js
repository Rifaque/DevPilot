'use client';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import styles from './Nav.module.css';

export default function Nav() {
  const { data: session } = useSession();
  const userRole = session?.user?.role;

  return (
    <nav className={styles.nav}>
      <div className={styles.left}>
        <Link href="/" className={styles.brand}>DevPilot</Link>
      </div>

      <div className={styles.right}>

        {userRole === 'ADMIN' && <Link href="/admin/dashboard">Admin</Link>}

        {session ? (
          <button onClick={() => signOut({ callbackUrl: '/login' })} className={styles.logout}>
            Logout
          </button>
        ) : (
          <Link href="/login">Login</Link>
        )}
      </div>
    </nav>
  );
}
