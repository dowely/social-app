const Post = require('../models/Post')

exports.viewCreatePost = function(req, res) {
  res.render('create-post')
}

exports.create = function(req, res) {

  let post = new Post(req.body, req.session.user._id)

  post.create()
    .then(() => res.send('New post received'))
    .catch((errors) => {
      res.send(errors)
    })

}

exports.viewSingle = async function(req, res) {
  try {
    let post = await Post.getPostById(req.params.id)
    res.render('single-post-screen', {post: post})
  } catch {
    res.send('404 page will go here')
  }
}
