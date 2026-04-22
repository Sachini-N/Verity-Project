const express = require('express');
const router = express.Router();

// Middlewares
const { authMiddleware } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');

// Validations
const { 
    createAnnouncementSchema, 
    updateAnnouncementSchema, 
    paramIdSchema 
} = require('../validations/announcementValidation');

// Controllers
const { 
    createAnnouncement, 
    getAnnouncements, 
    getProjectAnnouncements, 
    deleteAnnouncement, 
    updateAnnouncement, 
    markAsRead 
} = require('../controllers/announcementController');

// Routes
router.post('/', authMiddleware, validate(createAnnouncementSchema), createAnnouncement);
router.get('/', authMiddleware, getAnnouncements);
router.get('/:projectId', authMiddleware, getProjectAnnouncements);
router.delete('/:id', authMiddleware, validate(paramIdSchema), deleteAnnouncement);
router.put('/:id', authMiddleware, validate(updateAnnouncementSchema), updateAnnouncement);
router.post('/:id/read', authMiddleware, validate(paramIdSchema), markAsRead);

module.exports = router;
