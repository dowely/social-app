const postCollection = require('../db').db().collection('posts')
const ObjectId = require('mongodb').ObjectId
const User = require('./User')
const sanitizeHtml = require('sanitize-html')

const Post = function(data, userid, requestedPostId) {

  this.data = data
  this.errors = []
  this.userid = userid
  this.requestedPostId = requestedPostId

}

Post.prototype.cleanUp = function() {

  if(typeof this.data.title != 'string') this.data.title = ''
  if(typeof this.data.body != 'string') this.data.body = ''

  this.data = {
    title: sanitizeHtml(this.data.title.trim(), {allowedTags: [], allowedAttributes: {}}),
    body: sanitizeHtml(this.data.body.trim(), {allowedTags: [], allowedAttributes: {}}),
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
        .then((info) => resolve(info.ops[0]._id))
        .catch(() => {
          this.errors.push('Server hiccups')
          reject(this.errors)
        })
    } else {
      reject(this.errors)
    }
  })
}

Post.prototype.update = function() {
  return new Promise(async (resolve, reject) => {
    try {
      let post = await Post.getPostById(this.requestedPostId, this.userid)
      if(post.isViewerTheAuthor) {
        this.cleanUp()
        this.validate()
        if(this.errors.length) resolve(this.errors)
        this.actuallyUpdate().then(() => {
          resolve('success')
        }).catch(() => {
          reject('We could not save the post. Please try again later.')
        })
      } else {
        reject('You do not have permission to update that post')
      }
    } catch {
      reject('There is no post with that id.')
    }
  })
}

Post.prototype.actuallyUpdate = function() {
  return new Promise ((resolve, reject) => {
    postCollection.findOneAndUpdate(
      {_id: new ObjectId(this.requestedPostId)},
      {$set: {title: this.data.title, body: this.data.body}}
    )
    .then(() => resolve())
    .catch(() => reject())
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

Post.getPostsQuery = function(query, lastOperation = []) {
  return new Promise(async (resolve, reject) => {

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
    ]).concat(lastOperation)

    let posts = await postCollection.aggregate(aggPipeline).toArray()

    resolve(posts)
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

Post.delete = function(postId, visitorId) {
  return new Promise(async (resolve, reject) => {
    try {
      let post = await Post.getPostById(postId, visitorId)
      if(post.isViewerTheAuthor) {
        await postCollection.deleteOne({_id: new ObjectId(post._id)})
        resolve()
      } else {
        reject()
      }
    } catch {
      reject()
    }
  })
}

Post.search = function(searchTerm) {
  return new Promise(async (resolve, reject) => {
    if(typeof searchTerm == 'string') {
      let posts = await Post.getPostsQuery(
        [{$match: {$text: {$search: searchTerm}}}],
        [{$sort: {score: {$meta: 'textScore'}}}]
      )

      posts.map(post => {
        post.author = {
          username: post.author.username,
          avatar: new User(post.author, true).data.avatar
        }
      })

      resolve(posts)
    } else {
      reject()
    }
  })
}

Post.countPostsByAuthor = function(id) {
  return new Promise(async (resolve, reject) => {
    let postCount = await postCollection.countDocuments({
      author: id
    })
    resolve(postCount)
  })
}

Post.getPostsByAuthorsArray = function(authors) {
  return new Promise(async (resolve, reject) => {
    try {
      let authorIdObjects = authors.map(author => {
        return author._id
      })
      let posts = await Post.getPostsQuery(
      [
        {$match: {author: {$in: authorIdObjects}}}
      ],
      [
        {$sort: {createDate: -1}}
      ])

      posts = posts.map(post => {
        return {
          _id: post._id,
          authorAvatar: new User(post.author, true).data.avatar,
          title: post.title,
          authorName: post.author.username,
          createDate: post.createDate
        }
      })
      resolve(posts)
    } catch {
      reject()
    }
  })
}

module.exports = Post