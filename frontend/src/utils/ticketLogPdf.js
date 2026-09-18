// ticketLogPdf.js — admin PDF export (jsPDF loaded on demand)




// Colour palette (mirrors index.css tokens, adapted for white PDF)
const COLORS = {
  primary:       [59, 130, 246],                                        // --primary
  text:          [15, 23, 42],                                          // near-black on white
  textSecondary: [100, 116, 139],                                       // muted
  border:        [203, 213, 225],                                       // light rule
  surface:       [241, 245, 249],                                       // info box fill
  sent:          [59, 130, 246],                                        // admin bubble tint
  received:      [226, 232, 240],                                       // user bubble tint
  open:          [59, 130, 246],
  inprogress:    [139, 92, 246],
  onhold:        [245, 158, 11],
  closed:        [71, 85, 105],
  low:           [34, 197, 94],
  medium:        [59, 130, 246],
  high:          [249, 115, 22],
  urgent:        [239, 68, 68],
};




// Status / priority → RGB
function statusColor(status) {
  const map = {
    'Open':        COLORS.open,
    'In Progress': COLORS.inprogress,
    'On-Hold':     COLORS.onhold,
    'Closed':      COLORS.closed,
  };
  return map[status] || COLORS.primary;
}

function priorityColor(priority) {
  const map = {
    Low:    COLORS.low,
    Medium: COLORS.medium,
    High:   COLORS.high,
    Urgent: COLORS.urgent,
  };
  return map[priority] || COLORS.medium;
}




