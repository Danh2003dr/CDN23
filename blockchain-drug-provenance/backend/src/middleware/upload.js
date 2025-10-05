const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Ensure upload directory exists
const uploadDir = process.env.UPLOAD_PATH || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Create subdirectories for different file types
const createSubdirs = () => {
  const subdirs = ['profiles', 'documents', 'qrcodes', 'attachments', 'reports'];
  subdirs.forEach(subdir => {
    const fullPath = path.join(uploadDir, subdir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  });
};

createSubdirs();

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let subfolder = 'attachments';
    
    // Determine subfolder based on fieldname or route
    if (file.fieldname === 'profileImage') {
      subfolder = 'profiles';
    } else if (file.fieldname === 'qrCode') {
      subfolder = 'qrcodes';
    } else if (file.fieldname === 'document' || file.fieldname === 'certificate') {
      subfolder = 'documents';
    } else if (req.route && req.route.path.includes('report')) {
      subfolder = 'reports';
    }
    
    const destination = path.join(uploadDir, subfolder);
    cb(null, destination);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, fileExtension);
    const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9]/g, '_');
    
    const filename = `${sanitizedBaseName}-${uniqueSuffix}${fileExtension}`;
    cb(null, filename);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  const allowedMimes = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/vnd.ms-excel': ['.xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    'text/csv': ['.csv'],
    'text/plain': ['.txt'],
    'application/json': ['.json']
  };

  const fileExtension = path.extname(file.originalname).toLowerCase();
  const isAllowedMime = allowedMimes[file.mimetype];
  const isAllowedExtension = isAllowedMime && isAllowedMime.includes(fileExtension);

  if (isAllowedMime && isAllowedExtension) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed. Allowed types: ${Object.keys(allowedMimes).join(', ')}`), false);
  }
};

// Multer configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB default
    files: 10 // Maximum 10 files per request
  }
});

// Specific upload configurations
const uploadConfigs = {
  // Single file uploads
  single: (fieldName) => upload.single(fieldName),
  
  // Multiple files with same field name
  array: (fieldName, maxCount = 5) => upload.array(fieldName, maxCount),
  
  // Multiple fields with different names
  fields: (fields) => upload.fields(fields),
  
  // Profile image upload
  profileImage: upload.single('profileImage'),
  
  // Document uploads
  documents: upload.array('documents', 10),
  
  // QR code image
  qrCode: upload.single('qrCode'),
  
  // Mixed attachments
  attachments: upload.fields([
    { name: 'images', maxCount: 5 },
    { name: 'documents', maxCount: 5 },
    { name: 'certificates', maxCount: 3 }
  ])
};

// File validation middleware
const validateFileUpload = (req, res, next) => {
  // Check if files were uploaded
  if (!req.file && !req.files) {
    return res.status(400).json({
      success: false,
      message: 'No files uploaded'
    });
  }

  // Validate file size for each uploaded file
  const files = req.files ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) : [req.file];
  
  for (const file of files) {
    if (!file) continue;
    
    // Additional security checks
    if (file.size === 0) {
      return res.status(400).json({
        success: false,
        message: `File ${file.originalname} is empty`
      });
    }
    
    // Check for malicious file names
    const suspiciousPatterns = /\.\.|\/|\\|<|>|\||\0/;
    if (suspiciousPatterns.test(file.originalname)) {
      return res.status(400).json({
        success: false,
        message: `File name ${file.originalname} contains suspicious characters`
      });
    }
  }

  next();
};

// File cleanup utility
const cleanupFiles = (files) => {
  const filesToClean = Array.isArray(files) ? files : [files];
  
  filesToClean.forEach(file => {
    if (file && file.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
  });
};

// Error handling middleware for multer
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    let message = 'File upload error';
    
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File too large';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected file field';
        break;
      case 'LIMIT_PART_COUNT':
        message = 'Too many parts';
        break;
      default:
        message = err.message;
    }
    
    return res.status(400).json({
      success: false,
      message: message
    });
  }
  
  if (err && err.message && err.message.includes('File type not allowed')) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  
  next(err);
};

// Generate secure file URL
const generateFileUrl = (req, filePath) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const relativePath = path.relative('.', filePath);
  return `${baseUrl}/${relativePath.replace(/\\/g, '/')}`;
};

// File metadata extraction
const extractFileMetadata = (file) => {
  return {
    originalName: file.originalname,
    filename: file.filename,
    mimetype: file.mimetype,
    size: file.size,
    path: file.path,
    uploadedAt: new Date()
  };
};

module.exports = {
  upload,
  uploadConfigs,
  validateFileUpload,
  handleUploadError,
  cleanupFiles,
  generateFileUrl,
  extractFileMetadata
};