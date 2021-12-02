const Follow = require('../models/Follow')

exports.addFollow = function(req, res) {
  let follow = new Follow(req.params.username, req.visitorId)
  follow.create().then(() => {
    req.flash('success', `${req.params.username} is now followed by you`)
    req.session.save(() => res.redirect(`/profile/${req.params.username}`))
  }).catch((errors) => {
    req.flash('errors', errors)
    req.session.save(() => res.redirect('/'))
  })
}

exports.removeFollow = function(req, res) {
  let follow = new Follow(req.params.username, req.visitorId)
  follow.delete().then(() => {
    req.flash('success', `${req.params.username} is no longer being followed by you`)
    req.session.save(() => res.redirect(`/profile/${req.params.username}`))
  }).catch((errors) => {
    req.flash('errors', errors)
    req.session.save(() => res.redirect('/'))
  })
}