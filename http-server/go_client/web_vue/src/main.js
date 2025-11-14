import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Antd from 'ant-design-vue';
import App from './App.jsx'
import './index.css'
import 'ant-design-vue/dist/reset.css';

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(Antd)
app.mount('#app')
