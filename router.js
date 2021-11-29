const express = require('express')
const router = express.Router()

const userController = require('./controllers/userController')
const postController = require('./controllers/postController')

router.get('/', userController.home)

router.post('/register', userController.register)

router.post('/login', userController.login)

router.post('/logout', userController.logout)

router.get('/create-post', userController.isLoggedIn, postController.viewCreatePost)

router.post('/create-post', userController.isLoggedIn, postController.create)

router.get('/posts/:id', postController.viewSingle)

router.get('/posts/:id/edit', userController.isLoggedIn, postController.viewEditPost)

router.post('/posts/:id/edit', userController.isLoggedIn, postController.edit)

router.post('/posts/:id/delete', userController.isLoggedIn, postController.delete)

router.get('/profile/:username', userController.ifExists, userController.viewProfilePosts)

module.exports = router