import Search from './modules/Search'
import Chat from './modules/Chat'
import RegistrationForm from './modules/RegistrationForm'

if(document.querySelector('#registration-form')) {
  new RegistrationForm()
}

if(document.querySelector('#chat-wrapper')) {
  new Chat()
}

if(document.querySelector('.header-search-icon')) {
  new Search()
}