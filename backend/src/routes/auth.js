const express = require('express');
const { register, registerStudent, registerLecturer, login } = require('../controllers/authController');
const router = express.Router();

router.post('/register', register);
router.post('/register/student', registerStudent);
router.post('/register/lecturer', registerLecturer);
router.post('/login', login);


module.exports = router;
