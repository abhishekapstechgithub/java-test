import React, { useState, useEffect, useCallback } from 'react';
import TaskCard from './components/TaskCard';
import TaskForm from './components/TaskForm';
import { getTasks, createTask, updateTask, deleteTask } from './api/taskApi';

export default function App() {
  const [tasks, setTasks]         = useState([]);
  const [editTask, setEditTask]   = useState(null);
  const [filter, setFilter]       = useState('ALL');
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await getTasks();
      setTasks(data);
    } catch {
      setError('Could not load tasks. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleCreate = async (task) => {
    await createTask(task);
    fetchTasks();
  };

  const handleUpdate = async (task) => {
    await updateTask(editTask.id, task);
    setEditTask(null);
    fetchTasks();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this task?')) {
      await deleteTask(id);
      fetchTasks();
    }
  };

  const handleStatusChange = async (id, status) => {
    const task = tasks.find(t => t.id === id);
    await updateTask(id, { ...task, status });
    fetchTasks();
  };

  const displayed = filter === 'ALL' ? tasks : tasks.filter(t => t.status === filter);
  const counts = tasks.reduce((acc, t) => { acc[t.status] = (acc[t.status]||0)+1; return acc; }, {});

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Task Manager</h1>
      <p style={{ color: '#6b7280', marginBottom: 20, fontSize: 14 }}>
        Spring Boot + React + Docker + Jenkins CI/CD
      </p>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        {[['TODO','To Do','#dbeafe'],['IN_PROGRESS','In Progress','#fef9c3'],['DONE','Done','#dcfce7']].map(([k,l,bg]) => (
          <div key={k} style={{ flex:1, background: bg, borderRadius: 8, padding: '10px 14px' }}>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{counts[k]||0}</div>
            <div style={{ fontSize: 12, color: '#374151' }}>{l}</div>
          </div>
        ))}
      </div>

      <TaskForm
        onSubmit={editTask ? handleUpdate : handleCreate}
        editTask={editTask}
        onCancel={() => setEditTask(null)}
      />

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {['ALL','TODO','IN_PROGRESS','DONE'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            background: filter===f ? '#3b82f6' : '#f3f4f6',
            color: filter===f ? '#fff' : '#374151',
            border: 'none', borderRadius: 6, padding: '5px 12px',
            fontSize: 12, cursor: 'pointer', fontWeight: 500,
          }}>{f.replace('_',' ')}</button>
        ))}
      </div>

      {error && <p style={{ color: '#ef4444' }}>{error}</p>}
      {loading ? <p style={{ color: '#9ca3af' }}>Loading...</p> : displayed.length === 0
        ? <p style={{ color: '#9ca3af' }}>No tasks found.</p>
        : displayed.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            onEdit={setEditTask}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
          />
        ))
      }
    </div>
  );
}
