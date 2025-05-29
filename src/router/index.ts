import { createRouter, createWebHistory } from 'vue-router'
import Layout from '@/layout/Layout.vue'
import * as indexedDBUtil from '@/utils/indexedDBUtil'

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
                {
          path: '/tag',
          name: 'tag',
          component: () => import('@/views/AppView.vue'),
        },
        {
          path: '/settings',
          name: 'settings',
          component: () => import('@/views/Settings.vue'),
        }
      ]
    },

  ]
})

// 进入页面时检测是否有默认的文件夹
// 如果没有则打开设置页面 新建或选择文件夹
async function queryPermission(dirHandle: FileSystemDirectoryHandle, mode = 'readwrite'): Promise<boolean> {
  const options = { mode };
  console.log(dirHandle);
  // 检查当前权限状态
  const query = await (dirHandle as any).queryPermission(options).catch((error) => {
    console.log('权限查询失败:', error);
  });
  console.log('权限查询结果:', query);
  if (query === 'granted') {
    return true;
  }

  return false;
}

router.beforeEach(async (to, from, next) => {
  console.log('路由变化:', to, from);
  const activeStorage = await indexedDBUtil.getActiveStorage();
  if (to.name !== 'settings' && !activeStorage) {
    next('/settings');
    return;
  }
  const hasPermission = await queryPermission(activeStorage.file);
  if (to.name !== 'settings' && !hasPermission) {
    next('/settings');
    return;
  }

  next();
})


export default router
