const express = require('express')

const app = express()

const router = require('./router')

app.set('views', 'views')
app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(express.urlencoded({extended: false}))
app.use(express.json())

app.use('/', router)

app.listen(3000)