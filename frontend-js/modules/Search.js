import axios from 'axios'
import DOMPurify from 'dompurify'

export default class Search{
  constructor() {
    this._csrf = document.querySelector('[name="_csrf"]').value
    this.injectHtml()
    this.searchIcon = document.querySelector('.header-search-icon')
    this.closeIcon = document.querySelector('.close-live-search')
    this.overlay = document.querySelector('.search-overlay')
    this.inputField = document.querySelector('#live-search-field')
    this.loader = document.querySelector('.circle-loader')
    this.resultsArea = document.querySelector('.live-search-results')
    this.events()

    this.prevValue = ''
    this.writingTimer
  }

  events() {

    this.inputField.addEventListener('keyup', () => {
      this.keyupHandler()
    })

    this.searchIcon.addEventListener('click', (e) => {
      e.preventDefault()
      this.openOverlay()
    })

    this.closeIcon.addEventListener('click', () => {
      this.closeOverlay()
    })
  }

  keyupHandler() {
    let value = this.inputField.value

    if(value == '') {
      clearTimeout(this.writingTimer)
      this.hideLoader()
      this.hideResults()
      this.prevValue = ''
    }

    if(value != '' && value != this.prevValue) {
      clearTimeout(this.writingTimer)
      this.showLoader()
      this.hideResults()
      this.writingTimer = setTimeout(() => {
        this.sendRequest()
      }, 750)
      this.prevValue = value
    }
  }

  sendRequest() {
    axios.post('/search', {_csrf: this._csrf, searchTerm: this.inputField.value}).then(response => {
      console.log(response.data)
      this.renderResultsHtml(response.data)
    }).catch((err) => {
      console.log(err)
    })
  }

  showLoader() {
    this.loader.classList.add('circle-loader--visible')
  }

  hideLoader() {
    this.loader.classList.remove('circle-loader--visible')
  }

  showResults() {
    this.resultsArea.classList.add('live-search-results--visible')
  }

  hideResults() {
    this.resultsArea.classList.remove('live-search-results--visible')
  }


  openOverlay() {
    this.overlay.classList.add('search-overlay--visible')
    setTimeout(() => this.inputField.focus(), 50)
  }

  closeOverlay() {
    this.overlay.classList.remove('search-overlay--visible')
  }

  renderResultsHtml(data) {
    if(data.length) {
      this.resultsArea.innerHTML = DOMPurify.sanitize(`
      <div class="list-group shadow-sm">
      <div class="list-group-item active"><strong>Search Results</strong> (${(data.length > 1) ? `${data.length} Items found` : '1 Item found'})</div>

      ${data.map(post => {
        let createDate = new Date(post.createDate)
        return `<a href="/posts/${post._id}" class="list-group-item list-group-item-action">
        <img class="avatar-tiny" src="${post.author.avatar}"> <strong>${post.title}</strong>
        <span class="text-muted small">by ${post.author.username} on ${createDate.getMonth()+1}/${createDate.getDate()}/${createDate.getFullYear()}</span>
      </a>`
      }).join('')}

    </div>
      `)
    } else {
      this.resultsArea.innerHTML = `
        <p class="alert alert-warning text-center shadow-sm">Sorry, we could not find anything that matches your query.</p>
      `
    }

    this.showResults()
    this.hideLoader()
  }

  injectHtml() {
    document.body.insertAdjacentHTML('beforeend', `<div class="search-overlay">
    <div class="search-overlay-top shadow-sm">
      <div class="container container--narrow">
        <label for="live-search-field" class="search-overlay-icon"><i class="fas fa-search"></i></label>
        <input type="text" id="live-search-field" class="live-search-field" placeholder="What are you interested in?">
        <span class="close-live-search"><i class="fas fa-times-circle"></i></span>
      </div>
    </div>

    <div class="search-overlay-bottom">
      <div class="container container--narrow py-3">
        <div class="circle-loader"></div>
        <div class="live-search-results"></div>
      </div>
    </div>
  </div>`)
  }
}