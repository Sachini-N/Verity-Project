const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const errorHandler = require('./middlewares/errorHandler');
const { initSocket } = require('./config/socket');
const { recordRequest } = require('./services/systemMetrics');

dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io via singleton
const io = initSocket(server);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Attach io to req so we can emit events from anywhere inside routes
app.use((req, res, next) => {
    req.io = io;
    next();
});

app.use((req, res, next) => {
    const startedAt = Date.now();
    res.on('finish', () => {
        if (req.originalUrl && req.originalUrl.startsWith('/api/')) {
            recordRequest({
                method: req.method,
                path: req.originalUrl.split('?')[0],
                statusCode: res.statusCode,
                durationMs: Date.now() - startedAt
            });
        }
    });
    next();
});

const authRoutes = require('./routes/auth');
const academicRoutes = require('./routes/academic');
const projectRoutes = require('./routes/project');
const announcementRoutes = require('./routes/announcement');
const taskRoutes = require('./routes/task');
const reportRoutes = require('./routes/report');
const submissionRoutes = require('./routes/submission');
const userRoutes = require('./routes/user');
const assignmentRoutes = require('./routes/assignment');
const systemRoutes = require('./routes/system');
const githubRoutes = require('./routes/github');
const notificationRoutes = require('./routes/notification');
const leaderboardRoutes = require('./routes/leaderboard');

app.use('/api/auth', authRoutes);
app.use('/api/academic', academicRoutes);
app.use('/api/project', projectRoutes);
app.use('/api/announcement', announcementRoutes);
app.use('/api/task', taskRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/submission', submissionRoutes);
app.use('/api/user', userRoutes);
app.use('/api/assignment', assignmentRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/github', githubRoutes);
app.use('/api/notification', notificationRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

// Base route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Verity API' });
});

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
