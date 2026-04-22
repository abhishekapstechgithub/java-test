import React from 'react';

const STATUS_COLORS = {
  TODO:        { bg: '#e8f0fe', text: '#1a56db', label: 'To Do' },
  IN_PROGRESS: { bg: '#fef3c7', text: '#92400e', label: 'In Progress' },
  DONE:        { bg: '#d1fae5', text: '#065f46', label: 'Done' },
};

export default function TaskCard({ task, onEdit, onDelete, onStatusChange }) {
  const color = STATUS_COLORS[task.status] || STATUS_COLORS.TODO;

  return (
    <div style={{
      border: '1px solid #e5e7eb',
      borderRadius: 10,
      padding: '14px 16px',
      marginBottom: 12,
      background: '#fff',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{task.title}</h3>
          {task.description && (
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>{task.description}</p>
          )}
        </div>
        <span style={{
          background: color.bg,
          color: color.text,
          borderRadius: 20,
          padding: '3px 10px',
          fontSize: 12,
          fontWeight: 500,
          whiteSpace: 'nowrap',
        }}>{color.label}</span>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <select
          value={task.status}
          onChange={e => onStatusChange(task.id, e.target.value)}
          style={{ fontSize: 12, borderRadius: 6, border: '1px solid #d1d5db', padding: '2px 6px' }}
        >
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="DONE">Done</option>
        </select>
        <button onClick={() => onEdit(task)} style={btnStyle('#3b82f6')}>Edit</button>
        <button onClick={() => onDelete(task.id)} style={btnStyle('#ef4444')}>Delete</button>
      </div>
    </div>
  );
}

const btnStyle = (bg) => ({
  background: bg, color: '#fff', border: 'none',
  borderRadius: 6, padding: '4px 12px', fontSize: 12,
  cursor: 'pointer', fontWeight: 500,
});