// Full date + time for PDF (always includes date)
function formatFull(dateString) {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString([], {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatTimeTaken(minutes) {
  if (minutes == null) return '—';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function formatBytes(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}




// Drawing helpers
function splitText(doc, text, maxWidth) {
  return doc.splitTextToSize(String(text || ''), maxWidth);
}

function fillRect(doc, x, y, w, h, color) {
  doc.setFillColor(...color);
  doc.rect(x, y, w, h, 'F');
}

function hRule(doc, y, margin, pageWidth, color = COLORS.border) {
  doc.setDrawColor(...color);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
}




// Build multi-page PDF and trigger download
export async function downloadTicketLogPdf({ ticket, messages }) {
  const { jsPDF } = await import('jspdf');                              // lazy-load when exporting

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });

  const PAGE_W  = doc.internal.pageSize.getWidth();                     // 595 pt
  const PAGE_H  = doc.internal.pageSize.getHeight();                    // 842 pt
  const MARGIN  = 40;
  const CONTENT = PAGE_W - MARGIN * 2;                                  // 515 pt
  let y = 0;                                                            // vertical cursor



  // Pagination
  const FOOTER_H   = 28;
  const CONTENT_H  = PAGE_H - FOOTER_H;                                 // usable height per page

  function checkPageBreak(neededHeight = 20) {
    if (y + neededHeight > CONTENT_H) {
      addFooter();
      doc.addPage();
      y = MARGIN;
    }
  }

  function addFooter() {
    const currentPage = doc.internal.getCurrentPageInfo().pageNumber;
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.textSecondary);
    doc.text(
      `Page ${currentPage}`,
      PAGE_W / 2, PAGE_H - 12,
      { align: 'center' }
    );
    doc.text(
      `E-Ticketing System — Confidential`,
      MARGIN, PAGE_H - 12
    );
    doc.text(
      `Exported ${new Date().toLocaleString()}`,
      PAGE_W - MARGIN, PAGE_H - 12,
      { align: 'right' }
    );
  }



  // Header bar
  fillRect(doc, 0, 0, PAGE_W, 54, COLORS.primary);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('Ticket Conversation Log', MARGIN, 28);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(210, 225, 255);
  doc.text(`Exported on ${new Date().toLocaleString()}`, MARGIN, 43);

  y = 70;



  // Ticket summary box
  const BOX_PAD = 12;
  const boxTop  = y;

  fillRect(doc, MARGIN, boxTop, CONTENT, 160, COLORS.surface);

  doc.setFillColor(...COLORS.primary);
  doc.rect(MARGIN, boxTop, 3, 160, 'F');                                // left accent

  doc.setTextColor(...COLORS.text);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Ticket Details', MARGIN + BOX_PAD + 4, y + 18);

  const col1X = MARGIN + BOX_PAD + 4;
  const col2X = MARGIN + CONTENT / 2 + 4;
  const lineH  = 19;
  let infoY    = y + 36;

  const statusCol = statusColor(ticket.status);
  const prioCol   = priorityColor(ticket.priority);

  function infoRow(label, value, x, iy, color = null) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...COLORS.textSecondary);
    doc.text(label, x, iy);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    if (color) {
      doc.setTextColor(...color);
    } else {
      doc.setTextColor(...COLORS.text);
    }
    doc.text(String(value || '—'), x, iy + 11);
  }

  infoRow('Ticket Number',  ticket.ticket_number,    col1X, infoY);
  infoRow('Subject',        ticket.subject,           col2X, infoY);
  infoY += lineH + 8;

  infoRow('Status',   ticket.status,   col1X, infoY, statusCol);
  infoRow('Priority', ticket.priority, col2X, infoY, prioCol);
  infoY += lineH + 8;

  infoRow('Category',       ticket.category,          col1X, infoY);
  infoRow('User',           `${ticket.user_username} (ID: ${ticket.user_id})`, col2X, infoY);
  infoY += lineH + 8;

  infoRow('Assigned Admin', ticket.admin_username || 'Unassigned', col1X, infoY);
  infoRow('Time Taken',     formatTimeTaken(ticket.time_taken_minutes), col2X, infoY);
  infoY += lineH + 8;

  infoRow('Opened At', formatFull(ticket.created_at), col1X, infoY);
  infoRow('Closed At', formatFull(ticket.closed_at),  col2X, infoY);

  y = boxTop + 160 + 20;



  // Transcript heading
  hRule(doc, y, MARGIN, PAGE_W);
  y += 14;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.text);
  doc.text('Conversation Transcript', MARGIN, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.textSecondary);
  doc.text(`${messages.length} message${messages.length !== 1 ? 's' : ''}`, MARGIN, y + 13);

  y += 28;
  hRule(doc, y, MARGIN, PAGE_W);
  y += 14;



  // Messages
  const BUBBLE_PAD  = 8;
  const BUBBLE_W    = CONTENT * 0.75;
  const META_H      = 14;
  const TEXT_FONT   = 9;
  const ATTACH_FONT = 8.5;

  for (const msg of messages) {
    const isSent     = msg.sender_name === ticket.admin_username;
    const bubbleColor = isSent ? [219, 234, 254] : [241, 245, 249];
    const textColor   = COLORS.text;
    const metaColor   = COLORS.textSecondary;
    const hasAttach   = Boolean(msg.file_url);

    const isRealCaption =
      hasAttach &&
      msg.content &&
      msg.content !== msg.original_name &&
      msg.content !== msg.file_name;

    const bodyText = hasAttach
      ? (isRealCaption ? msg.content : null)
      : msg.content;

    const bodyLines = bodyText
      ? splitText(doc, bodyText, BUBBLE_W - BUBBLE_PAD * 2)
      : [];

    const attachLines = hasAttach
      ? [
          `📎 ${msg.original_name || msg.file_name || 'attachment'}${msg.file_size ? `  (${formatBytes(msg.file_size)})` : ''}`,
        ]
      : [];

    const textBlockH  = bodyLines.length > 0 ? bodyLines.length * (TEXT_FONT + 3) + 4 : 0;
    const attachBlockH = attachLines.length > 0 ? attachLines.length * (ATTACH_FONT + 4) + 6 : 0;
    const bubbleH = META_H + BUBBLE_PAD + textBlockH + attachBlockH + BUBBLE_PAD;

    checkPageBreak(bubbleH + 10);

    const bubbleX = isSent
      ? PAGE_W - MARGIN - BUBBLE_W
      : MARGIN;

    fillRect(doc, bubbleX, y, BUBBLE_W, bubbleH, bubbleColor);

    if (isSent) {
      doc.setFillColor(...COLORS.primary);
      doc.rect(bubbleX, y, 3, bubbleH, 'F');
    }

    // Meta: sender + timestamp
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...metaColor);
    const senderLabel = isSent
      ? `${msg.sender_name} (Admin)`
      : msg.sender_name || 'User';
    doc.text(senderLabel, bubbleX + BUBBLE_PAD + (isSent ? 3 : 0), y + META_H - 3);

    doc.setFont('helvetica', 'normal');
    const tsText = formatFull(msg.created_at);
    doc.text(tsText, bubbleX + BUBBLE_W - BUBBLE_PAD, y + META_H - 3, { align: 'right' });

    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.2);
    doc.line(bubbleX + BUBBLE_PAD, y + META_H, bubbleX + BUBBLE_W - BUBBLE_PAD, y + META_H);

    let contentY = y + META_H + BUBBLE_PAD + TEXT_FONT;

    if (attachLines.length > 0) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(ATTACH_FONT);
      doc.setTextColor(...COLORS.textSecondary);
      for (const line of attachLines) {
        const attachTextLines = splitText(doc, line, BUBBLE_W - BUBBLE_PAD * 2);
        for (const l of attachTextLines) {
          doc.text(l, bubbleX + BUBBLE_PAD + (isSent ? 3 : 0), contentY);
          contentY += ATTACH_FONT + 4;
        }
      }
      if (bodyLines.length > 0) contentY += 4;
    }

    if (bodyLines.length > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(TEXT_FONT);
      doc.setTextColor(...textColor);
      for (const line of bodyLines) {
        doc.text(line, bubbleX + BUBBLE_PAD + (isSent ? 3 : 0), contentY);
        contentY += TEXT_FONT + 3;
      }
    }

    y += bubbleH + 8;
  }



  // End marker
  checkPageBreak(30);
  y += 6;
  hRule(doc, y, MARGIN, PAGE_W, COLORS.primary);
  y += 14;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.textSecondary);
  doc.text('— End of ticket log —', PAGE_W / 2, y, { align: 'center' });



  // Footer + save
  addFooter();

  const safeNumber = (ticket.ticket_number || `ticket-${ticket.id}`).replace(/[^a-z0-9-]/gi, '_');
  doc.save(`${safeNumber}_log.pdf`);
}
