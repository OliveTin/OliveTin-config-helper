import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import 'femtocrank/style.css'
import './global.css'

createApp(App).use(router).mount('#app')

