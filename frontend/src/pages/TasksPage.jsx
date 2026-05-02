import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { format, isPast } from 'date-fns';
import { useAuth } from '../context/AuthContext';

const statusLabel = { todo: 'To Do', inprogress: 'In Progress', done: 'Done' };

export default function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', priority: '' });

  useEffect(() => {
    const params = new URLSearchParams({ assignee: user._id });
    if (filter.status) params.set('status', filter.status);
    if (filter.priority) params.set('priority', filter.priority);
    api.get(`/tasks?${params}`).then(r => setTasks(r.data.tasks)).finally(() => setLoading(false));
  }, [filter]);

  const handleStatusUpdate = async (taskId, status) => {
    const res = await api.patch(`/tasks/${taskId}`, { status });
    setTasks(t => t.map(x => x._id === taskId ? res.data.task : x));
  };

  if (loading) return <div className="loading-screen" style={{height:'60vh'}}><div className="spinner"/></div>;

  const overdue = tasks.filter(t => t.dueDate && isPast(new Date(t.dueDate)) && t.status !== 'done');

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Tasks</h1>
          <p className="page-subtitle">{tasks.length} assigned · {overdue.length} overdue</p>
        </div>
      </div>

      <div style={{display:'flex', gap:10, marginBottom:24, flexWrap:'wrap'}}>
        <select className="form-select" style={{width:'auto'}} value={filter.status}
          onChange={e => setFilter(p => ({...p, status: e.target.value}))}>
          <option value="">All statuses</option>
          <option value="todo">To Do</option>
          <option value="inprogress">In Progress</option>
          <option value="done">Done</option>
        </select>
        <select className="form-select" style={{width:'auto'}} value={filter.priority}
          onChange={e => setFilter(p => ({...p, priority: e.target.value}))}>
          <option value="">All priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {tasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">☑</div>
          <h3>No tasks assigned</h3>
          <p>Tasks assigned to you will appear here</p>
        </div>
      ) : (
        <div className="card" style={{padding: 0, overflow: 'hidden'}}>
          <table className="tasks-table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Project</th>
                <th>Priority</th>
                <th>Due date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(task => {
                const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'done';
                return (
                  <tr key={task._id} className={isOverdue ? 'overdue-row' : ''}>
                    <td>
                      <div className="task-title-cell">
                        <span className="task-title-text">{task.title}</span>
                        {task.description && <span className="task-desc-preview">{task.description}</span>}
                      </div>
                    </td>
                    <td>
                      <Link to={`/projects/${task.project?._id}`} className="project-link"
                        style={{color: task.project?.color || 'var(--accent)'}}>
                        {task.project?.name}
                      </Link>
                    </td>
                    <td><span className={`badge badge-${task.priority}`}>{task.priority}</span></td>
                    <td>
                      {task.dueDate ? (
                        <span style={{fontSize:13, color: isOverdue ? 'var(--danger)' : 'var(--text-2)'}}>
                          {isOverdue ? '⚠ ' : ''}{format(new Date(task.dueDate), 'MMM d, yyyy')}
                        </span>
                      ) : <span style={{fontSize:13, color:'var(--text-2)'}}>—</span>}
                    </td>
                    <td>
                      <select className="status-select"
                        value={task.status} onChange={e => handleStatusUpdate(task._id, e.target.value)}>
                        <option value="todo">To Do</option>
                        <option value="inprogress">In Progress</option>
                        <option value="done">Done</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
