'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import styles from './Admin.module.css';

const API = process.env.NEXT_PUBLIC_API_BASE;

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'DEVELOPER' });

  const { data: session } = useSession();
  const token = session?.accessToken;

  useEffect(() => {
    if (!token) return;

    const fetchMetrics = fetch(`${API}/admin/metrics`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json());

    const fetchUsers = fetch(`${API}/admin/users`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json());

    Promise.all([fetchMetrics, fetchUsers])
      .then(([metricsData, usersData]) => {
        setMetrics(metricsData);
        setUsers(usersData);
      })
      .catch(console.error);
  }, [token]);

  const updateRole = async (id, role) => {
    try {
      const res = await fetch(`${API}/admin/users/${id}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (res.ok) setUsers(u => u.map(user => (user.id === id ? { ...user, role: data.role } : user)));
    } catch (err) { console.error(err); }
  };

  const deleteUser = async id => {
    if (session.user.id === id) return alert("You can't delete yourself!");
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const res = await fetch(`${API}/admin/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setUsers(u => u.filter(user => user.id !== id));
    } catch (err) { console.error(err); }
  };

  const addUser = async e => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/admin/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newUser),
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(u => [...u, data]);
        setNewUser({ name: '', email: '', password: '', role: 'DEVELOPER' });
      } else alert(data.error || 'Error adding user');
    } catch (err) { console.error(err); }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Admin Dashboard</h1>

      {!metrics ? (
        <p className={styles.loading}>Loading metrics…</p>
      ) : (
        <div className={styles.metrics}>
          <div className={styles.card}><h3>Projects</h3><p>{metrics.totalProjects}</p></div>
          <div className={styles.card}><h3>Users</h3><p>{metrics.totalUsers}</p></div>
          <div className={styles.card}><h3>Tasks</h3><p>{metrics.totalTasks}</p></div>
          <div className={styles.card}><h3>Overdue</h3><p>{metrics.overdue}</p></div>
        </div>
      )}

      <section className={styles.usersSection}>
        <h2>Users</h2>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <select value={u.role} onChange={e => updateRole(u.id, e.target.value)}>
                      <option value="DEVELOPER">Developer</option>
                      <option value="ADMIN">Admin</option>
                      <option value="MANAGER">Manager</option>
                    </select>
                  </td>
                  <td>
                    <button className={styles.deleteBtn} onClick={() => deleteUser(u.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3>Add User</h3>
        <form onSubmit={addUser} className={styles.addUserForm}>
          <input type="text" placeholder="Name" value={newUser.name} onChange={e => setNewUser(n => ({ ...n, name: e.target.value }))} required />
          <input type="email" placeholder="Email" value={newUser.email} onChange={e => setNewUser(n => ({ ...n, email: e.target.value }))} required />
          <input type="password" placeholder="Password" value={newUser.password} onChange={e => setNewUser(n => ({ ...n, password: e.target.value }))} required />
          <select value={newUser.role} onChange={e => setNewUser(n => ({ ...n, role: e.target.value }))}>
            <option value="DEVELOPER">Developer</option>
            <option value="ADMIN">Admin</option>
            <option value="MANAGER">Manager</option>
          </select>
          <button type="submit" className={styles.addBtn}>Add User</button>
        </form>
      </section>
    </div>
  );
}
