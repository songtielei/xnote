<template>
  <div class="nav">
    <div class="nav-search">
      <input type="text" placeholder="搜索" v-model="searchInput" @keyup.enter="performSearch" />
    </div>
    <div class="nav-workspace">
      <DirTree v-if="storageLoaded" :activeStorage="activeStorage" :workspace="workspace" @update:selectDir="selectDir" />
      <button @click="newFile">新建</button>
    </div>
    <div class="item-list">
      <div class="item" v-for="item in contentList" :key="item.name" @click="content(item)">
        <div class="title">{{ item.title }}</div>
        <div class="summary">{{ item.summary }}</div>
        <div class="date">{{ moment(item.date).format('YYYY-MM-DD') }}</div>
      </div>
    </div>


  </div>
  <Content v-if="dataLoaded" :currentFileItem="currentFileItem" @update:list="updateList"></Content>
  <Modal ref="modalConfirmRef">
    <button @click="confirmDirHandle">确认</button>
  </Modal>
</template>
<script setup lang="ts">
import { ref, onMounted, onBeforeMount } from 'vue';
import { useRoute } from 'vue-router';
import type { CustomStorage } from '@/utils/indexedDBUtil';
import * as indexedDBUtil from '@/utils/indexedDBUtil'
import { FlexSearchHelper } from '@/utils/flexsearch-helper'
import Content from '@/components/content'
import DirTree from '@/components/DirTree.vue'
import type { TreeNode } from '@/components/DirTree.vue'
import Modal from '@/components/Modal.vue'
import moment from 'moment';
import type { FileItem } from '@/components/content/types'
import { parse, stringify } from '@/utils/front_matter'

const route = useRoute();
const storageLoaded = ref(false);
const dataLoaded = ref(false);
const workspace = route.path.split('/')[1];

const currentFileItem = ref<FileItem>();
const contentList = ref<FileItem[]>([]);

const updateList = () => {
  contentList.value = [];
}


const selectDir = async (treeNode: TreeNode) => {
  const noteList = await indexedDBUtil.getNoteByPath(treeNode.path, null);
  contentList.value.push(...noteList.data);
  currentFileItem.value = contentList.value[0];
  dataLoaded.value = true;
}
const content = (item: FileItem) => {
  currentFileItem.value = item;
}


const recursiveGetTreeData = async (parentPath: string, handle: FileSystemDirectoryHandle): Promise<FileItem[]> => {
  const contentList: FileItem[] = [];
  for await (const h of (handle as any).values()) {
    if (h.kind === 'directory') {
      const childList = await recursiveGetTreeData(parentPath + '/' + handle.name, h);
      contentList.push(...childList);
    }
    const file = await h.getFile()
    if (file === null || file.name.startsWith('.')) {
      continue;
    }
    if (file.name.slice(-3) !== '.md') {
      continue;
    }

    const text = await file.text()
    const parsedMarkdown = parse(text)
    const fileItem = {
      id: Date.now(),
      path: parentPath,
      name: file.name.slice(0, -3),
      url: '',
      title: parsedMarkdown.title,
      summary: parsedMarkdown._content.substring(0, 30),
      tags: parsedMarkdown.tags,
      updated: parsedMarkdown.updated || new Date(),
      date: parsedMarkdown.date || new Date(),
      handle: h,
    }
    contentList.push(fileItem)

    const content = {
      id: fileItem.id,
      title: fileItem.title,
      content: parsedMarkdown._content
    }
    console.log(content);
    contentSearch.add(content.id, content);

  }
  return contentList;
}

// 搜索内容
interface SearchContent {
  id: number;
  title: string;
  content: string;
}
const contentSearch = new FlexSearchHelper<SearchContent>(['title', 'content']);
const searchInput = ref('');
let oldList;
// 搜索
async function performSearch() {
  if (!oldList) {
    oldList = contentList.value;
  }

  if (!searchInput.value) {
    // 如果搜索框为空，恢复原始列表
    contentList.value = oldList;
    return;
  }
  // 简单搜索
  const results = await contentSearch.search(searchInput.value);
  const resultsSet = new Set();
  results.forEach(result => {
    resultsSet.add(result.id);
  });
  console.log(resultsSet);
  contentList.value = contentList.value.filter(item => {console.log(item); resultsSet.has(item.id)});
  console.log(contentList.value);
}

/**
 * 显示工作区内容
 *
 * @param handle 文件系统目录句柄
 * @returns 无返回值
 */
async function addFileItemToDB(handle: FileSystemDirectoryHandle) {
  const contentList = await recursiveGetTreeData(handle.name, handle);
  const objectStore = await indexedDBUtil.getObjectStore(indexedDBUtil.noteObjectStore);
  console.log('开始添加数据到indexedDB...')
  contentList.forEach((item) => {
    console.log(item);
    const r = objectStore.add(item);
    r.onerror = (err) => {
      console.log('添加失败', err);
    }
  })
  console.log('添加数据到indexedDB完成...')
}

const newFile = () => {

}
// 进入页面时检测是否有默认的文件夹
// 如果没有则打开设置页面 新建或选择文件夹
// 如果有则进入首页

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
async function requestPermission(dirHandle: FileSystemDirectoryHandle, mode = 'readwrite'): Promise<boolean> {
  const options = { mode };

  const request = await (dirHandle as any).requestPermission(options).catch((error) => {
    console.log('权限请求失败:', error);
  });
  console.log('权限请求结果:', request);
  if (request === 'granted') {
    return true;
  }

  return false;
}

const modalConfirmRef = ref();
const openConfirm = () => {
  modalConfirmRef.value.open();
}
const confirmDirHandle = async () => {
  if (!activeStorage.value) {
    return;
  }
  const hasPermission = await requestPermission(activeStorage.value.file, 'readwrite');
  if (!hasPermission) {
    return;
  }
  modalConfirmRef.value.close();
}

const activeStorage = ref<CustomStorage>();
onBeforeMount(async () => {

  activeStorage.value = await indexedDBUtil.getActiveStorage();
  if (!activeStorage.value) {
    return;
  }
  storageLoaded.value = true;
  const hasPermission = await queryPermission(activeStorage.value.file);
  if (!hasPermission) {
    openConfirm();
    return;
  }
  const noteDirectoryHandle = await activeStorage.value?.file.getDirectoryHandle(workspace, { create: true });
  await addFileItemToDB(noteDirectoryHandle);
})
</script>
<style scoped lang="scss">
.nav {
  margin: 4px;
  border-radius: 5px;
  border: solid 1px;
  width: 300px;
  overflow: hidden;

  //background-color: white;
  >.nav-search {
    >input {
      width: 100%;
    }
  }

  >.nav-workspace {
    position: relative;
    border-bottom: solid 1px;
    height: 30px;
    padding: 0;

    >span {
      flex: 1;
    }

    >button {
      position: absolute;
      top: 0px;
      right: 0px;
      width: 70px;
    }

  }

  .item-list {
    height: 100%;
    overflow: auto;

    .item {
      margin: 0;
      border-bottom: solid 1px;
      height: 100px;
      padding: 5px 10px;

      .title {
        padding: 0 10px 0 10px;
        font-size: 1em;
        height: 1.6em;
        overflow: hidden;
      }

      .summary {
        font-size: 12px;
        height: 4em;
      }

      .date {
        font-size: 12px;
        height: 15%;
      }
    }
  }

}
</style>