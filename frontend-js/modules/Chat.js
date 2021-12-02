import DOMPurify from "dompurify"

export default class Chat {
  constructor() {
    this.openYet = false
    this.chatWrapper = document.querySelector('#chat-wrapper')
    this.openIcon = document.querySelector('.header-chat-icon')
    this.injectHtml()
    this.closeIcon = document.querySelector('.chat-title-bar-close')
    this.chatForm = document.querySelector('#chatForm')
    this.chatField = document.querySelector('#chatField')
    this.chatLog = document.querySelector('#chat')
    this.events()
  }

  events() {
    this.chatForm.addEventListener('submit', e => {
      e.preventDefault()
      this.sendChatMessage()
    })
    this.openIcon.addEventListener('click', () => {
      this.openChat()
    })
    this.closeIcon.addEventListener('click', () => {
      this.closeChat()
    })
  }

  sendChatMessage() {
    let msg = this.chatField.value
    this.socket.emit('msgFromClient', {message: msg})
    this.displayOwnMessage(msg)
    this.chatField.value = ''
    this.chatField.focus()
  }

  injectHtml() {
    this.chatWrapper.innerHTML = `
    <div class="chat-title-bar">Chat <span class="chat-title-bar-close"><i class="fas fa-times-circle"></i></span></div>

    <div id="chat" class="chat-log"></div>

    <form id="chatForm" class="chat-form border-top">
      <input type="text" class="chat-field" id="chatField" placeholder="Type a message…" autocomplete="off">
    </form>
    `
  }

  openChat() {
    if(!this.openYet) {
      this.socket = io()
      this.socket.on('msgFromServer', msg => {
        this.displayMsgFromServer(msg)
      })
      this.socket.on('welcome', msg => {
        this.avatar = msg.avatar
      })
    }
    this.openYet = true
    this.chatWrapper.classList.add('chat--visible')
    this.chatField.focus()
  }

  closeChat() {
    this.chatWrapper.classList.remove('chat--visible')
  }

  displayMsgFromServer(data) {
    this.chatLog.insertAdjacentHTML('beforeend', DOMPurify.sanitize(`
    <div class="chat-other">
      <a href="#"><img class="avatar-tiny" src="${data.avatar}"></a>
      <div class="chat-message"><div class="chat-message-inner">
        <a href="#"><strong>${data.username}:</strong></a>
        ${data.message}
      </div></div>
    </div>
  `))
    this.chatLog.scrollTop = this.chatLog.scrollHeight
  }

  displayOwnMessage(msg) {
    this.chatLog.insertAdjacentHTML('beforeend', DOMPurify.sanitize(`
    <div class="chat-self">
      <div class="chat-message">
        <div class="chat-message-inner">
          ${msg}
        </div>
      </div>
      <img class="chat-avatar avatar-tiny" src="${this.avatar}">
    </div>
  `))
    this.chatLog.scrollTop = this.chatLog.scrollHeight
  }
}