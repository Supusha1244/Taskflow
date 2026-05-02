import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { format, isPast } from 'date-fns';
import './ProjectDetailPage.css';

const STATUS_COLS = [
  { key: 'todo', label: 'To Do' },
  { key: 'inprogress', label: 'In Progress' },
  { key: 'done', label: 'Done' },
];

function TaskCard({ task, isAdmin, members, onUpdate, onDelete }) {
  const [dragging, setDragging] = useState(false);

  const cycleStatus = () => {
    const order = ['todo', 'inprogress', 'done'];
    const next = order[(order.indexOf(task.status) + 1) % 3];
    onUpdate(task._id, { status: next });
  };

  return (
    <div className={`task-card ${dragging ? 'dragging' : ''}`}
      draggable onDragStart={() => setDragging(true)} onDragEnd={() => setDragging(false)}>
      <div className="task-card-header">
        <span className={`badge badge-${task.priority}`}>{task.priority}</span>
        {isAdmin && <button className="task-delete" onClick={() => onDelete(task._id)}>×</button>}
      </div>
      <div className="task-card-title">{task.title}</div>
      {task.description && <p className="task-card-desc">{task.description}</p>}
      <div className="task-card-footer">
        {task.assignee && (
          <div className="task-assignee" title={task.assignee.name}>
            {task.assignee.name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)}
          </div>
        )}
        {task.dueDate && (
          <span className={`task-card-due ${isPast(new Date(task.dueDate)) && task.status !== 'done' ? 'overdue' : ''}`}>
            {format(new Date(task.dueDate), 'MMM d')}
          </span>
        )}
        <button className="btn btn-ghost btn-sm" style={{marginLeft:'auto'}} onClick={cycleStatus}>
          →
        </button>
      </div>
    </div>
  );
}

