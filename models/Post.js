const postCollection = require('../db').db().collection('posts')
const ObjectId = require('mongodb').ObjectId
const User = require('./User')

const Post = function(data, userid) {

  this.data = data
  this.errors = []
  this.userid = userid

}

Post.prototype.cleanUp = function() {

  if(typeof this.data.title != 'string') this.data.title = ''
  if(typeof this.data.body != 'string') this.data.body = ''

  this.data = {
    title: this.data.title.trim(),
    body: this.data.body.trim(),
    createDate: new Date(),
    author: new ObjectId(this.userid)
  }

}

Post.prototype.validate = function() {

  if(!this.data.title.length) this.errors.push('Please enter a post title')

  if(!this.data.body.length) this.errors.push('Please enter a post text content')

}

Post.prototype.create = function() {
  return new Promise((resolve, reject) => {
    this.cleanUp()
    this.validate()
    if(!this.errors.length) {
      postCollection.insertOne(this.data)
        .then(() => resolve())
        .catch(() => {
          this.errors.push('Server hiccups')
          reject(this.errors)
        })
    } else {
      reject(this.errors)
    }
  })
}

Post.getPostById = function(id, visitorId) {
  return new Promise(async (resolve, reject) => {
    if(typeof id != 'string' || !ObjectId.isValid(id)) {
      reject()
      return
    }
    let posts = await postCollection.aggregate([
      {$match: {_id: new ObjectId(id)}},
      {$lookup: {
        from: 'users',
        localField: 'author',
        foreignField: '_id',
        as: 'authorDocument'
        }},
      {$project: {
        title: 1,
        body: 1,
        createDate: 1,
        authorId: '$author',
        author: {$arrayElemAt: ['$authorDocument', 0]}
      }}      
    ]).toArray()

    posts.map(function(post) {

      post.isViewerTheAuthor = post.authorId.equals(visitorId)
      
      post.author = {
        username: post.author.username,
        avatar: new User(post.author, true).data.avatar
      }
      
      return post
    })

    if(posts.length) {
      resolve(posts[0])
    } else {
      reject()
    }
  })
}

Post.getPostsQuery = function(query) {
  return new Promise((resolve, reject) => {

    let aggPipeline = query.concat([
      {$lookup: {
        from: 'users',
        localField: 'author',
        foreignField: '_id',
        as: 'authorDocument'
      }},
      {$project: {
        title: 1,
        body: 1,
        createDate: 1,
        author: {$arrayElemAt: ['$authorDocument', 0]}
      }}
    ])

    postCollection.aggregate(aggPipeline).toArray()
      .then((posts) => resolve(posts))
      .catch((e) => reject(e))
  })
}

Post.findPostsByUserId = function(authorId) {
  return new Promise((resolve, reject) => {
    Post.getPostsQuery([
      {$match: {author: new ObjectId(authorId)}}
    ])
    .then((postDocs) => {
      
      let posts = postDocs.map(postDoc => {
        return {
          _id: postDoc._id,
          title: postDoc.title,
          createDate: postDoc.createDate,
          authorAvatar: new User(postDoc.author, true).data.avatar
        }
      })
      resolve(posts)
    })
    .catch((e) => reject(e))
  })
}

module.exports = Post