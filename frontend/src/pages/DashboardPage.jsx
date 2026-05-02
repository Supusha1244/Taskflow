import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { format, isPast } from 'date-fns';
import './DashboardPage.css';

const StatCard = ({ label, value, color, icon }) => (
  <div className={`stat-card ${color}`}>
    <div className="stat-icon">{icon}</div>
    <div className="stat-value">{value}</div>
    <div className="stat-label">{label}</div>
  </div>
);

const statusLabel = { todo: 'To Do', inprogress: 'In Progress', done: 'Done' };
const priorityLabel = { low: 'Low', medium: 'Medium', high: 'High' };

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen" style={{height:'60vh'}}><div className="spinner" /></div>;

  const s = data?.statusStats || {};
  const p = data?.priorityStats || {};

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="page-subtitle">Here's what's happening with your projects</p>
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: 28 }}>
        <StatCard label="Total Tasks" value={data?.totalTasks || 0} color="purple" icon="☑" />
        <StatCard label="Projects" value={data?.totalProjects || 0} color="blue" icon="⬡" />
        <StatCard label="In Progress" value={s.inprogress || 0} color="amber" icon="◎" />
        <StatCard label="Overdue" value={data?.overdueCount || 0} color="red" icon="⚠" />
      </div>

      <div className="dash-grid">
        <div className="card">
          <h2 className="card-title">Status breakdown</h2>
          <div className="status-bars">
            {[['todo','To Do','#6666b0'],['inprogress','In Progress','#4fa4f8'],['done','Done','#3ecf8e']].map(([key, label, color]) => {
              const count = s[key] || 0;
              const pct = data?.totalTasks ? Math.round(count / data.totalTasks * 100) : 0;
              return (
                <div key={key} className="status-bar-row">
                  <div className="status-bar-meta">
                    <span>{label}</span><span style={{color}}>{count}</span>
                  </div>
                  <div className="status-bar-track">
                    <div className="status-bar-fill" style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <h2 className="card-title">Priority distribution</h2>
          <div className="priority-doughnuts">
            {[['high', '#f04444'], ['medium', '#f5a623'], ['low', '#3ecf8e']].map(([key, color]) => {
              const count = p[key] || 0;
              const pct = data?.totalTasks ? Math.round(count / data.totalTasks * 100) : 0;
              return (
                <div key={key} className="priority-item">
                  <div className="priority-circle" style={{ background: `conic-gradient(${color} ${pct * 3.6}deg, var(--surface-3) 0)` }}>
                    <span>{pct}%</span>
                  </div>
                  <div className="priority-name" style={{ color }}>{priorityLabel[key]}</div>
                  <div className="priority-count">{count} tasks</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 className="card-title" style={{ marginBottom: 0 }}>Recent tasks</h2>
          <Link to="/tasks" className="btn btn-ghost btn-sm">View all →</Link>
        </div>
        {data?.recentTasks?.length === 0 ? (
          <div className="empty-state" style={{ padding: '30px 0' }}>
            <p>No tasks yet. Create a project to get started.</p>
          </div>
        ) : (
          <div className="task-list">
            {data?.recentTasks?.map(task => (
              <div key={task._id} className="task-row">
                <div className="task-row-left">
                  <span className={`badge badge-${task.status}`}>{statusLabel[task.status]}</span>
                  <span className="task-row-title">{task.title}</span>
                  <span className="task-row-project" style={{ color: task.project?.color || 'var(--accent)' }}>
                    {task.project?.name}
                  </span>
                </div>
                <div className="task-row-right">
                  {task.dueDate && (
                    <span className={`task-due ${isPast(new Date(task.dueDate)) && task.status !== 'done' ? 'overdue' : ''}`}>
                      {format(new Date(task.dueDate), 'MMM d')}
                    </span>
                  )}
                  <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {data?.tasksByUser?.length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <h2 className="card-title">Team workload</h2>
          <div className="workload-list">
            {data.tasksByUser.map(u => (
              <div key={u._id} className="workload-row">
                <div className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>
                  {u.user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <span className="workload-name">{u.user.name}</span>
                <div className="workload-bar-track">
                  <div className="workload-bar-fill" style={{ width: `${Math.min(u.count * 10, 100)}%` }} />
                </div>
                <span className="workload-count">{u.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
