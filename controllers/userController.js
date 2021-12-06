const Post = require('../models/Post')
const User = require('../models/User')
const Follow = require('../models/Follow')
const ObjectId = require('mongodb').ObjectId
const jwt = require('jsonwebtoken')

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

exports.apiMustBeLoggedIn = function(req, res, next) {
  try {
    req.apiUser = jwt.verify(req.body.token, process.env.JWTSECRET)
    next()
  } catch {
    res.json("You must provide a valid token to perform this acction")
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

exports.apiLogin = function(req, res) {
  let user = new User(req.body)

  user.login()
    .then((msg) => {
      res.json(jwt.sign({_id: user.data._id}, process.env.JWTSECRET, {expiresIn: '7d'}))
    })
    .catch((err) => {
      res.json('Your credentials are incorrect')
    })
}

exports.logout = function(req, res) {
  req.session.destroy(function() {
    res.redirect('/')
  })
}

exports.home = async function(req, res) {
  if(req.session.user) {
    try {
      let following = await Follow.getFollowingById(new ObjectId(req.session.user._id))
      let posts = await Post.getPostsByAuthorsArray(following)
      res.render('home-dashboard', {posts: posts, title: 'Latest feed'})
    } catch {
      res.render('404')
    }
  } else {
    res.render('home-guest', {regErrors: req.flash('regErrors')})
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
        title: `Profile for ${req.userProfile.username}`,
        currentPage: 'posts',
        profile: req.userProfile,
        posts: posts,
        isFollowing: req.isFollowing,
        isAuthor: req.isAuthor,
        count: {posts: req.postCount, followers: req.followersCount, following: req.followingCount}
      })
    })
    .catch((e) => res.send(e))
}

exports.userSharedData = async function(req, res, next) {
  let isFollowing = false
  let isAuthor = false
  isFollowing = await Follow.isUserFollowed(req.userProfile._id, req.visitorId)
  req.isFollowing = isFollowing
  if(userProfile._id == req.visitorId) isAuthor = true
  req.isAuthor = isAuthor

  // mounting profile counts onto the reqest
  let postCountPromise = Post.countPostsByAuthor(req.userProfile._id)
  let followersCountPromise = Follow.countFollowersById(req.userProfile._id)
  let followingCountPromise = Follow.countFollowingById(req.userProfile._id)

  let [postCount, followersCount, followingCount] = await Promise.all([postCountPromise, followersCountPromise, followingCountPromise])
  req.postCount = postCount
  req.followersCount = followersCount
  req.followingCount = followingCount

  next()
}

exports.viewProfileFollowers = async function(req, res) {
  try {
    let followers = await Follow.getFollowersById(req.userProfile._id)
    res.render('profile-followers', {
      currentPage: 'followers',
      followers: followers,
      profile: req.userProfile,
      isFollowing: req.isFollowing,
      isAuthor: req.isAuthor,
      count: {posts: req.postCount, followers: req.followersCount, following: req.followingCount}
    })
  } catch {
    res.render('404')
  }
}

exports.viewProfileFollowing = async function(req, res) {
  try {
    let following = await Follow.getFollowingById(req.userProfile._id)
    res.render('profile-following', {
      currentPage: 'following',
      following: following,
      profile: req.userProfile,
      isFollowing: req.isFollowing,
      isAuthor: req.isAuthor,
      count: {posts: req.postCount, followers: req.followersCount, following: req.followingCount}
    })
  } catch {
    res.render('404')
  }
}

exports.doesUsernameExist = function(req, res) {
  User.findByUsername(req.body.username).then(() => {
    res.json(true)
  }).catch(() => res.json(false))
}

exports.doesEmailExist = async function(req, res) {
  try {
    let emailBool = await User.doesEmailExist(req.body.email)
    if(emailBool) {
      res.json(true)
    } else {
      res.json(false)
    }
  } catch {
    res.json(true)
  }
}

exports.apiGetPostsByUsername = async function(req, res) {
  try {
    let userDoc = await User.findByUsername(req.params.username)
    let posts = await Post.findPostsByUserId(userDoc._id)
    res.json(posts)
  } catch {
    res.json("This username does not exist")
  }
}