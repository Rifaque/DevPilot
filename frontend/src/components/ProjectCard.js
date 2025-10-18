'use client';
import Link from 'next/link';
import styles from './ProjectCard.module.css';

export default function ProjectCard({ project }) {
  return (
    <div className={styles.card}>
      <h3>{project.name}</h3>
      {project.description && <p className={styles.desc}>{project.description}</p>}
      <p className={styles.meta}>Tasks: {project.tasks?.length ?? 0}</p>
      <div className={styles.actions}>
        <Link href={`/projects/${project.id}`} className={styles.view}>
            View
        </Link>
      </div>
    </div>
  );
}
