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
router.get('/pets/grid', requireAuth, petsController.pets_grid_get); //todo: change this route name to pets/liked
router.post('/pets/create', requireAuth, petsController.pet_create_post);
router.get('/pets/breeds', requireAuth, petsController.pet_breeds_get);
router.get('/pets/donating', requireAuth, petsController.donating_get);
router.get('/pets/chat_list', requireAuth, petsController.chat_list_get);
router.get('/pets/chat_not_owner', requireAuth, petsController.chat_list_not_owner_get); //todo: this name should be chat_list_not_owner, it is a list of just one item
router.get('/pets/pet_main_image_url', petsController.pet_main_image_url_get);
router.get('/pets/pet_data', requireAuth, petsController.pet_data_get);

//USERS
router.get('/chat', requireAuth, userController.user_chat_get);
router.post('/firebase/token', requireAuth, userController.token_post);


//DELETION URLs
router.get('/adotepelobem/excluirconta', userController.show_delete_page);
router.post('/adotepelobem/excluirconta', userController.delete_user_data);


module.exports = { router }