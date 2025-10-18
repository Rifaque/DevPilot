'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import styles from './ProjectClient.module.css';

export default function ProjectClient({ projectId }) {
  const { data: session } = useSession();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingStatusFor, setUpdatingStatusFor] = useState(null);
  const [users, setUsers] = useState([]);

  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newAssigneeId, setNewAssigneeId] = useState(null);
  const [newDueDate, setNewDueDate] = useState('');

  const [addMemberUserId, setAddMemberUserId] = useState('');
  const [addMemberRole, setAddMemberRole] = useState('Developer');
  const [addingMember, setAddingMember] = useState(false);

  const [userStories, setUserStories] = useState([]);
  const [generatingStories, setGeneratingStories] = useState(false);
  const [storyError, setStoryError] = useState(null);

  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editValues, setEditValues] = useState({
    title: '',
    description: '',
    status: '',
    assigneeId: null,
    dueDate: '',
  });

  const userRole = session?.user?.role;
  const canEdit = ["MANAGER", "ADMIN"].includes(userRole);
  const token = session?.accessToken;

  async function refreshAll() {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

      // fetch project
      const projRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/projects/${projectId}`,
        { headers }
      );
      if (!projRes.ok) throw new Error('Project not found');
      const projData = await projRes.json();
      setProject(projData);
      setUserStories(projData.userStories || []);

      // fetch tasks
      const tasksRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/tasks/${projectId}/tasks`,
        { headers }
      );
      if (!tasksRes.ok) {
        setTasks(projData.tasks || []);
      } else {
        const tasksData = await tasksRes.json();
        setTasks(tasksData || []);
      }

      // fetch metrics
      const metricsRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/projects/${projectId}/metrics`,
        { headers }
      );
      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setMetrics(metricsData);
      } else {
        setMetrics(null);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!token) return;
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, projectId]);

  async function fetchUsers() {
    if (!token) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  }

  useEffect(() => {
    if (token) fetchUsers();
  }, [token]);

  // Create task
  async function createTask(e) {
    e.preventDefault();
    if (!newTitle || !token) return;

    try {
      const body = {
        title: newTitle,
        description: newDescription || undefined,
        assigneeId: newAssigneeId === null || newAssigneeId === 'null' ? null : newAssigneeId,
        dueDate: newDueDate ? newDueDate : null,
      };

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/tasks/${projectId}/tasks`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        }
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to create task');
      }

      await refreshAll();

      setNewTitle('');
      setNewDescription('');
      setNewAssigneeId(null);
      setNewDueDate('');
    } catch (err) {
      console.error(err);
      alert('Error creating task: ' + (err.message || err));
    }
  }

  async function saveEdit(e) {
    e.preventDefault();
    if (!editingTaskId || !token) return;

    try {
      const payload = {
        title: editValues.title,
        description: editValues.description,
        status: editValues.status,
        assigneeId:
          editValues.assigneeId === null || editValues.assigneeId === 'null'
            ? null
            : editValues.assigneeId,
        dueDate: editValues.dueDate ? editValues.dueDate : null,
      };

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/tasks/task/${editingTaskId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to update task');
      }

      await refreshAll();
      setEditingTaskId(null);
      setEditValues({ title: '', description: '', status: '', assigneeId: null, dueDate: '' });
    } catch (err) {
      console.error(err);
      alert('Error updating task: ' + (err.message || err));
    }
  }

  // Delete Task
  async function deleteTask(taskId) {
    if (!token) return;
    if (!confirm('Delete this task?')) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/tasks/task/${taskId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to delete task');
      }
      await refreshAll();
    } catch (err) {
      console.error(err);
      alert('Error deleting task: ' + (err.message || err));
    }
  }

  async function updateStatus(taskId, status) {
    if (!token) return;
    setUpdatingStatusFor(taskId);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/tasks/task/${taskId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to update status');
      }
      await refreshAll();
    } catch (err) {
      console.error(err);
      alert('Error updating task: ' + (err.message || err));
    } finally {
      setUpdatingStatusFor(null);
    }
  }

  function startEdit(task) {
    setEditingTaskId(task.id);
    setEditValues({
      title: task.title || '',
      description: task.description || '',
      status: task.status || 'TODO',
      assigneeId: task.assignee?.id ?? null,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : '',
    });
  }

  function cancelEdit() {
    setEditingTaskId(null);
    setEditValues({ title: '', description: '', status: '', assigneeId: null, dueDate: '' });
  }

  const existingUserIds = new Set((project?.members || []).map(m => m.user?.id ?? m.id));
  const availableUsers = users.filter(u => !existingUserIds.has(u.id));

  async function addMember(e) {
    e.preventDefault();
    if (!token || !addMemberUserId) return;
    setAddingMember(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/projects/${projectId}/members`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ userId: addMemberUserId, role: addMemberRole }),
        }
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to add member');
      }
      await refreshAll();
      setAddMemberUserId('');
      setAddMemberRole('Developer');
      alert('Member added');
    } catch (err) {
      console.error(err);
      alert('Error adding member: ' + (err.message || err));
    } finally {
      setAddingMember(false);
    }
  }

  if (loading) return <p>Loading project...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!project) return <p>Project not found</p>;

  const members = project.members || [];

  const isTaskOverdue = (task) => {
    if (!task?.dueDate) return false;
    const due = new Date(task.dueDate);
    const now = new Date();
    return due < now && task.status !== 'DONE';
  };

  async function generateUserStories() {
    if (!token || !project?.description) return;
    setGeneratingStories(true);
    setStoryError(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/ai/generate-user-stories`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            projectId,
            projectDescription: project.description,
            maxStories: 3,
          }),
        }
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to generate user stories');
      }

      const data = await res.json();
      setUserStories(data.map((t, i) => ({ id: i, text: t })));
    } catch (err) {
      console.error('Error generating user stories:', err);
      setStoryError(err.message || 'Error generating stories');
    } finally {
      setGeneratingStories(false);
    }
  }
  function renderMetrics() {
    if (!metrics) return null;
    return (
      <div className={styles.metricsSection}>
        <div className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <div className={styles.metricLabel}>Total</div>
            <div className={styles.metricValue}>{metrics.total}</div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricLabel}>To Do</div>
            <div className={styles.metricValue}>{metrics.todo}</div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricLabel}>In Progress</div>
            <div className={styles.metricValue}>{metrics.inProgress}</div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricLabel}>Done</div>
            <div className={styles.metricValue}>{metrics.done}</div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricLabel}>Overdue</div>
            <div className={styles.metricValue}>{metrics.overdue}</div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricLabel}>Completion</div>
            <div className={styles.metricValue}>{metrics.completionPercent}%</div>
          </div>
        </div>

        <div className={styles.progressContainer}>
          <div
            className={styles.progressBar}
            style={{ width: `${metrics.completionPercent}%` }}
          ></div>
        </div>
      </div>
    );
  }


  return (
    <div className={styles.projectContainer}>
      <div className={styles.projectHeader}>
        <h1 className={styles.projectName}>{project.name}</h1>
        <p className={styles.projectDescription}>{project.description}</p>
        {renderMetrics()}
      </div>

      <section className={styles.tasksSection}>
        <h2 className={styles.tasksTitle}>Tasks</h2>
        <div className={styles.tasksGrid}>
          {tasks.length === 0 ? (
            <p style={{ color: '#6b7280', fontWeight: 500 }}>No tasks yet.</p>
          ) : (
            tasks.map((t) => {
              const assignedToMe = t.assignee?.id === session?.user?.id;
              const isEditing = editingTaskId === t.id;
              const overdue = isTaskOverdue(t);

              const showQuickStatus =
                (userRole === 'DEVELOPER' && assignedToMe) || canEdit;

              return (
                <div key={t.id} className={styles.taskCard}>
                  <div>
                    <strong className={styles.taskTitle}>{t.title}</strong>
                    <p className={styles.taskDescription}>{t.description}</p>
                    <p className={styles.taskAssignee}>
                      Assigned to: {t.assignee?.name || 'Unassigned'}
                    </p>
                    <p className={styles.taskDueDate}>
                      {t.dueDate ? `Due: ${new Date(t.dueDate).toLocaleDateString()}` : null}
                    </p>
                  </div>

                  <div className={styles.taskActions}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span className={`${styles.statusBadge} ${styles[`status${t.status}`]}`}>
                        {t.status.replace('_', ' ')}
                      </span>

                      {overdue && (
                        <span className={`${styles.statusBadge} ${styles.overdueBadge}`}>
                          Overdue
                        </span>
                      )}
                    </div>

                    {showQuickStatus && (
                      <select
                        value={t.status}
                        onChange={(e) => updateStatus(t.id, e.target.value)}
                        className={styles.selectStatus}
                        disabled={updatingStatusFor === t.id}
                        aria-label={`Change status for ${t.title}`}
                      >
                        <option value="TODO">TODO</option>
                        <option value="IN_PROGRESS">IN_PROGRESS</option>
                        <option value="DONE">DONE</option>
                      </select>
                    )}

                    {canEdit && !isEditing && (
                      <>
                        <button
                          className={styles.editButton}
                          onClick={() => startEdit(t)}
                        >
                          Edit
                        </button>
                        <button
                          className={styles.deleteButton}
                          onClick={() => deleteTask(t.id)}
                        >
                          Delete
                        </button>
                      </>
                    )}

                    {canEdit && isEditing && (
                      <form onSubmit={saveEdit} className={styles.inlineEditForm}>
                        <input
                          value={editValues.title}
                          onChange={(e) =>
                            setEditValues(prev => ({ ...prev, title: e.target.value }))
                          }
                          placeholder="Title"
                          required
                          className={styles.newTaskInput}
                        />
                        <textarea
                          value={editValues.description}
                          onChange={(e) =>
                            setEditValues(prev => ({ ...prev, description: e.target.value }))
                          }
                          placeholder="Description"
                          className={styles.newTaskTextarea}
                        />
                        <select
                          value={editValues.status}
                          onChange={(e) =>
                            setEditValues(prev => ({ ...prev, status: e.target.value }))
                          }
                          className={styles.selectStatus}
                        >
                          <option value="TODO">To Do</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="DONE">Done</option>
                        </select>

                        <select
                          value={editValues.assigneeId ?? 'null'}
                          onChange={(e) =>
                            setEditValues(prev => ({
                              ...prev,
                              assigneeId: e.target.value === 'null' ? null : e.target.value,
                            }))
                          }
                          className={styles.selectStatus}
                        >
                          <option value="null">Unassigned</option>
                          {members.map(m => (
                            <option key={m.id} value={m.user?.id ?? m.user?.email ?? m.id}>
                              {m.user?.name || m.user?.email || m.user?.id}
                            </option>
                          ))}
                        </select>

                        <input
                          type="date"
                          value={editValues.dueDate}
                          onChange={(e) =>
                            setEditValues(prev => ({ ...prev, dueDate: e.target.value }))
                          }
                          className={styles.newTaskInput}
                        />

                        <div className={styles.editActions}>
                          <button type="submit" className={styles.saveButton}>Save</button>
                          <button type="button" onClick={cancelEdit} className={styles.cancelButton}>Cancel</button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Manager/Admin: Create form */}
      {canEdit && (
        <form onSubmit={createTask} className={styles.addTaskForm}>
          <h3>Add Task</h3>
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Title"
            required
            className={styles.newTaskInput}
          />
          <textarea
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Description"
            className={styles.newTaskTextarea}
          />
          <select
            value={newAssigneeId ?? 'null'}
            onChange={(e) =>
              setNewAssigneeId(e.target.value === 'null' ? null : e.target.value)
            }
            className={styles.selectStatus}
          >
            <option value="null">Unassigned</option>
            {members.map(m => (
              <option key={m.id} value={m.user?.id ?? m.user?.email ?? m.id}>
                {m.user?.name || m.user?.email || m.user?.id}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={newDueDate}
            onChange={(e) => setNewDueDate(e.target.value)}
            className={styles.newTaskInput}
          />

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" className={styles.addTaskButton}>Add Task</button>
            <button
              type="button"
              onClick={() => {
                setNewTitle('');
                setNewDescription('');
                setNewAssigneeId(null);
                setNewDueDate('');
              }}
              className={styles.cancelButton}
            >
              Reset
            </button>
          </div>
        </form>
      )}

      <section className={styles.storiesSection}>
        <h2 className={styles.storiesTitle}>User Stories</h2>

        <div className={styles.storiesActions}>
          <button
            className={styles.generateStoriesButton}
            onClick={generateUserStories}
            disabled={generatingStories}
          >
            {generatingStories ? 'Generating…' : 'Generate User Stories'}
          </button>
        </div>

        {storyError && <p className={styles.storyError}>Error: {storyError}</p>}

        <ul className={styles.storiesList}>
          {userStories.slice(-3).map((s) => (
            <li key={s.id} className={styles.storyItem}>
              {s.text}
            </li>
          ))}
        </ul>
      </section>

      {/* Manager/Admin: Add member form */}
      {canEdit && (
        <form onSubmit={addMember} className={styles.addTaskForm} style={{ marginTop: 12 }}>
          <h3>Add Member</h3>
          <p style={{ margin: 0, color: '#6b7280', fontSize: 13 }}>Provide existing user id (or email) to add to project</p>
          <select
            value={addMemberUserId}
            onChange={(e) => setAddMemberUserId(e.target.value)}
            required
            className={styles.selectStatus}
            style={{ marginTop: 8 }}
          >
            <option value="">Select user to add</option>
            {availableUsers.map(u => (
              <option key={u.id} value={u.id}>
                {u.name || u.email} ({u.role})
              </option>
            ))}
          </select>

          <select
            value={addMemberRole}
            onChange={(e) => setAddMemberRole(e.target.value)}
            className={styles.selectStatus}
          >
            <option value="Developer">Developer</option>
            <option value="Manager">Manager</option>
            <option value="Admin">Admin</option>
          </select>

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" className={styles.addTaskButton} disabled={addingMember}>
              {addingMember ? 'Adding…' : 'Add Member'}
            </button>
            <button
              type="button"
              onClick={() => {
                setAddMemberUserId('');
                setAddMemberRole('Developer');
              }}
              className={styles.cancelButton}
            >
              Reset
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
