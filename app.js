const express = require('express')
const session = require('express-session')
const MongoStore = require('connect-mongo')(session)
const flash = require('connect-flash')
const markedDown = require('marked')
const sanitizeHtml = require('sanitize-html')

const app = express()

let sessionOptions = {
  secret: 'Jumpy fox',
  store: new MongoStore({client: require('./db')}),
  resave: false,
  saveUninitialized: false,
  rolling: true,
  name: 'sesId',
  cookie: {
    maxAge: 1000 * 60 * 60,
    httpOnly: true
  }
}

app.use(session(sessionOptions))
app.use(flash())

app.use(function(req, res, next) {

  if(req.session.user) {
    req.visitorId = req.session.user._id
  } else {
    req.visitorId = 0
  }

  res.locals.user = req.session.user
  res.locals.errors = req.flash('errors')
  res.locals.success = req.flash('success')

  res.locals.filteredHtml = function(content) {
    return sanitizeHtml(markedDown(content), {
      allowedTags: ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ol', 'ul', 'li', 'strong', 'em', 'br'],
      allowedAttributes: {}
    })
  }
  next()
})

const router = require('./router')

app.set('views', 'views')
app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(express.urlencoded({extended: false}))
app.use(express.json())

app.use('/', router)

module.exports = app