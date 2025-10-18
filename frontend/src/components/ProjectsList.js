'use client';
import { useEffect, useState } from 'react';
import ProjectCard from './ProjectCard';
import styles from './ProjectsList.module.css';
import { getToken } from '../lib/auth';

const API = process.env.NEXT_PUBLIC_API_BASE;

export default function ProjectsList() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = getToken();

  useEffect(() => {
    fetch(`${API}/projects`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.json())
      .then(setProjects)
      .catch(console.error)
      .finally(()=>setLoading(false));
  }, []);

  if (loading) return <p>Loading…</p>;
  if (projects.length === 0) return <p>No projects yet.</p>;

  return <div className={styles.grid}>{projects.map(p => <ProjectCard key={p.id} project={p} />)}</div>;
}
