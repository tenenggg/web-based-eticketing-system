// Imports
import { useEffect, useRef, useState } from 'react';
import { formatTimestamp } from '../../utils/formatters.js';             // relative "Just now" / time labels
import { messageKindLabel, USER_REQUEST } from '../../utils/ticketWorkflow.js';




// Absolute or proxied URL for /uploads files
function resolveFileUrl(fileUrl) {
  if (!fileUrl) return '';
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) return fileUrl;

  const path = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
  const backend = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/$/, '');

  // Dev: VITE_BACKEND_URL → http://localhost:5005/uploads/...
  // Prod (Express serves app): empty → same-origin /uploads/...
  return backend ? `${backend}${path}` : path;
}




// MIME helpers
function isImageMime(mimeType) {
  return typeof mimeType === 'string' && mimeType.toLowerCase().startsWith('image/');
}

function isPdfMime(mimeType) {
  return typeof mimeType === 'string' && mimeType.toLowerCase().includes('pdf');
}

function formatBytes(bytes) {
  const n = typeof bytes === 'bigint' ? Number(bytes) : Number(bytes);
  if (!n || Number.isNaN(n)) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}




// Force a real file download (blob). Plain <a download> is ignored cross-origin.
async function forceDownload(fileUrl, filename) {
  // Prefer same-origin /uploads path so Vite proxy works (no CORS)
  let url = fileUrl || '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      url = new URL(url).pathname;
    } catch {
      url = resolveFileUrl(fileUrl);
    }
  } else if (!url.startsWith('/')) {
    url = `/${url}`;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Download failed');

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = blobUrl;
    anchor.download = filename || 'attachment';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(blobUrl);
  } catch (err) {
    console.error('Force download failed, opening in new tab:', err);
    window.open(resolveFileUrl(fileUrl), '_blank', 'noopener,noreferrer');
  }
}




// Attachment card — file info + actions (image preview optional)
function AttachmentContent({ message, isSent }) {
  const url = resolveFileUrl(message.file_url);
  const name = message.original_name || message.file_name || 'attachment';
  const mime = String(message.mime_type || '');
  const sizeText = formatBytes(message.file_size);
  const [showPreview, setShowPreview] = useState(isImageMime(mime));
  const [isDownloading, setIsDownloading] = useState(false);

  const cardClass = [
    'file-card',
    isSent ? 'file-card--sent' : 'file-card--received',
  ].join(' ');



  // Blob download via forceDownload
  const handleDownloadClick = async (event) => {
    event.preventDefault();
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      await forceDownload(message.file_url, name);
    } finally {
      setIsDownloading(false);
    }
  };



  return (
    <div className={cardClass}>
      {showPreview && url && (                                            /* optional image preview */
        <a href={url} target="_blank" rel="noopener noreferrer" className="file-card__preview-link">
          <img
            src={url}
            alt={name}
            className="file-card__preview"
            loading="lazy"
            onError={() => setShowPreview(false)}
          />
        </a>
      )}

      <div className="file-card__body">                                   {/* icon + name + size */}
        <div className="file-card__icon" aria-hidden="true">
          {isPdfMime(mime) ? '📄' : isImageMime(mime) ? '🖼️' : '📎'}
        </div>
        <div className="file-card__text">
          <div className="file-card__name" title={name}>{name}</div>
          {sizeText && <div className="file-card__size">{sizeText}</div>}
        </div>
      </div>

      <div className="file-card__actions">                                {/* open + download */}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="file-card__btn"
        >
          Open
        </a>
        <button
          type="button"
          className="file-card__btn file-card__btn--primary"
          onClick={handleDownloadClick}
          disabled={isDownloading}
        >
          {isDownloading ? 'Downloading…' : 'Download'}
        </button>
      </div>
    </div>
  );
}




// Scrollable chat thread
export default function MessageList({ messages, currentUserId }) {
  const listRef = useRef(null);                                         // auto-scroll container



  // Keep view pinned to latest message
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);



  if (messages.length === 0) {
    return (
      <div ref={listRef} className="chat-messages">
        <div className="empty-state">No messages yet.</div>
      </div>
    );
  }

  return (
    <div ref={listRef} className="chat-messages">
      {messages
        .filter(
          (message) =>
            !(
              message.message_kind === USER_REQUEST &&
              Number(message.sender_id) === Number(currentUserId)
            )
        )
        .map((message) => {
          const isSentByCurrentUser = Number(message.sender_id) === Number(currentUserId);
          const hasAttachment = Boolean(message.file_url && String(message.file_url).trim());

          // Caption only when text differs from the file name
          const captionText =
            hasAttachment &&
            message.content &&
            message.content !== message.original_name &&
            message.content !== message.file_name
              ? message.content
              : null;

          const kindLabel = messageKindLabel(message.message_kind, isSentByCurrentUser);

          return (
            <div
              key={message.id}
              className={`message ${isSentByCurrentUser ? 'sent' : 'received'} ${hasAttachment ? 'has-attachment' : ''}`}
              data-id={message.id}
            >
              {kindLabel && <div className="message-kind-label">{kindLabel}</div>}

              {hasAttachment && (
                <AttachmentContent message={message} isSent={isSentByCurrentUser} />
              )}

              {!hasAttachment && <div className="content">{message.content}</div>}
              {hasAttachment && captionText && (
                <div className="content attachment-caption">{captionText}</div>
              )}

              <div className="meta">
                {isSentByCurrentUser ? 'You' : message.sender_name || 'System'} •{' '}
                {formatTimestamp(message.created_at)}
              </div>
            </div>
          );
        })}
    </div>
  );
}
