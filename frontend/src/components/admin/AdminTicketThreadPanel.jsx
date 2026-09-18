// Imports
import { useEffect, useState } from 'react';
import { fetchTicketLog } from '../../api/ticketApi.js';                 // admin PDF export payload
import { useAuth } from '../../hooks/useAuth.jsx';
import { formatTimestamp } from '../../utils/formatters.js';
import { downloadTicketLogPdf } from '../../utils/ticketLogPdf.js';




// Select options for classification fields
const CATEGORY_OPTIONS = ['General', 'Technical', 'Billing', 'Bug Report', 'Other'];
const STATUS_OPTIONS = ['Open', 'In Progress', 'On-Hold', 'Closed'];
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Urgent'];




// Format resolution time (minutes → h/m)
function formatTimeTaken(minutes) {
  if (minutes == null) return null;
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}




// Fixed 2×2 meta grid above admin chat
export default function AdminTicketThreadPanel({
  ticket,
  currentUserId,
  onAssignToMe,
  onAdminSubmit,
  isSubmitting = false,
}) {
  const [category, setCategory] = useState('General');
  const [status, setStatus] = useState('Open');
  const [priority, setPriority] = useState('Medium');
  const [replyType, setReplyType] = useState('question');               // question | solution
  const [responseText, setResponseText] = useState('');
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const { handleUnauthorized } = useAuth();



  // Sync form fields when ticket changes
  useEffect(() => {
    if (!ticket) return;
    setCategory(ticket.category || 'General');
    setStatus(ticket.status || 'Open');
    setPriority(ticket.priority || 'Medium');
    setResponseText('');
  }, [ticket?.id, ticket?.category, ticket?.status, ticket?.priority]);



  if (!ticket) {
    return (
      <div className="admin-meta-grid admin-meta-grid--empty">
        <p>Select a ticket from the list.</p>
      </div>
    );
  }

  const isAssignedToCurrentAdmin = Number(ticket.assigned_admin_id) === Number(currentUserId);
  const isClosed = ticket.status === 'Closed';
  const canRespond = isAssignedToCurrentAdmin && !isClosed;



  // Submit classification fields + response text
  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmed = responseText.trim();
    if (!trimmed) return;

    await onAdminSubmit({
      category,
      status,
      priority,
      responseText: trimmed,
      replyType,
    });
    setResponseText('');
  };



  // Download PDF
  const handleDownloadPdf = async () => {
    setIsPdfLoading(true);
    try {
      const logData = await fetchTicketLog(ticket.id, handleUnauthorized);
      await downloadTicketLogPdf(logData);
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('Failed to generate PDF log. Please try again.');
    } finally {
      setIsPdfLoading(false);
    }
  };



  return (
    <div className="admin-meta-grid">
      <section className="admin-meta-cell admin-meta-cell--credentials" aria-label="Ticket credentials">
        <h3 className="admin-meta-cell__title">Ticket credentials</h3>
        <p>
          <strong>User:</strong> {ticket.user_username}
        </p>
        <p>
          <strong>User ID:</strong> {ticket.user_id}
        </p>
        <p>
          <strong>Submitted:</strong> {formatTimestamp(ticket.created_at)}
        </p>
        <p className="admin-meta-cell__agent">
          <strong>Admin:</strong> {ticket.admin_username || 'Unassigned'}
          {!isAssignedToCurrentAdmin && !isClosed && (
            <button type="button" className="btn-assign btn-assign--inline" onClick={onAssignToMe}>
              Assign to me
            </button>
          )}
        </p>
        {ticket.closed_at && (
          <p>
            <strong>Closed:</strong> {formatTimestamp(ticket.closed_at)}
            {formatTimeTaken(ticket.time_taken_minutes) && (
              <> · {formatTimeTaken(ticket.time_taken_minutes)}</>
            )}
          </p>
        )}
        <div className="detail-group detail-group--log">                  {/* PDF conversation log */}
          <button
            type="button"
            className="btn-download-log"
            onClick={handleDownloadPdf}
            disabled={isPdfLoading}
          >
            {isPdfLoading ? 'Generating…' : '⬇ Download PDF Log'}
          </button>
        </div>
      </section>

      <section className="admin-meta-cell admin-meta-cell--fields" aria-label="Ticket classification">
        <h3 className="admin-meta-cell__title">Type, status &amp; priority</h3>
        {isClosed ? (
          <>
            <p>
              <strong>Type:</strong> {ticket.category}
            </p>
            <p>
              <strong>Status:</strong> {ticket.status}
            </p>
            <p>
              <strong>Priority:</strong> {ticket.priority}
            </p>
          </>
        ) : !canRespond ? (
          <>
            <p className="admin-meta-cell__muted">
              Assign this ticket to yourself to set type, status, priority, and submit a response.
            </p>
            {!isAssignedToCurrentAdmin && (
              <button type="button" className="btn-assign" onClick={onAssignToMe}>
                Assign to me
              </button>
            )}
          </>
        ) : (
          <>
            <label>
              Type
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Status
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                {STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Priority
              <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                {PRIORITY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <p className="admin-meta-cell__hint">Saved when you submit a response →</p>
          </>
        )}
      </section>

      <section className="admin-meta-cell admin-meta-cell--request" aria-label="Request details">
        <h3 className="admin-meta-cell__title">Request details</h3>
        {ticket.description ? (
          <p className="admin-meta-cell__request-body">{ticket.description}</p>
        ) : (
          <p className="admin-meta-cell__muted">No description provided.</p>
        )}
      </section>

      <section className="admin-meta-cell admin-meta-cell--response" aria-label="Admin response">
        <h3 className="admin-meta-cell__title">Response</h3>
        {isClosed ? (
          <p className="admin-meta-cell__muted">Ticket is closed — no new responses.</p>
        ) : !canRespond ? (
          <p className="admin-meta-cell__muted">
            Use <strong>Assign to me</strong> in Ticket credentials before you can reply.
          </p>
        ) : (
          <form className="admin-meta-response-form" onSubmit={handleSubmit}>
            <fieldset className="admin-meta-response-form__types">        {/* question vs solution */}
              <legend className="sr-only">Response type</legend>
              <label>
                <input
                  type="radio"
                  name="replyType"
                  value="question"
                  checked={replyType === 'question'}
                  onChange={() => setReplyType('question')}
                />
                Ask a question and enable user to reply
              </label>
              <label>
                <input
                  type="radio"
                  name="replyType"
                  value="solution"
                  checked={replyType === 'solution'}
                  onChange={() => setReplyType('solution')}
                />
                Provide a solution
              </label>
            </fieldset>
            <label>
              Response text
              <textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder={
                  replyType === 'solution'
                    ? 'Solution details. User will be asked if this solved their issue.'
                    : 'Question for the customer…'
                }
                rows={3}
                required
              />
            </label>
            <button
              type="submit"
              className="btn-primary admin-meta-response-form__submit"
              disabled={isSubmitting || !responseText.trim()}
            >
              {isSubmitting ? 'Submitting…' : 'Submit response & update ticket'}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
