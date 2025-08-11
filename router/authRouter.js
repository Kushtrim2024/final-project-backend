import express from 'express';

export const router = express.Router();
const { register, login } = require('../controllers/authController.js');

router.post('/register', register);
router.post('/login', login);


