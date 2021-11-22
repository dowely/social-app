const express = require('express')
const session = require('express-session')

const app = express()

let sessionOptions = {
  secret: 'Jumpy fox',
  resave: false,
  saveUninitialized: false,
  name: 'sesId',
  cookie: {
    maxAge: 1000 * 60,
    httpOnly: true
  }
}

app.use(session(sessionOptions))

const router = require('./router')

app.set('views', 'views')
app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(express.urlencoded({extended: false}))
app.use(express.json())

app.use('/', router)

module.exports = app