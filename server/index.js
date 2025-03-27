const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const uploadsDir = path.join(__dirname, 'uploads');
const sessionsDir = path.join(__dirname, 'sessions');
const lessonsDir = path.join(__dirname, 'lessons');

// Add a general route handler to log all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Ensure directories exist
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(sessionsDir)) {
  fs.mkdirSync(sessionsDir, { recursive: true });
}

if (!fs.existsSync(lessonsDir)) {
  fs.mkdirSync(lessonsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));

// Enable CORS with more specific options
app.use(cors({
  origin: '*', // Or specify your frontend domain like 'http://localhost:5173'
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Handle preflight requests explicitly
app.options('*', cors());

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir));

// Add a root endpoint to confirm server is running
app.get('/', (req, res) => {
  res.json({ 
    status: 'Server is running', 
    routes: [
      '/lessons',
      '/lessons/:lessonId',
      '/lessons/code/:accessCode',
      '/sessions/:studentId',
      '/sessions/active/:lessonId'
    ],
    directories: {
      lessons: fs.readdirSync(lessonsDir),
      sessions: fs.readdirSync(sessionsDir)
    }
  });
});

// Upload endpoints - support both paths
app.post('/upload', upload.single('image'), handleImageUpload);
app.post('/v1/upload', upload.single('image'), handleImageUpload);

// Handle image upload function
function handleImageUpload(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Get server's base URL from request
    const protocol = req.protocol;
    const host = req.get('host');
    const baseUrl = `${protocol}://${host}`;
    
    const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
}

// LESSON MANAGEMENT ENDPOINTS
// Get a lesson by access code - IMPORTANT: This must be defined BEFORE the /lessons/:lessonId route
app.get('/lessons/code/:accessCode', async (req, res) => {
  console.log(`Received /lessons/code/${req.params.accessCode} request`);
  try {
    const { accessCode } = req.params;
    const lessonFiles = fs.readdirSync(lessonsDir);
    
    for (const file of lessonFiles) {
      if (file.endsWith('.json')) {
        try {
          const lessonData = fs.readFileSync(path.join(lessonsDir, file), 'utf8');
          const lesson = JSON.parse(lessonData);
          
          if (lesson.accessCode && lesson.accessCode.toUpperCase() === accessCode.toUpperCase()) {
            console.log(`Found lesson with access code: ${accessCode}`);
            return res.status(200).json({ lesson });
          }
        } catch (err) {
          console.error(`Error reading lesson file ${file}:`, err);
        }
      }
    }
    
    console.log(`No lesson found with access code: ${accessCode}`);
    res.status(404).json({ error: 'Lesson not found with that access code' });
  } catch (error) {
    console.error('Get lesson by code error:', error);
    res.status(500).json({ error: 'Failed to retrieve lesson' });
  }
});

// Save a lesson
app.post('/lessons/save', async (req, res) => {
  console.log('Received /lessons/save request');
  try {
    const { lesson } = req.body;
    
    if (!lesson || !lesson.id) {
      return res.status(400).json({ error: 'Invalid lesson data' });
    }
    
    const filePath = path.join(lessonsDir, `${lesson.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(lesson));
    console.log(`Lesson saved: ${lesson.id}`);
    
    res.status(200).json({ success: true, message: 'Lesson saved', lesson });
  } catch (error) {
    console.error('Lesson save error:', error);
    res.status(500).json({ error: 'Failed to save lesson' });
  }
});

// Get all lessons
app.get('/lessons', async (req, res) => {
  console.log('Received /lessons request');
  try {
    const lessonFiles = fs.readdirSync(lessonsDir);
    const lessons = [];
    
    for (const file of lessonFiles) {
      if (file.endsWith('.json')) {
        try {
          const lessonData = fs.readFileSync(path.join(lessonsDir, file), 'utf8');
          const lesson = JSON.parse(lessonData);
          lessons.push(lesson);
        } catch (err) {
          console.error(`Error reading lesson file ${file}:`, err);
        }
      }
    }
    
    console.log(`Found ${lessons.length} lessons`);
    res.status(200).json({ lessons });
  } catch (error) {
    console.error('Get lessons error:', error);
    res.status(500).json({ error: 'Failed to retrieve lessons' });
  }
});

// Get a lesson by ID
app.get('/lessons/:lessonId', async (req, res) => {
  console.log(`Received /lessons/${req.params.lessonId} request`);
  try {
    const { lessonId } = req.params;
    const filePath = path.join(lessonsDir, `${lessonId}.json`);
    
    if (!fs.existsSync(filePath)) {
      console.log(`Lesson not found: ${lessonId}`);
      return res.status(404).json({ error: 'Lesson not found' });
    }
    
    const lessonData = fs.readFileSync(filePath, 'utf8');
    const lesson = JSON.parse(lessonData);
    
    res.status(200).json({ lesson });
  } catch (error) {
    console.error('Get lesson error:', error);
    res.status(500).json({ error: 'Failed to retrieve lesson' });
  }
});

// Delete a lesson
app.delete('/lessons/:lessonId', async (req, res) => {
  console.log(`Received DELETE /lessons/${req.params.lessonId} request`);
  try {
    const { lessonId } = req.params;
    const filePath = path.join(lessonsDir, `${lessonId}.json`);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Deleted lesson: ${lessonId}`);
    }
    
    res.status(200).json({ success: true, message: 'Lesson deleted' });
  } catch (error) {
    console.error('Lesson delete error:', error);
    res.status(500).json({ error: 'Failed to delete lesson' });
  }
});

