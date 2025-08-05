import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import ui from './ui-provider'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import ganttastic from './components/RbGantt/vue-ganttastic'

const app = createApp(App)
app.use(ganttastic)
app.use(ui)
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}
app.mount('#app')

