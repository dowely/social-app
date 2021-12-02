const usersCollection = require('../db').db().collection('users')
const followCollection = require('../db').db().collection('follows')
const ObjectId = require('mongodb').ObjectId

const User = require('./User')

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

Follow.prototype.validate = async function(action) {
  if(this.followedUsername === '') {
    this.errors.push('You must provide a username')
  } else {
    user = await usersCollection.findOne({username: this.followedUsername})
    if(user) {
      this.followedId = user._id
      if(this.followedId.equals(this.authorId)) {
        this.errors.push('You cannot follow yourself')
      } else {
        let followExists = await followCollection.findOne({
          followedId: this.followedId, authorId: new ObjectId(this.authorId)
        })
        if(followExists && action == 'create') this.errors.push('You already follow that user')
        if(!followExists && action == 'delete') this.errors.push('You must follow this user first')
      }
    } else {
      this.errors.push('There is no user with that name')
    }
  }
}

Follow.prototype.create = function() {
  return new Promise(async (resolve, reject) => {
    this.cleanUp()
    await this.validate('create')
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

Follow.prototype.delete = function() {
  return new Promise(async (resolve, reject) => {
    this.cleanUp()
    await this.validate('delete')
    if(!this.errors.length) {
      let result = await followCollection.deleteOne({followedId: this.followedId, authorId: new ObjectId(this.authorId)})
      if(result.deletedCount) resolve()
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

Follow.getFollowersById = function(id) {
  return new Promise(async (resolve, reject) => {
    try {
      let followers = await followCollection.aggregate([
        {$match: {followedId: id}},
        {$lookup: {from: 'users', localField: 'authorId', foreignField: '_id', as: 'authorDoc'}},
        {$project: {
          username: {$arrayElemAt: ['$authorDoc.username', 0]},
          email: {$arrayElemAt: ['$authorDoc.email', 0]}
        }}
      ]).toArray()

      followers = followers.map(follower => {
        return {
          username: follower.username,
          avatar: new User(follower, true).data.avatar
        }
      })
      resolve(followers)
    } catch {
      reject()
    }
  })
}

Follow.getFollowingById = function(id) {
  return new Promise(async (resolve, reject) => {
    try {
      let followers = await followCollection.aggregate([
        {$match: {authorId: id}},
        {$lookup: {from: 'users', localField: 'followedId', foreignField: '_id', as: 'authorDoc'}},
        {$project: {
          followedId: 1,
          username: {$arrayElemAt: ['$authorDoc.username', 0]},
          email: {$arrayElemAt: ['$authorDoc.email', 0]}
        }}
      ]).toArray()

      followers = followers.map(follower => {
        return {
          _id: follower.followedId,
          username: follower.username,
          avatar: new User(follower, true).data.avatar
        }
      })
      resolve(followers)
    } catch {
      reject()
    }
  })
}

Follow.countFollowersById = function(id) {
  return new Promise(async (resolve, reject) => {
    let followersCount = await followCollection.countDocuments({
      followedId: id
    })
    resolve(followersCount)
  })
}

Follow.countFollowingById = function(id) {
  return new Promise(async (resolve, reject) => {
    let followingCount = await followCollection.countDocuments({
      authorId: id
    })
    resolve(followingCount)
  })
}

module.exports = Follow