// SESSION MANAGEMENT ENDPOINTS
// Get all active sessions for a lesson - IMPORTANT: This must be defined BEFORE the /sessions/:studentId route
app.get('/sessions/active/:lessonId', async (req, res) => {
  console.log(`Received /sessions/active/${req.params.lessonId} request`);
  try {
    const { lessonId } = req.params;
    const now = Date.now();
    const sessionFiles = fs.readdirSync(sessionsDir);
    const activeSessions = [];
    
    for (const file of sessionFiles) {
      if (file.endsWith('.json')) {
        try {
          const sessionData = fs.readFileSync(path.join(sessionsDir, file), 'utf8');
          const session = JSON.parse(sessionData);
          
          // Check if session is for this lesson and active in the last 30 seconds
          if (session.lessonId === lessonId && now - session.lastActive < 30000) {
            activeSessions.push(session);
          }
        } catch (err) {
          console.error(`Error reading session file ${file}:`, err);
        }
      }
    }
    
    console.log(`Found ${activeSessions.length} active sessions for lesson: ${lessonId}`);
    res.status(200).json({ sessions: activeSessions });
  } catch (error) {
    console.error('Active sessions error:', error);
    res.status(500).json({ error: 'Failed to retrieve active sessions' });
  }
});

// Save a student session
app.post('/sessions/save', async (req, res) => {
  console.log('Received /sessions/save request');
  try {
    const { session } = req.body;
    
    if (!session || !session.studentId) {
      return res.status(400).json({ error: 'Invalid session data' });
    }
    
    const filePath = path.join(sessionsDir, `${session.studentId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(session));
    console.log(`Session saved: ${session.studentId}`);
    
    res.status(200).json({ success: true, message: 'Session saved' });
  } catch (error) {
    console.error('Session save error:', error);
    res.status(500).json({ error: 'Failed to save session' });
  }
});

// Get a student session by ID
app.get('/sessions/:studentId', async (req, res) => {
  console.log(`Received /sessions/${req.params.studentId} request`);
  try {
    const { studentId } = req.params;
    const filePath = path.join(sessionsDir, `${studentId}.json`);
    
    if (!fs.existsSync(filePath)) {
      console.log(`Session not found: ${studentId}`);
      return res.status(404).json({ error: 'Session not found' });
    }
    
    const sessionData = fs.readFileSync(filePath, 'utf8');
    const session = JSON.parse(sessionData);
    
    res.status(200).json({ session });
  } catch (error) {
    console.error('Session get error:', error);
    res.status(500).json({ error: 'Failed to retrieve session' });
  }
});

// Delete a student session
app.delete('/sessions/:studentId', async (req, res) => {
  console.log(`Received DELETE /sessions/${req.params.studentId} request`);
  try {
    const { studentId } = req.params;
    const filePath = path.join(sessionsDir, `${studentId}.json`);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Deleted session: ${studentId}`);
    }
    
    res.status(200).json({ success: true, message: 'Session deleted' });
  } catch (error) {
    console.error('Session delete error:', error);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

// Error handling
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large' });
    }
  }
  console.error('Server error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Lessons directory: ${lessonsDir}`);
  console.log(`Sessions directory: ${sessionsDir}`);
  
  // Log the contents of the lessons directory
  const lessons = fs.readdirSync(lessonsDir);
  console.log(`Available lessons (${lessons.length}): ${lessons.join(', ')}`);
});
