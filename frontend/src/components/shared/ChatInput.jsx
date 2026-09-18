// Imports
import { useRef, useState } from 'react';




// Human-readable file size
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// True when file is an image
function isImage(file) {
  return file && file.type.startsWith('image/');
}




const ALLOWED_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
]);

const MAX_SIZE_BYTES = 10 * 1024 * 1024;                                // 10 MB upload limit




// Compose area — default bar or user one-time answer
export default function ChatInput({
  onSendMessage,
  onSendAttachment,
  isDisabled = false,
  placeholder = 'Type a message…',
  variant = 'default',
  answerHint = 'Please provide a full answer with all details. You can only reply while support is waiting for your response.',
}) {
  const [messageText, setMessageText] = useState('');
  const [pendingFile, setPendingFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fileError, setFileError] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef(null);



  // Validate and stage selected file
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setFileError('');

    if (!ALLOWED_TYPES.has(file.type)) {
      setFileError('File type not supported. Allowed: images and PDF only.');
      event.target.value = '';
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setFileError('File is too large. Maximum size is 10 MB.');
      event.target.value = '';
      return;
    }

    setPendingFile(file);

    if (isImage(file)) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  };



  // Clear staged file + preview
  const clearFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPendingFile(null);
    setPreviewUrl(null);
    setFileError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };



  // Send text and/or attachment
  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmed = messageText.trim();

    if ((!trimmed && !pendingFile) || isDisabled || isUploading) return;

    try {
      setIsUploading(true);

      if (pendingFile && onSendAttachment) {
        await onSendAttachment(pendingFile, trimmed);
        setMessageText('');
        clearFile();
      } else if (trimmed) {
        onSendMessage(trimmed);
        setMessageText('');
      }
    } finally {
      setIsUploading(false);
    }
  };



  if (isDisabled) return null;                                          // hide compose when reply blocked

  const isUserAnswer = variant === 'userAnswer';

  return (
    <div className={`chat-input-area ${isUserAnswer ? 'user-answer-compose' : ''}`}>
      {isUserAnswer && <p className="user-answer-compose__hint">{answerHint}</p>}

      {pendingFile && (
        <div className="attachment-preview">                              {/* staged file preview */}
          {previewUrl ? (
            <img src={previewUrl} alt="preview" className="attachment-preview-img" />
          ) : (
            <span className="attachment-preview-icon">📄</span>
          )}
          <span className="attachment-preview-name">
            {pendingFile.name} <em>({formatBytes(pendingFile.size)})</em>
          </span>
          <button type="button" className="attachment-preview-remove" onClick={clearFile} aria-label="Remove attachment">
            ×
          </button>
        </div>
      )}

      {fileError && <div className="attachment-error">{fileError}</div>}

      <form
        className={`chat-form ${isUserAnswer ? 'chat-form--stacked' : ''}`}
        onSubmit={handleSubmit}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,application/pdf"
          style={{ display: 'none' }}
          onChange={handleFileChange}
          aria-label="Attach file"
        />

        {isUserAnswer ? (
          <>
            <textarea
              value={messageText}
              onChange={(event) => setMessageText(event.target.value)}
              placeholder={placeholder}
              rows={5}
              required={!pendingFile}
            />
            <div className="chat-form-actions">
              <button
                type="button"
                className="btn-attach"
                onClick={() => fileInputRef.current?.click()}
                title="Attach image or PDF (max 10 MB)"
                aria-label="Attach file"
              >
                📎
              </button>
              <button
                type="submit"
                className="btn-send"
                disabled={isUploading || (!messageText.trim() && !pendingFile)}
              >
                {isUploading ? 'Sending…' : 'Submit answer'}
              </button>
            </div>
          </>
        ) : (
          <>
            <button
              type="button"
              className="btn-attach"
              onClick={() => fileInputRef.current?.click()}
              title="Attach an image or PDF (max 10 MB)"
              aria-label="Attach file"
            >
              📎
            </button>
            <input
              type="text"
              value={messageText}
              onChange={(event) => setMessageText(event.target.value)}
              placeholder={pendingFile ? 'Add a caption (optional)…' : placeholder}
              autoComplete="off"
            />
            <button
              type="submit"
              className="btn-send"
              disabled={isUploading || (!messageText.trim() && !pendingFile)}
            >
              {isUploading ? 'Sending…' : 'Send'}
            </button>
          </>
        )}
      </form>
    </div>
  );
}
