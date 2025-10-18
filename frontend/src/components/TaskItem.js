'use client';
import styles from './TaskItem.module.css';
import { getToken } from '../lib/auth';

const API = process.env.NEXT_PUBLIC_API_BASE;

export default function TaskItem({ task, onChanged }) {
  const token = getToken();

  async function setStatus(status) {
    await fetch(`${API}/tasks/${task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status })
    });
    onChanged && onChanged();
  }

  async function del() {
    if (!confirm('Delete task?')) return;
    await fetch(`${API}/tasks/${task.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    onChanged && onChanged();
  }

  return (
    <div className={styles.row}>
      <div className={styles.left}>
        <strong>{task.title}</strong>
        <div className={styles.meta}>
          <span>{task.status}</span>
          {task.dueDate && <span> • due {new Date(task.dueDate).toLocaleDateString()}</span>}
        </div>
      </div>
      <div className={styles.actions}>
        {task.status !== 'IN_PROGRESS' && <button onClick={()=>setStatus('IN_PROGRESS')}>Start</button>}
        {task.status !== 'DONE' && <button onClick={()=>setStatus('DONE')}>Done</button>}
        <button onClick={del} className={styles.danger}>Delete</button>
      </div>
    </div>
  );
}
