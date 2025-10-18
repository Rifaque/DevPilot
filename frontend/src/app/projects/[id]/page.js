'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import TaskItem from '../../../components/TaskItem';
import styles from './Project.module.css';
import { getToken } from '../../../lib/auth';

const API = process.env.NEXT_PUBLIC_API_BASE;

export default function ProjectDetail() {
  const params = useParams();
  const id = params.id;
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const token = getToken();

  useEffect(() => {
    if (!id) return;
    fetch(`${API}/projects/${id}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.json())
      .then(data => {
        setProject(data);
        setTasks(data.tasks || []);
      })
      .catch(console.error);
  }, [id]);

  async function createTask(e) {
    e.preventDefault();
    if (!newTask) return;
    const res = await fetch(`${API}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title: newTask, projectId: parseInt(id) })
    });
    const t = await res.json();
    setTasks(prev => [...prev, t]);
    setNewTask('');
  }

  if (!project) return <div className="container"><p>Loading project…</p></div>;

  return (
    <div className="container">
      <div className={styles.header}>
        <h1>{project.name}</h1>
        <p>{project.description}</p>
      </div>

      <section className={styles.newTask}>
        <form onSubmit={createTask}>
          <input value={newTask} onChange={e=>setNewTask(e.target.value)} placeholder="New task title" />
          <button type="submit">Add Task</button>
        </form>
      </section>

      <section>
        <h2>Tasks</h2>
        <div className={styles.tasks}>
          {tasks.length === 0 && <p>No tasks yet.</p>}
          {tasks.map(task => <TaskItem key={task.id} task={task} onChanged={() => {
            fetch(`${API}/projects/${id}`).then(r=>r.json()).then(d=>setTasks(d.tasks || []));
          }} />)}
        </div>
      </section>
    </div>
  );
}
