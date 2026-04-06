const express = require('express');
const router = express.Router();
const {
	getYears,
	getSemestersByYear,
	getAllModules,
	getModuleDetails,
	createModule,
	updateModule,
	archiveModule,
	updateModuleAssignments
} = require('../controllers/academicController');

// Public routes for registration forms
router.get('/years', getYears);
router.get('/years/:yearId/semesters', getSemestersByYear);
router.get('/modules', getAllModules);
router.get('/modules/:id', getModuleDetails);
router.post('/modules', createModule);
router.put('/modules/:id', updateModule);
router.put('/modules/:id/archive', archiveModule);
router.put('/modules/:id/assignments', updateModuleAssignments);

module.exports = router;
