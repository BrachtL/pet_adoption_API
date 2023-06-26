const { Router } = require('express');
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = Router();

router.post('/signup', authController.signup_post);
router.post('/login', authController.login_post);
router.post('/tokenTest', requireAuth, (req, res) => {res.send("All Right")});
//this method should be get, and token should be sent in header

const teste = process.env.BFT_DB_HOST;
module.exports = {router, teste }