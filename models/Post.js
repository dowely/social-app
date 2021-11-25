const postCollection = require('../db').db().collection('posts')
const ObjectId = require('mongodb').ObjectId

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

Post.getPostById = function(id) {
  return new Promise(async (resolve, reject) => {
    if(typeof id != 'string' || !ObjectId.isValid(id)) {
      reject()
      return
    }
    let post = await postCollection.findOne({_id: new ObjectId(id)})
    if(post) {
      resolve(post)
    } else {
      reject()
    }
  })
}

module.exports = Post