const bcrypt = require('bcryptjs')
const validator = require('validator')
const usersCollection = require('../db').db().collection('users')
const md5 = require('md5')

let User = function(data, getavatar) {
  this.data = data,
  this.errors = []

  if(getavatar) this.getAvatar()
}

User.prototype.cleanUp = function() {
  if(typeof this.data.username != 'string') this.data.username = ''
  if(typeof this.data.email != 'string') this.data.email = ''
  if(typeof this.data.password != 'string') this.data.password = ''

  this.data = {
    username: this.data.username.trim().toLowerCase(),
    email: this.data.email.trim().toLowerCase(),
    password: this.data.password
  }
}

User.prototype.validate = async function() {
  if (this.data.username == "") {this.errors.push("You must provide a username.")}
  if (this.data.username != "" && !validator.isAlphanumeric(this.data.username)) {this.errors.push("Username can only contain letters and numbers.")}
  if (!validator.isEmail(this.data.email)) {this.errors.push("You must provide a valid email address.")}
  if (this.data.password == "") {this.errors.push("You must provide a password.")}
  if (this.data.password.length > 0 && this.data.password.length < 12) {this.errors.push("Password must be at least 12 characters.")}
  if (this.data.password.length > 50) {this.errors.push("Password cannot exceed 50 characters.")}
  if (this.data.username.length > 0 && this.data.username.length < 3) {this.errors.push("Username must be at least 3 characters.")}
  if (this.data.username.length > 30) {this.errors.push("Username cannot exceed 30 characters.")}

  if(this.data.username.length > 2 && this.data.username.length < 31 && validator.isAlphanumeric(this.data.username)) {
    let usernameExists = await usersCollection.findOne({username: this.data.username})
    if(usernameExists) this.errors.push('Username is already taken.')
  }

  if(validator.isEmail(this.data.email)) {
    let emailExists = await usersCollection.findOne({email: this.data.email})
    if(emailExists) this.errors.push('This email is already being used.')
  }
}

User.prototype.login = function() {
  return new Promise((resolve, reject) => {

    this.cleanUp()
    
    usersCollection.findOne({username: this.data.username})
    .then(attemptedUser => {
      if(attemptedUser && bcrypt.compareSync(this.data.password, attemptedUser.password)) {
        this.data = attemptedUser
        this.getAvatar()
        resolve('Congratssss!')
      } else {
        reject(new Error('Wrong username / password'))
      }
    })
    .catch(() => {
      reject(new Error('server error'))
    })
  })
}

User.prototype.register = async function() {
  this.cleanUp()
  await this.validate()

  if(!this.errors.length) {
    this.data.password = bcrypt.hashSync(this.data.password, 10)
    await usersCollection.insertOne(this.data)
    this.getAvatar()
    return this.data
  } else {return this.errors}
}

User.prototype.getAvatar = function() {
  this.data.avatar = `https://www.gravatar.com/avatar/${md5(this.data.email)}?s=128`
}

User.findByUsername = function(username) {
  return new Promise((resolve, reject) => {
    if(typeof username != 'string') {
      reject()
      return
    }

    usersCollection.findOne({username: username})
      .then((document) => {
        let user = new User(document, true)
        userProfile = {
          _id: user.data._id,
          username: user.data.username,
          avatar: user.data.avatar
        }
        resolve(userProfile)
      })
      .catch(() => reject())

  })
}

module.exports = User