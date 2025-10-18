'use client';
import { useEffect, useState } from 'react';
import { getToken } from '../../../lib/auth';
import styles from './Admin.module.css';

const API = process.env.NEXT_PUBLIC_API_BASE;

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [users, setUsers] = useState([]);
  const token = getToken();

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/admin/metrics`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setMetrics).catch(console.error);

    fetch(`${API}/admin/users`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setUsers).catch(console.error);
  }, []);

  return (
    <div className="container">
      <h1>Admin Dashboard</h1>
      {!metrics ? <p>Loading metrics…</p> : (
        <div className={styles.metrics}>
          <div className={styles.card}><h3>Projects</h3><p>{metrics.totalProjects}</p></div>
          <div className={styles.card}><h3>Users</h3><p>{metrics.totalUsers}</p></div>
          <div className={styles.card}><h3>Tasks</h3><p>{metrics.totalTasks}</p></div>
          <div className={styles.card}><h3>Overdue</h3><p>{metrics.overdue}</p></div>
        </div>
      )}
      <section>
        <h2>Users</h2>
        <table className={styles.table}>
          <thead><tr><th>Name</th><th>Email</th><th>Role</th></tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}><td>{u.name}</td><td>{u.email}</td><td>{u.role}</td></tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
