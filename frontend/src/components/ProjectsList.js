// ProjectsList.jsx
'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import ProjectCard from './ProjectCard';
import styles from './ProjectsList.module.css';

const API = process.env.NEXT_PUBLIC_API_BASE;

function getUserRole(session) {
  // try a few common places session might store role
  return session?.user?.role || session?.role || session?.user?.roles?.[0] || null;
}

function AddProjectCard({ onOpen }) {
  return (
    <button className={styles.addCard} onClick={onOpen} aria-label="Add project">
      <div className={styles.addContent}>
        <div className={styles.plus}>+</div>
        <div className={styles.text}>Add project</div>
      </div>
    </button>
  );
}

export default function ProjectsList({ initialProjects = [], initialSession }) {
  const { data: clientSession } = useSession();
  const session = clientSession || initialSession;
  const token = session?.accessToken;

  const [projects, setProjects] = useState(initialProjects || []);
  const [loading, setLoading] = useState(!initialProjects.length);

  // modal + form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!token) return;
    setLoading(true);

    fetch(`${API}/projects`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (r) => {
        if (!r.ok) {
          const err = await r.json().catch(() => ({}));
          throw new Error(err?.error || 'Failed to load projects');
        }
        return r.json();
      })
      .then(setProjects)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  if (!token) return <p>Please login to see projects.</p>;
  if (loading) return <p>Loading projects…</p>;
  if (!projects || projects.length === 0) {
    // Show Add card if user can create projects; otherwise show message
    const role = getUserRole(session);
    const canAdd = role === 'MANAGER' || role === 'ADMIN';
    return (
      <>
        {canAdd ? (
          <div className={styles.grid}>
            <AddProjectCard onOpen={() => setIsModalOpen(true)} />
            <p className={styles.emptyNotice}>No projects yet — create the first one.</p>
          </div>
        ) : (
          <p>No projects yet.</p>
        )}
        {isModalOpen && renderModal()}
      </>
    );
  }

  const role = getUserRole(session);
  const canAdd = role === 'MANAGER' || role === 'ADMIN';

  function openModal() {
    setFormError('');
    setName('');
    setDescription('');
    setStartDate('');
    setEndDate('');
    setIsModalOpen(true);
  }

  async function handleCreate(e) {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('Project name is required.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = { name: name.trim(), description: description.trim() || undefined };
      if (startDate) payload.startDate = startDate;
      if (endDate) payload.endDate = endDate;

      const res = await fetch(`${API}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || 'Failed to create project');
      }

      const created = await res.json();

      // prepend the new project
      setProjects(prev => [created, ...prev]);
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      setFormError(err.message || 'Server error');
    } finally {
      setSubmitting(false);
    }
  }

  function renderModal() {
    return (
      <div className={styles.modalOverlay} role="dialog" aria-modal="true">
        <div className={styles.modal}>
          <header className={styles.modalHeader}>
            <h2>Create project</h2>
            <button className={styles.closeBtn} onClick={() => setIsModalOpen(false)} aria-label="Close">
              ✕
            </button>
          </header>

          <form className={styles.form} onSubmit={handleCreate}>
            <label className={styles.label}>
              Name <span className={styles.required}>*</span>
              <input
                className={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={150}
              />
            </label>

            <label className={styles.label}>
              Description
              <textarea
                className={styles.textarea}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                maxLength={1000}
              />
            </label>

            <div className={styles.row}>
              <label className={styles.label}>
                Start date
                <input
                  className={styles.input}
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </label>

              <label className={styles.label}>
                End date
                <input
                  className={styles.input}
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </label>
            </div>

            {formError && <div className={styles.formError}>{formError}</div>}

            <footer className={styles.modalFooter}>
              <button type="button" className={styles.secondaryBtn} onClick={() => setIsModalOpen(false)} disabled={submitting}>
                Cancel
              </button>
              <button type="submit" className={styles.primaryBtn} disabled={submitting}>
                {submitting ? 'Creating…' : 'Create project'}
              </button>
            </footer>
          </form>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={styles.grid}>
        {canAdd && <AddProjectCard onOpen={openModal} />}
        {Array.isArray(projects) && projects?.map(p => (
          <ProjectCard key={p.id} project={p} session={session} />
        ))}
      </div>

      {isModalOpen && renderModal()}
    </>
  );
}
