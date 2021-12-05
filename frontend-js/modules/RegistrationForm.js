import axios from 'axios'

export default class RegistrationForm {
  constructor() {
    this._csrf = document.querySelector('[name="_csrf"]').value
    this.form = document.querySelector('#registration-form')
    this.inputFields = document.querySelectorAll('#registration-form .form-control')
    this.username = document.querySelector('#username-register')
    this.username.prevValue = ''
    this.email = document.querySelector('#email-register')
    this.email.prevValue = ''
    this.password = document.querySelector('#password-register')
    this.password.prevValue = ''
    this.username.isUnique = false
    this.email.isUnique = false
    this.insertMsgDivs()
    this.events()
  }

  events() {
    this.form.addEventListener('submit', e => {
      e.preventDefault()
      this.formSubmitHandler()
    })
    this.username.addEventListener('keyup', () => {
      this.isDifferent(this.username, this.usernameHandler)
    })
    this.email.addEventListener('keyup', () => {
      this.isDifferent(this.email, this.emailHandler)
    })
    this.password.addEventListener('keyup', () => {
      this.isDifferent(this.password, this.passwordHandler)
    })
    this.username.addEventListener('blur', () => {
      this.isDifferent(this.username, this.usernameHandler)
    })
    this.email.addEventListener('blur', () => {
      this.isDifferent(this.email, this.emailHandler)
    })
    this.password.addEventListener('blur', () => {
      this.isDifferent(this.password, this.passwordHandler)
    })
  }

  formSubmitHandler() {
    this.usernameImediately()
    this.usernameAfterDelay()
    this.emailAfterDelay()
    this.passwordImediately()
    this.passwordAfterDelay()
    if(
      !this.username.errors &&
      !this.email.errors &&
      !this.password.errors &&
      this.username.isUnique &&
      this.email.isUnique
    ) {
      this.form.submit()
    }
  }

  isDifferent(el, handler) {
    if(el.value != el.prevValue) {
      handler.call(this)
    }
    el.prevValue = el.value
  } 

  usernameHandler() {
    this.username.errors = false
    clearTimeout(this.username.timer)
    this.usernameImediately()
    this.username.timer = setTimeout(() => this.usernameAfterDelay(), 800)
  }

  emailHandler() {
    this.email.errors = false
    clearTimeout(this.email.timer)
    this.email.timer = setTimeout(() => this.emailAfterDelay(), 800)
  }

  passwordHandler() {
    this.password.errors = false
    clearTimeout(this.password.timer)
    this.passwordImediately()
    this.password.timer = setTimeout(() => this.passwordAfterDelay(), 800)
  }

  usernameImediately() {
    if(this.username.value != '' && !/^([a-zA-Z0-9]+)$/.test(this.username.value)) {
      this.showErrorMessage(this.username, 'Username must contain only letters and numbers')
      this.username.errors = true
    }
    if(this.username.value == '') {
      this.showErrorMessage(this.username, 'You must provide a username')
      this.username.errors = true
    }
    if(this.username.value.length > 30) {
      this.showErrorMessage(this.username, 'Username cannot exceed 30 characters')
      this.username.errors = true
    }
    if(!this.username.errors) this.hideErrorMessage(this.username)
  }

  usernameAfterDelay() {
    if(this.username.value != '' && this.username.value.length < 3) {
      this.showErrorMessage(this.username, 'Username must be at least 3 characters long')
      this.username.errors = true
    }
    if(!this.username.errors) {
      axios.post('/doesUsernameExist', {_csrf: this._csrf,username: this.username.value}).then((response) => {
        if(response.data) {
          this.showErrorMessage(this.username, 'That username is already being used')
          this.username.errors = true
        } else {
          this.username.isUnique = true
          this.hideErrorMessage(this.username)
        }
      }).catch(() => console.log('Please try again later'))
    }
  }

  emailAfterDelay() {
    if(this.email.value != '' && !/^(\S+@\S+\.\S+)$/.test(this.email.value)) {
      this.showErrorMessage(this.email, 'You must provide a valid email address')
      this.email.errors = true
    }
    if(this.email.value == '') {
      this.showErrorMessage(this.email, 'You must provide an email address')
      this.email.errors = true
    }
    if(!this.email.errors) {
      this.hideErrorMessage(this.email)
      axios.post('/doesEmailExist', {_csrf: this._csrf, email: this.email.value}).then(response => {
        if(response.data) {
          this.showErrorMessage(this.email, 'This email is already being used')
          this.email.errors = true
        } else {
          this.email.isUnique = true
          this.hideErrorMessage(this.email)
        }
      }).catch(() => console.log('Please try again later'))
    }
  }

  passwordImediately() {
    if(this.password.value.length > 50) {
      this.showErrorMessage(this.password, 'Password must not exceed 50 characters')
      this.password.errors = true
    }
    if(this.password.value == '') {
      this.showErrorMessage(this.password, 'You must provide a password')
    }
    if(!this.password.errors && this.password.value.length >= 12) {
      this.hideErrorMessage(this.password)
    }
  }

  passwordAfterDelay() {
    if(this.password.value != '' && this.password.value.length < 12) {
      this.showErrorMessage(this.password, 'Password must be at least 12 characters long')
      this.password.errors = true
    }
  }

  showErrorMessage(el, message) {
    let errDiv = el.nextElementSibling
    errDiv.textContent = message
    errDiv.classList.add('liveValidateMessage--visible')
  }

  hideErrorMessage(el) {
    let errDiv = el.nextElementSibling
    errDiv.classList.remove('liveValidateMessage--visible')
  }

  insertMsgDivs() {
    this.inputFields.forEach(el => {
      el.insertAdjacentHTML('afterend', '<div class="alert alert-danger small liveValidateMessage"></div>')
    })
  }
}