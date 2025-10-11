// components/NotesManager.js
import { useState, useEffect } from 'react';
import { useDatabase } from '../hooks/useDatabase';

export default function NotesManager() {
  const { isReady, isLoading, error, addNote, getNotes, deleteNote, updateNote } = useDatabase();
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState(''); // 'success', 'error', 'info'

  // Load notes when the component mounts
  useEffect(() => {
    if (isReady) {
      loadNotes();
    }
  }, [isReady]);

  const loadNotes = async () => {
    try {
      const notesList = await getNotes();
      setNotes(notesList);
    } catch (err) {
      showStatus('Failed to load notes: ' + err.message, 'error');
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      showStatus('Please enter both title and content', 'error');
      return;
    }
    
    try {
      await addNote(title, content);
      setTitle('');
      setContent('');
      showStatus('Note added successfully', 'success');
      loadNotes();
    } catch (err) {
      showStatus('Failed to add note: ' + err.message, 'error');
    }
  };

  const handleDeleteNote = async (id) => {
    try {
      await deleteNote(id);
      showStatus('Note deleted successfully', 'success');
      loadNotes();
    } catch (err) {
      showStatus('Failed to delete note: ' + err.message, 'error');
    }
  };

  const handleEditNote = (note) => {
    setEditingId(note.id);
    setTitle(note.title);
    setContent(note.content);
  };

  const handleUpdateNote = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      showStatus('Please enter both title and content', 'error');
      return;
    }
    
    try {
      await updateNote(editingId, title, content);
      setEditingId(null);
      setTitle('');
      setContent('');
      showStatus('Note updated successfully', 'success');
      loadNotes();
    } catch (err) {
      showStatus('Failed to update note: ' + err.message, 'error');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setTitle('');
    setContent('');
  };

  const showStatus = (message, type) => {
    setStatusMessage(message);
    setStatusType(type);
    
    // Hide the status after 3 seconds
    setTimeout(() => {
      setStatusMessage('');
      setStatusType('');
    }, 3000);
  };

  if (!isReady) {
    return <div className="loading">Initializing database...</div>;
  }

  return (
    <div className="notes-manager">
      <h1>SQLite Notes Manager</h1>
      
      {statusMessage && (
        <div className={`status ${statusType}`}>
          {statusMessage}
        </div>
      )}
      
      {error && (
        <div className="error">
          Error: {error}
        </div>
      )}
      
      <div className="note-form">
        <h2>{editingId ? 'Edit Note' : 'Add New Note'}</h2>
        <form onSubmit={editingId ? handleUpdateNote : handleAddNote}>
          <div className="form-group">
            <label htmlFor="title">Title</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter note title"
            />
          </div>
          <div className="form-group">
            <label htmlFor="content">Content</label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter note content"
              rows={4}
            />
          </div>
          <div className="form-actions">
            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Processing...' : (editingId ? 'Update Note' : 'Add Note')}
            </button>
            {editingId && (
              <button type="button" onClick={handleCancelEdit}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
      
      <div className="notes-list">
        <h2>Notes ({notes.length})</h2>
        {notes.length === 0 ? (
          <p>No notes found. Add your first note above!</p>
        ) : (
          <div className="notes-grid">
            {notes.map((note) => (
              <div key={note.id} className="note-card">
                <h3>{note.title}</h3>
                <p>{note.content}</p>
                <div className="note-meta">
                  <span>{new Date(note.created_at).toLocaleString()}</span>
                  <div className="note-actions">
                    <button onClick={() => handleEditNote(note)}>Edit</button>
                    <button onClick={() => handleDeleteNote(note.id)}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <style jsx>{`
        .notes-manager {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        .loading {
          text-align: center;
          padding: 20px;
          font-size: 18px;
        }
        
        .status {
          padding: 10px;
          margin-bottom: 20px;
          border-radius: 4px;
        }
        
        .status.success {
          background-color: #d4edda;
          color: #155724;
        }
        
        .status.error {
          background-color: #f8d7da;
          color: #721c24;
        }
        
        .status.info {
          background-color: #d1ecf1;
          color: #0c5460;
        }
        
        .error {
          padding: 10px;
          margin-bottom: 20px;
          background-color: #f8d7da;
          color: #721c24;
          border-radius: 4px;
        }
        
        .note-form {
          background-color: #f9f9f9;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
        }
        
        .form-group {
          margin-bottom: 15px;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: 500;
        }
        
        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }
        
        .form-actions {
          display: flex;
          gap: 10px;
        }
        
        button {
          background-color: #4a6cf7;
          color: white;
          border: none;
          padding: 10px 15px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: background-color 0.2s;
        }
        
        button:hover {
          background-color: #3a5ce5;
        }
        
        button:disabled {
          background-color: #cccccc;
          cursor: not-allowed;
        }
        
        button[type="button"] {
          background-color: #6c757d;
        }
        
        button[type="button"]:hover {
          background-color: #5a6268;
        }
        
        .notes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }
        
        .note-card {
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 15px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .note-card h3 {
          margin-top: 0;
          margin-bottom: 10px;
        }
        
        .note-card p {
          margin-bottom: 15px;
          white-space: pre-wrap;
        }
        
        .note-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          color: #666;
        }
        
        .note-actions {
          display: flex;
          gap: 5px;
        }
        
        .note-actions button {
          padding: 5px 10px;
          font-size: 12px;
        }
      `}</style>
    </div>
  );
}
