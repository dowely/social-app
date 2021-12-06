const Post = require('../models/Post')

exports.viewCreatePost = function(req, res) {
  res.render('create-post', {title: 'Create new post'})
}

exports.create = function(req, res) {

  let post = new Post(req.body, req.session.user._id)

  post.create()
    .then((newId) => {
      req.flash('success', 'New post successfully created')
      req.session.save(() => res.redirect(`/posts/${newId}`))
    })
    .catch((errors) => {
      req.flash('errors', errors)
      req.session.save(() => res.redirect('/create-post'))
    })

}

exports.apiCreate = function(req, res) {

  let post = new Post(req.body, req.apiUser._id)

  post.create()
    .then((newId) => {
      res.json('New post successfully created!')
    })
    .catch((errors) => {
      res.json(errors)
    })

}

exports.viewSingle = async function(req, res) {
  try {
    let post = await Post.getPostById(req.params.id, req.visitorId)
    res.render('single-post-screen', {post: post, title: post.title})
  } catch {
    res.render('404')
  }
}

exports.viewEditPost = async function(req, res) {
  try {
    let post = await Post.getPostById(req.params.id, req.visitorId)
    if(post.isViewerTheAuthor) {
      res.render('edit-post', {post: post, title: `Edit ${post.title}`})
    } else {
      req.flash('errors', 'You do not have permission to perform this action.')
      req.session.save(() => res.redirect('/'))
    }
  } catch {
    res.render('404')
  }
}

exports.edit = async function(req, res) {
  try {
    let post = new Post(req.body, req.visitorId, req.params.id)
    let status = await post.update()
    if(status === 'success') {
      req.flash('success', 'The post was successfully saved.')
    } else {
      req.flash('errors', status)
    }
    req.session.save(() => res.redirect(`/posts/${req.params.id}/edit`))
  } catch (msg) {
    req.flash('errors', msg)
    req.session.save(() => res.redirect('/'))
  }
}

exports.delete = function(req, res) {
  Post.delete(req.params.id, req.visitorId)
    .then(() => {
      req.flash('success', 'The post was successfully deleted')
      req.session.save(() => res.redirect(`/profile/${req.session.user.username}`))
    })
    .catch(() => {
      req.flash('errors', 'You do not have permission to perform this action')
      req.session.save(() => res.redirect('/'))
    })
}

exports.apiDelete = function(req, res) {
  Post.delete(req.params.id, req.apiUser._id)
    .then(() => {
      res.json('Success')
    })
    .catch(() => {
      res.json('Sorry, you do not have permission to perform this action.')
    })
}

exports.search = function(req, res) {
  Post.search(req.body.searchTerm).then(data => {
    res.json(data)
  }).catch(() => {res.json([])})
}
