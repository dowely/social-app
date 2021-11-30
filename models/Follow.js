const usersCollection = require('../db').db().collection('users')
const followCollection = require('../db').db().collection('follows')
const ObjectId = require('mongodb').ObjectId

const Follow = function(followedUsername, authorId) {
  this.followedUsername = followedUsername
  this.authorId = authorId
  this.errors = []
}

Follow.prototype.cleanUp = function() {
  if(typeof this.followedUsername != 'string') {
    this.followedUsername = ''
  }
  this.followedUsername = this.followedUsername.trim()
}

Follow.prototype.validate = async function() {
  if(this.followedUsername === '') {
    this.errors.push('You must provide a username')
  } else {
    user = await usersCollection.findOne({username: this.followedUsername})
    if(user) {
      this.followedId = user._id
    } else {
      this.errors.push('There is no user with that name')
    }
  }
}

Follow.prototype.create = function() {
  return new Promise(async (resolve, reject) => {
    this.cleanUp()
    await this.validate()
    if(!this.errors.length) {
      let result = await followCollection.insertOne({followedId: this.followedId, authorId: new ObjectId(this.authorId)})
      if(result.insertedId) resolve()
      else {
        this.errors.push('Whoops, server error. Please try again later')
        reject(this.errors)
      }
    } else {
      reject(this.errors)
    }
  })
}

Follow.isUserFollowed = async function(followedId, authorId) {
  let follow = await followCollection.findOne({followedId: followedId, authorId: new ObjectId(authorId)})
  if(follow) return true
  else return false
}

module.exports = Follow