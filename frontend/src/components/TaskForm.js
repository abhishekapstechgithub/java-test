import React, { useState, useEffect } from 'react';

export default function TaskForm({ onSubmit, editTask, onCancel }) {
  const [title, setTitle]       = useState('');
  const [description, setDesc]  = useState('');
  const [status, setStatus]     = useState('TODO');

  useEffect(() => {
    if (editTask) {
      setTitle(editTask.title);
      setDesc(editTask.description || '');
      setStatus(editTask.status);
    } else {
      setTitle(''); setDesc(''); setStatus('TODO');
    }
  }, [editTask]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({ title, description, status });
    setTitle(''); setDesc(''); setStatus('TODO');
  };

  return (
    <form onSubmit={handleSubmit} style={{
      background: '#f9fafb', borderRadius: 10, padding: 18,
      marginBottom: 20, border: '1px solid #e5e7eb',
    }}>
      <h3 style={{ margin: '0 0 12px', fontSize: 15 }}>
        {editTask ? 'Edit Task' : 'New Task'}
      </h3>
      <input
        value={title} onChange={e => setTitle(e.target.value)}
        placeholder="Task title *" required
        style={inputStyle}
      />
      <textarea
        value={description} onChange={e => setDesc(e.target.value)}
        placeholder="Description (optional)"
        rows={2} style={{ ...inputStyle, resize: 'vertical' }}
      />
      {editTask && (
        <select value={status} onChange={e => setStatus(e.target.value)} style={inputStyle}>
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="DONE">Done</option>
        </select>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" style={{
          background: '#3b82f6', color: '#fff', border: 'none',
          borderRadius: 7, padding: '8px 18px', cursor: 'pointer', fontWeight: 500,
        }}>
          {editTask ? 'Update' : 'Add Task'}
        </button>
        {editTask && (
          <button type="button" onClick={onCancel} style={{
            background: '#6b7280', color: '#fff', border: 'none',
            borderRadius: 7, padding: '8px 18px', cursor: 'pointer', fontWeight: 500,
          }}>Cancel</button>
        )}
      </div>
    </form>
  );
}

const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  marginBottom: 10, padding: '8px 10px',
  border: '1px solid #d1d5db', borderRadius: 7, fontSize: 14,
};
