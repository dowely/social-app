const Post = require('../models/Post')
const User = require('../models/User')
const Follow = require('../models/Follow')

exports.isLoggedIn = function(req, res, next) {
  if(req.session.user) {
    next()
  } else {
    req.flash('errors', "You must be logged in to view this page.")
    req.session.save(function() {
      res.redirect('/')
    })
  }
} 

exports.login = function(req, res) {
  let user = new User(req.body)

  user.login()
    .then((msg) => {
      req.session.user = {username: user.data.username, avatar: user.data.avatar, _id: user.data._id}
      req.session.save(function() {
        res.redirect('/')
      })
    })
    .catch((err) => {
      req.flash('errors', err.message)
      req.session.save(() => {
        res.redirect('/')
      })
    })
}

exports.logout = function(req, res) {
  req.session.destroy(function() {
    res.redirect('/')
  })
}

exports.home = function(req, res) {
  if(req.session.user) {
    res.render('home-dashboard')
  } else {
    res.render('home-guest', {errors: req.flash('errors'), regErrors: req.flash('regErrors')})
  }
}

exports.register = async function(req, res) {
  let user = new User(req.body)
  let result = await user.register()
  if(Array.isArray(result)) {
    req.flash('regErrors', result)
    req.session.save(function() {
      res.redirect('/')
    })
  } else {
    req.session.user = {username: result.username, avatar: result.avatar, _id: result._id}
    res.redirect('/')
  }
}

exports.ifExists = function(req, res, next) {
  User.findByUsername(req.params.username)
    .then((userProfile) => {
      req.userProfile = userProfile
      next()
    })
    .catch(() => res.render('404'))
}

exports.viewProfilePosts = function(req, res) {
  Post.findPostsByUserId(req.userProfile._id)
    .then((posts) => {
      res.render('profile-posts', {
        profile: req.userProfile,
        posts: posts,
        isFollowing: req.isFollowing
      })
    })
    .catch((e) => res.send(e))
}

exports.userSharedData = async function(req, res, next) {
  let isFollowing = false
  isFollowing = await Follow.isUserFollowed(req.userProfile._id, req.visitorId)
  req.isFollowing = isFollowing
  next()
}