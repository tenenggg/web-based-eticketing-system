// Imports
const multer = require('multer');                               // multipart file uploads
const path = require('path');                                   // path join / extname
const fs = require('fs');                                       // mkdir for per-ticket folders




// Disk storage — uploads/attachments/<ticketId>/
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const ticketId = req.params.ticketId;
        const dir = path.join(__dirname, '..', 'uploads', 'attachments', String(ticketId));          
        fs.mkdirSync(dir, { recursive: true });                 // create folder if missing
        cb(null, dir);
    },

    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const base = path.basename(file.originalname, ext)
            .replace(/[^a-zA-Z0-9_\-]/g, '_')                   // safe filename chars only
            .slice(0, 80);
        cb(null, `${Date.now()}_${base}${ext}`);                // avoid collisions
    },
});




// Allowed MIME types — images + PDF only
const ALLOWED_MIME = new Set([
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
]);

const fileFilter = (req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`File type not allowed: ${file.mimetype}`), false);
    }
};




// Multer instance — field name in FormData must be "file"
const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 },                     // 10 MB max
});




module.exports = { upload };
