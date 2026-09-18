// Imports
import { useState } from 'react';




const CATEGORY_OPTIONS = ['General', 'Technical', 'Billing', 'Bug Report', 'Other'];




// Modal form for users to open a new support ticket
export default function CreateTicketModal({ isOpen, onClose, onSubmitTicket }) {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;                                             // don't mount DOM when closed



  // Submit new ticket
  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmedSubject = subject.trim();
    const trimmedDescription = description.trim();
    if (!trimmedSubject || !trimmedDescription) return;

    setIsSubmitting(true);
    try {
      const newTicket = await onSubmitTicket(trimmedSubject, category, trimmedDescription);
      if (newTicket) {
        setSubject('');
        setDescription('');
        setCategory('General');
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };



  // Reset form and close
  const handleCancel = () => {
    setSubject('');
    setDescription('');
    setCategory('General');
    onClose();
  };



  return (
    <div className="modal-overlay" onClick={handleCancel} role="presentation">
      <div
        className="modal-card"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-labelledby="create-ticket-title"
      >                                                                 {/* keep clicks inside modal */}
        <h2 id="create-ticket-title">Open a New Ticket</h2>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="ticketSubject">
              Subject <span className="danger-text">*</span>
            </label>
            <input
              type="text"
              id="ticketSubject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="Briefly describe your issue"
              required
              maxLength={200}
            />
          </div>
          <div className="input-group">
            <label htmlFor="ticketDescription">
              Description <span className="danger-text">*</span>
            </label>
            <textarea
              id="ticketDescription"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe your issue in detail"
              required
              rows={4}
              maxLength={4000}
            />
          </div>
          <div className="input-group">
            <label htmlFor="ticketCategory">Category</label>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="modal-actions">
            <button type="button" onClick={handleCancel} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              Submit Ticket
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
