const User = require('../models/User')

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
      console.log(this)
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