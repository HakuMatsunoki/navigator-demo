const express = require('express');
const controller = require('./controller');

const router = express.Router();


// auth
router.get('/', controller.isLoggedIn, controller.getLoginPage);
router.post('/users/signup', controller.signup);
router.post('/users/login', controller.login);
router.get('/users/logout', controller.logout);

// files
router.get('/files', controller.isLoggedIn, controller.protectRoute, controller.getOverview);
router.post('/files', controller.isLoggedIn, controller.protectRoute, controller.getFolder);
router.post('/search', controller.isLoggedIn, controller.protectRoute, controller.search);
router.post('/getFile', controller.isLoggedIn, controller.protectRoute, controller.getFile);
router.post('/getImage', controller.isLoggedIn, controller.protectRoute, controller.getImage);
router.post('/files/addDir', controller.isLoggedIn, controller.protectRoute, controller.addDir);
router.post('/files/loadFiles', controller.isLoggedIn, controller.protectRoute, controller.uploadFiles, controller.moveFiles);


module.exports = router;