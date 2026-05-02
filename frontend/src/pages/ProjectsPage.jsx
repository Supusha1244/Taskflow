import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './ProjectsPage.css';

const COLORS = ['#7c6af7','#4fa4f8','#3ecf8e','#f5a623','#f04444','#e45ce8','#f0a070'];

function CreateProjectModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ name: '', description: '', color: COLORS[0] });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/projects', form);
      onCreate(res.data.project);
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">New project</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Project name</label>
            <input className="form-input" value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Website Redesign" required />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="What is this project about?" />
          </div>
          <div className="form-group">
            <label className="form-label">Color</label>
            <div className="color-picker">
              {COLORS.map(c => (
                <div key={c} className={`color-dot ${form.color === c ? 'selected' : ''}`}
                  style={{ background: c }} onClick={() => setForm(p => ({ ...p, color: c }))} />
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    api.get('/projects').then(r => setProjects(r.data.projects)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen" style={{height:'60vh'}}><div className="spinner"/></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New project</button>
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">⬡</div>
          <h3>No projects yet</h3>
          <p>Create your first project to start collaborating</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>Create project</button>
        </div>
      ) : (
        <div className="grid-2">
          {projects.map(project => (
            <Link key={project._id} to={`/projects/${project._id}`} className="project-card">
              <div className="project-color-bar" style={{ background: project.color || '#7c6af7' }} />
              <div className="project-card-body">
                <div className="project-card-header">
                  <div className="project-name">{project.name}</div>
                  {project.admin._id === user._id && <span className="admin-badge">Admin</span>}
                </div>
                {project.description && <p className="project-desc">{project.description}</p>}
                <div className="project-meta">
                  <div className="member-avatars">
                    {project.members.slice(0, 4).map(m => (
                      <div key={m._id} className="member-avatar" title={m.name}>
                        {m.name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)}
                      </div>
                    ))}
                    {project.members.length > 4 && (
                      <div className="member-avatar extra">+{project.members.length - 4}</div>
                    )}
                  </div>
                  <span className="project-date">
                    {new Date(project.createdAt).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showModal && (
        <CreateProjectModal
          onClose={() => setShowModal(false)}
          onCreate={p => setProjects(prev => [p, ...prev])}
        />
      )}
    </div>
  );
}
