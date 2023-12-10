const { Router } = require('express');
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/authMiddleware');
const petsController = require('../controllers/petsController');
const userController = require('../controllers/userController');

//todo: change this file name to routes.js

const router = Router();

//AUTH
router.post('/signup', authController.signup_post);
router.post('/login', authController.login_post);
router.get('/tokenTest', requireAuth, (req, res) => {res.send("All Right")});
router.get('/logout', requireAuth, authController.logout_get);


//PETS
router.get('/pets', requireAuth, petsController.pets_get);
router.post('/pets/like', requireAuth, petsController.like_pet_post);
router.post('/pets/dislike', requireAuth, petsController.dislike_pet_post);
router.get('/pets/grid', requireAuth, petsController.pets_grid_get);
router.post('/pets/create', requireAuth, petsController.pet_create_post);
router.get('/pets/breeds', requireAuth, petsController.pet_breeds_get);
router.get('/chat', requireAuth, userController.user_chat_get);



const teste = process.env.BFT_DB_HOST;
module.exports = { router, teste }