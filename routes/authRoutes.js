const { Router } = require('express');
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/authMiddleware');
const petsController = require('../controllers/petsController');

//todo: change this file name to routes.js

const router = Router();

//AUTH
router.post('/signup', authController.signup_post);
router.post('/login', authController.login_post);
router.get('/tokenTest', requireAuth, (req, res) => {res.send("All Right")});
router.get('/logout', requireAuth, authController.logout_get);


//PETS
router.get('/pets', requireAuth, petsController.pets_get)

const teste = process.env.BFT_DB_HOST;
module.exports = { router, teste }