const User = require('../models/User')

exports.login = function(req, res) {
  let user = new User(req.body)

  user.login()
    .then((msg) => {
      req.session.user = {}
      res.send(msg)
    })
    .catch((err) => res.send(err.message))
}

exports.home = function(req, res) {
  console.log(req.session)
  if(req.session.user) {
    res.send('Welcome aboard')
  } else {
    res.render('home-guest')
  }
}

exports.register = function(req, res) {
  let user = new User(req.body)
  user.register()
  if(user.errors.length) {
    res.send(user.errors)
  } else {
    res.send("Congrats")
  }
}