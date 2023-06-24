const { Router } = require('express');
const authController = require('../controllers/authController');

const router = Router();

router.post('/signup', authController.signup_post);
router.post('/login', authController.login_post);

const teste = process.env.BFT_DB_HOST;
module.exports = {router, teste }