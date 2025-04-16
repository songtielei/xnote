import { createRouter, createWebHistory } from 'vue-router'
import Layout from '@/layout/Layout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Layout,
      children: [
        {
          path: '/note',
          name: 'note',
          component: () => import('@/views/AppView.vue'),
        },
        {
          path: '/web-clipper',
          name: 'webClipper',
          component: () => import('@/views/AppView.vue'),
        },
      ]
    },

  ]
})

export default router
