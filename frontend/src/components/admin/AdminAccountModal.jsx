import { useEffect, useState } from 'react';

const ROLE_OPTIONS = ['user', 'admin'];

export default function AdminAccountModal({ isOpen, mode, account, onClose, onSubmit }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (mode === 'edit' && account) {
      setUsername(account.username || '');
      setRole(account.role || 'user');
      setPassword('');
      return;
    }

    setUsername('');
    setPassword('');
    setRole('user');
  }, [isOpen, mode, account]);

  if (!isOpen) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedUsername = username.trim();
    if (!trimmedUsername) return;

    if (mode === 'create' && !password.trim()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        username: trimmedUsername,
        role,
        ...(mode === 'create' || password.trim() ? { password: password.trim() } : {}),
      };

      const result = await onSubmit(payload, mode);
      if (result) {
        setUsername('');
        setPassword('');
        setRole('user');
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setUsername('');
    setPassword('');
    setRole('user');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleCancel} role="presentation">
      <div
        className="modal-card"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-labelledby="account-modal-title"
      >
        <h2 id="account-modal-title">{mode === 'create' ? 'Create Account' : 'Edit Account'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="accountUsername">Username <span className="danger-text">*</span></label>
            <input
              id="accountUsername"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Enter username"
              required
              maxLength={50}
            />
          </div>

          <div className="input-group">
            <label htmlFor="accountRole">Role</label>
            <select id="accountRole" value={role} onChange={(event) => setRole(event.target.value)}>
              {ROLE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option === 'admin' ? 'Admin' : 'User'}
                </option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label htmlFor="accountPassword">
              {mode === 'create' ? 'Password' : 'New Password'}
              {mode === 'create' && <span className="danger-text"> *</span>}
            </label>
            <input
              id="accountPassword"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={mode === 'create' ? 'Enter password' : 'Leave blank to keep current password'}
              minLength={6}
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={handleCancel} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? (mode === 'create' ? 'Creating...' : 'Saving...') : mode === 'create' ? 'Create Account' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
