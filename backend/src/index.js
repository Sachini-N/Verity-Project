const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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


// Base route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Verity API' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