function CreateTaskModal({ project, members, onClose, onCreate }) {
  const [form, setForm] = useState({ title: '', description: '', assignee: '', priority: 'medium', dueDate: '', project: project._id });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, assignee: form.assignee || undefined, dueDate: form.dueDate || undefined };
      const res = await api.post('/tasks', payload);
      onCreate(res.data.task);
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create task');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">New task</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Title</label>
            <input className="form-input" value={form.title}
              onChange={e => setForm(p=>({...p, title: e.target.value}))} placeholder="Task title" required />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" value={form.description}
              onChange={e => setForm(p=>({...p, description: e.target.value}))} placeholder="Optional details..." />
          </div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
            <div className="form-group">
              <label className="form-label">Assignee</label>
              <select className="form-select" value={form.assignee} onChange={e => setForm(p=>({...p, assignee: e.target.value}))}>
                <option value="">Unassigned</option>
                {members.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-select" value={form.priority} onChange={e => setForm(p=>({...p, priority: e.target.value}))}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Due date</label>
            <input className="form-input" type="date" value={form.dueDate}
              onChange={e => setForm(p=>({...p, dueDate: e.target.value}))} />
          </div>
          <div style={{display:'flex', gap:10, justifyContent:'flex-end'}}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddMemberModal({ onClose, onAdd }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try { await onAdd(email); onClose(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to add member'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">Add member</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Member's email</label>
            <input className="form-input" type="email" value={email}
              onChange={e => setEmail(e.target.value)} placeholder="colleague@company.com" required />
          </div>
          <div style={{display:'flex', gap:10, justifyContent:'flex-end'}}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Adding...' : 'Add member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [dragOver, setDragOver] = useState(null);
  const [dragTaskId, setDragTaskId] = useState(null);

  const isAdmin = project?.admin?._id === user._id;

  useEffect(() => {
    Promise.all([
      api.get(`/projects/${id}`),
      api.get(`/tasks?projectId=${id}`)
    ]).then(([pr, tr]) => {
      setProject(pr.data.project);
      setTasks(tr.data.tasks);
    }).catch(() => navigate('/projects')).finally(() => setLoading(false));
  }, [id]);

  const handleUpdateTask = async (taskId, update) => {
    const res = await api.patch(`/tasks/${taskId}`, update);
    setTasks(t => t.map(x => x._id === taskId ? res.data.task : x));
  };

  const handleDeleteTask = async taskId => {
    if (!window.confirm('Delete this task?')) return;
    await api.delete(`/tasks/${taskId}`);
    setTasks(t => t.filter(x => x._id !== taskId));
  };

  const handleAddMember = async email => {
    const res = await api.post(`/projects/${id}/members`, { email });
    setProject(res.data.project);
  };

  const handleRemoveMember = async userId => {
    if (!window.confirm('Remove this member?')) return;
    const res = await api.delete(`/projects/${id}/members/${userId}`);
    setProject(res.data.project);
  };

  const handleDeleteProject = async () => {
    if (!window.confirm('Delete this project and all its tasks?')) return;
    await api.delete(`/projects/${id}`);
    navigate('/projects');
  };

  const handleDrop = async (status) => {
    if (dragTaskId) {
      await handleUpdateTask(dragTaskId, { status });
      setDragTaskId(null); setDragOver(null);
    }
  };

  if (loading) return <div className="loading-screen" style={{height:'60vh'}}><div className="spinner"/></div>;
  if (!project) return null;

  const tasksByStatus = STATUS_COLS.reduce((acc, col) => {
    acc[col.key] = tasks.filter(t => t.status === col.key);
    return acc;
  }, {});

  return (
    <div>
      <div className="page-header">
        <div style={{display:'flex', alignItems:'center', gap:12}}>
          <div className="project-badge" style={{background: project.color || '#7c6af7'}} />
          <div>
            <h1 className="page-title">{project.name}</h1>
            {project.description && <p className="page-subtitle">{project.description}</p>}
          </div>
        </div>
        <div style={{display:'flex', gap:8}}>
          {isAdmin && (
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowMemberModal(true)}>+ Member</button>
              <button className="btn btn-primary btn-sm" onClick={() => setShowTaskModal(true)}>+ Task</button>
              <button className="btn btn-danger btn-sm" onClick={handleDeleteProject}>Delete</button>
            </>
          )}
        </div>
      </div>

      <div className="members-bar">
        <span className="members-label">Team:</span>
        {project.members.map(m => (
          <div key={m._id} className="member-chip" title={m.name}>
            <div className="member-chip-avatar">
              {m.name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)}
            </div>
            <span>{m.name}</span>
            {isAdmin && m._id !== project.admin._id && (
              <button className="member-remove" onClick={() => handleRemoveMember(m._id)}>×</button>
            )}
            {m._id === project.admin._id && <span style={{fontSize:10,opacity:0.6}}>admin</span>}
          </div>
        ))}
      </div>

      <div className="kanban-board">
        {STATUS_COLS.map(col => (
          <div key={col.key}
            className={`kanban-col ${dragOver === col.key ? 'drag-over' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragOver(col.key); }}
            onDragLeave={() => setDragOver(null)}
            onDrop={() => handleDrop(col.key)}>
            <div className="kanban-col-header">
              <span className="kanban-col-title">{col.label}</span>
              <span className="kanban-col-count">{tasksByStatus[col.key]?.length}</span>
            </div>
            <div className="kanban-tasks">
              {tasksByStatus[col.key]?.map(task => (
                <div key={task._id} draggable onDragStart={() => setDragTaskId(task._id)}>
                  <TaskCard task={task} isAdmin={isAdmin} members={project.members}
                    onUpdate={handleUpdateTask} onDelete={handleDeleteTask} />
                </div>
              ))}
              {isAdmin && (
                <button className="add-task-btn" onClick={() => setShowTaskModal(true)}>+ Add task</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showTaskModal && (
        <CreateTaskModal project={project} members={project.members}
          onClose={() => setShowTaskModal(false)}
          onCreate={t => setTasks(prev => [t, ...prev])} />
      )}
      {showMemberModal && (
        <AddMemberModal onClose={() => setShowMemberModal(false)} onAdd={handleAddMember} />
      )}
    </div>
  );
}
