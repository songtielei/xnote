import { createApp } from 'vue'
import type { DirectiveBinding, ComponentPublicInstance } from 'vue'
import App from './App.vue'
import router from './router'

const app = createApp(App)

// app.directive('click-outside', (el: HTMLElement, binding: DirectiveBinding) => {
//     const handler = (event: MouseEvent) => {
//       if (!(el === event.target || el.contains(event.target as Node))) {
//         // 使用 binding.instance 替代 vnode.context
//         const instance: ComponentPublicInstance | null = binding.instance
//         if (!instance) {
//             return;
//         }
//         if (instance && typeof binding.value === 'function') {
//           (binding.value)(event)
//         }
//       }
//     }
//     el.clickOutsideEvent = handler
//     document.body.addEventListener('click', handler)
//     // 清理事件监听器
//     const unbind = () => {
//       document.body.removeEventListener('click', handler)
//       delete el.clickOutsideEvent
//     }
//     el._clickOutsideUnbind = unbind
// })
// // 挂载时清理指令
// app.directive('unbind-click-outside', {
// unmounted(el: HTMLElement) {
//     if (el._clickOutsideUnbind) {
//     el._clickOutsideUnbind()
//     }
// }
// })

app.use(router)

app.mount('#app')
