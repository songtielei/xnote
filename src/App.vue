<script setup lang="ts">
import { ref, reactive, shallowRef, onMounted, watch } from 'vue'
import 'cherry-markdown/dist/cherry-markdown.min.css'
import CherryMarkdown from './components/CherryMarkdown.vue'
import Appearance from './components/ConfigAppearance.vue'
import { parse, stringify } from './utils/front_matter'
import moment from 'moment';

import * as indexedDBUtil from './utils/indexedDBUtil'
import { FlexSearchHelper } from './utils/flexsearch-helper'

import Modal from './components/Modal.vue'


//   const opfsRoot = await navigator.storage.getDirectory();
// // 类型为 "directory"、名称为 "" 的 FileSystemDirectoryHandle。
// console.log(opfsRoot);
// const fileHandle = await opfsRoot.getFileHandle("my first file", {
//   create: true,
// });
// console.log('file created');
// const directoryHandle = await opfsRoot.getDirectoryHandle("my first folder", {
//   create: true,
// });
// const nestedFileHandle = await directoryHandle.getFileHandle(
//   "my first nested file",
//   { create: true },
// );
// const nestedDirectoryHandle = await directoryHandle.getDirectoryHandle(
//   "my first nested folder",
//   { create: true },
// );
// console.log('file created');
// const existingFileHandle = await opfsRoot.getFileHandle("my first file");
// const existingDirectoryHandle =
//   await opfsRoot.getDirectoryHandle("my first folder");
//   const contents = "Some text";
// // 获取一个可写流。
// const writable = await fileHandle.createWritable();
// // 将文件内容写入数据流。
// await writable.write(contents);
// // 关闭数据流，保存内容。
// await writable.close();
//   const file = await fileHandle.getFile();
// console.log(await file.text());

interface Content {
  name: string;
  content: string;
}
let showPreference = ref(true)
let contentList = ref<any>([])

let currentFileItem;
let tags = ref<any>([])
let title = ref<string>('')
let markdownContent = ref<string>('')
let showAccount = ref(false);

const modalSettingRef = ref();
const openSetting = () => {
  modalSettingRef.value.open();
}

const modalConfirmRef = ref();
const openConfirm = () => {
  modalConfirmRef.value.open();
}

async function content(fileItem) {
  currentFileItem = fileItem;
  if (!currentFileItem.parsedMarkdown.tags) {
    tags.value = []
  } else {
    tags.value = currentFileItem.parsedMarkdown.tags
  }
  
  title.value = currentFileItem.parsedMarkdown.title
  markdownContent.value = currentFileItem.parsedMarkdown._content
}

// write file
async function writeFile(fileHandle, contents) {
  // Create a FileSystemWritableFileStream to write to.
  const writable = await fileHandle.createWritable()
  // Write the contents of the file to the stream.
  await writable.write(contents)
  // Close the file and write the contents to disk.
  await writable.close()
}


async function handleScroll() {

}

async function verifyPermission(dirHandle: FileSystemDirectoryHandle, mode = ''): Promise<boolean> {
  const options = { mode };
  console.log(dirHandle);
    // 检查当前权限状态
    const query = await dirHandle.queryPermission(options).catch((error) => {
      console.log('权限查询失败:', error);
    });
    console.log('权限查询结果:', query);
    if (query === 'granted') {
      return true;
    }
    const request = await dirHandle.requestPermission(options).catch((error) => {
      console.log('权限请求失败:', error);
    });
    console.log('权限请求结果:', request);
    if (request === 'granted') {
      return true;
    }

  return false;
}

/**
 * 显示工作区内容
 *
 * @param handle 文件系统目录句柄
 * @returns 无返回值
 */
async function displayWorkspace(handle: FileSystemDirectoryHandle) {

  contentList.value.length = 0

  // TO FIX
  for await (const h of (handle as any).values()) {
    if (h.kind === 'directory') {
      continue;
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
      summary: parsedMarkdown._content.substring(0, 30),
      name: file.name.slice(0, -3),
      ext: file.name.slice(-3),
      get fileName() {
        return this.name + this.ext
      },
      parsedMarkdown: parsedMarkdown,
      handle: h,
    }
    contentList.value.push(fileItem)

  }
  if (contentList.value.length > 0) {
    contentList.value.sort((a, b) => {
      // 按照修改时间排序 修改时间晚的排前面
      if (a.parsedMarkdown.updated !== undefined && b.parsedMarkdown.updated !== undefined) {
        return new Date(b.parsedMarkdown.updated).getTime() - new Date(a.parsedMarkdown.updated).getTime();
      } else if (a.parsedMarkdown.updated === undefined && b.parsedMarkdown.updated !== undefined) {
        return 1;
      } else if (a.parsedMarkdown.updated !== undefined && b.parsedMarkdown.updated === undefined) {
        return -1;
      } else {
        return b.handle.getFile().lastModified > a.handle.getFile().lastModified;
      }
    })
  }
  if (contentList.value.length > 0) {
    currentFileItem = contentList.value[0]
    content(currentFileItem)
  }

  
 
  contentList.value.forEach(item => {
    const content = {
      name: item.name,
      content: item.parsedMarkdown._content
    }
    contentSearch.add(item.name, content);
  })

}

const contentSearch = new FlexSearchHelper<Content>(['name', 'content']);

function mdChange(mdHtml, mdTxt, mdContent) {
  currentFileItem.parsedMarkdown._content = mdContent;
}

//TODO category
function saveContent() {
  const fileHandle = currentFileItem.handle;
  const c = currentFileItem.parsedMarkdown._content
  currentFileItem.parsedMarkdown.tags = tags.value
  currentFileItem.parsedMarkdown.title = title.value
  if (!currentFileItem.parsedMarkdown.date) {
    currentFileItem.parsedMarkdown.date = new Date()
  }
  currentFileItem.parsedMarkdown.updated = new Date()
  const content = stringify(currentFileItem.parsedMarkdown, { mode: '', separator: '---', prefixSeparator: true });
  currentFileItem.parsedMarkdown._content = c
  markdownContent.value = currentFileItem.parsedMarkdown._content;
  writeFile(fileHandle, content);
}

async function newFile() {
  const file = new Date().getTime();
  const ext = '.md';
  const noteDirectoryHandle = await currentHandle.value?.file.getDirectoryHandle('note', { create: true });
  const draftHandle = await noteDirectoryHandle.getFileHandle(file + ext, { create: true });
  const item = {
    summary: '',
    name: '',
    ext: '.md',
    get fileName() {
      return this.name + this.ext;
    },
    parsedMarkdown: {},
    handle: draftHandle
  }
  
  currentFileItem = item
  tags.value = []
  title.value = ''
  saveContent()
  contentList.value.unshift(item)

  content(item)
}
function addTag(event) {
  tags.value.push(event.target.value)
  event.target.value = ''
}

// 进入页面时检测是否有默认的文件夹
// 如果没有则打开设置页面 新建或选择文件夹
// 如果有则进入首页

let currentHandle = ref<indexedDBUtil.FileHandleDO>();

onMounted(async () => {

  currentHandle.value = await indexedDBUtil.getCurrentFileHandle(indexedDBUtil.defaultObjectStoreName);
  if (!currentHandle.value) {
    return;
  }
  showPreference.value = false;
  const hasPermission = await queryPermission(currentHandle.value.file);
  if (!hasPermission) {
    modalConfirmRef.value.open();
    return;
  } else {
    const noteDirectoryHandle = await currentHandle.value.file.getDirectoryHandle('note', { create: true });
    //displayWorkspace(noteDirectoryHandle);
    getTreeData(currentHandle.value.file);
  }

})
async function queryPermission(dirHandle: FileSystemDirectoryHandle, mode = 'readwrite'): Promise<boolean> {
  const options = { mode };
  console.log(dirHandle);
    // 检查当前权限状态
    const query = await dirHandle.queryPermission(options).catch((error) => {
      console.log('权限查询失败:', error);
    });
    console.log('权限查询结果:', query);
    if (query === 'granted') {
      return true;
    }

  return false;
}

// 搜索
const searchInput = ref('');
const oldList = contentList.value;
// 搜索
async function performSearch() {
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
  contentList.value = contentList.value.filter(item => resultsSet.has(item.name));
}

// 笔记目录
import Tree from './components/tree/Tree.vue'

interface TreeNode {
  id: string;
  label: string;
  dirHandle?: FileSystemDirectoryHandle;
  expanded?: boolean;
  children?: TreeNode[];
}

let treeData = ref([]);
const selectDir = ref('')
const showIndex = ref(false)

function onNodeToggle(node) {
  console.log('Node toggled:', node);
}

function onNodeSelect(node) {
  // 清除所有选中状态
  const clearSelection = (nodes) => {
    nodes.forEach(n => {
      n.selected = false;
      if (n.children) clearSelection(n.children);
    });
  };
  
  clearSelection(treeData.value);
  
  // 设置当前节点选中
  node.selected = true;
  console.log('Node selected:', node);
  selectDir.value = node.label;
  showIndex.value = false;
  displayWorkspace(node.dirHandle);
}

const recursiveGetTreeData = async (directoryHandle: FileSystemDirectoryHandle): Promise<TreeNode> => {
  const treeNode: TreeNode = {
    id: directoryHandle.name,
    label: directoryHandle.name,
    dirHandle: directoryHandle,
    expanded: false,
    children: []
  }
  for await (const h of directoryHandle.values()) {
    if (h.kind === 'file') {
      continue;
    }
    const childTreeNode = await recursiveGetTreeData(h);
    treeNode.children.push(childTreeNode);
  }
  return treeNode;
}

const getTreeData = async (handle: FileSystemDirectoryHandle) => {
  const noteDirectoryHandle = await handle.getDirectoryHandle('note', { create: false });
  const data = await recursiveGetTreeData(noteDirectoryHandle);
  data.label = currentHandle.value?.file.name;
  treeData.value = [data];
  onNodeSelect(treeData.value[0]);
  
}

const confirmDirHandle = async () => {
  const hasPermission = await verifyPermission(currentHandle.value.file, 'readwrite');
  if (!hasPermission) {
    return;
  }
  const noteDirectoryHandle = await currentHandle.value.file.getDirectoryHandle('note', { create: true });
  displayWorkspace(noteDirectoryHandle);
  modalConfirmRef.value.close();
}

</script>

<template>
  <main>
    <div class="sidebar">
      <div class="account">
        <img src="./assets/avatar.png" @click="() => {showAccount = !showAccount}"/>
      </div>
      <div v-show="showAccount" style="position: absolute; left: 54px; top: 0px; width: 300px; z-index: 100; border: solid 1px; height: calc(100vh - 15px); margin: 4px; background-color: white;">
        <div>songtielei</div>
        <div>主题</div>
        <div>语言</div>
        <div class="setting" @click="() => { showPreference = true }">
          设置
        </div>
        <div>退出</div>
      </div>
      <div>笔记</div>
      <div>剪藏</div>
      <!--
      <div>密码</div>
      <div>任务</div>
      -->
      <div>标签</div>
      
      <div class="setting" @click="openSetting">
        仓库
      </div>
    </div>
    <div class="nav" @scroll="handleScroll">
      <div class="nav-search">
        <input type="text" placeholder="搜索" v-model="searchInput" @keyup.enter="performSearch" />
      </div>
      <div class="nav-workspace">
        
        <Tree :data="treeData" :showIndex="showIndex" :select-dir="selectDir" @node-toggle="onNodeToggle" @node-select="onNodeSelect">
          <template #default="{ node }">
            <span>{{ node.label }}</span>
            <span v-if="node.selected" style="margin-left: 8px; color: green">✓</span>
          </template>
        </Tree>
        <!-- <span class="workspace-item" @click="displayWorkspace((currentHandle as any).file)">
          {{ (currentHandle as any)?.file.name }}
        </span> -->
        <button @click="newFile">新建</button>
      </div>
      <div class="item-list">
        <div class="item" v-for="item in contentList" :key="item.date" @click="content(item)">
          <div class="title">{{ item.parsedMarkdown?.title }}</div>
          <div class="summary">{{ item.summary }}</div>
          <div class="date">{{ moment(item.parsedMarkdown?.date).format('YYYY-MM-DD') }}</div>
        </div>
      </div>


    </div>
    <div class="content">
      <div class="contentHeader">
        <input class="title" type="text" placeholder="标题" v-model="title"/>

        <button class="save" @click="saveContent">保存</button>
      </div>
      <CherryMarkdown :tocVisiable="false" :value="markdownContent" v-on:mdChange="mdChange" :dirRoot="currentHandle?.file" :currentItem="currentFileItem" />
      <div class="footer">
        <ul class="tag">
          <li v-for="tag in tags" :key="tag">{{ tag }}</li>
        </ul>
        <input class="addTag" type="text" placeholder="添加标签" @keyup.enter="addTag" />
      </div>
    </div>
  </main>

  <Modal ref="modalSettingRef">
    <Appearance />
  </Modal>
  <Modal ref="modalConfirmRef">
    <button @click="confirmDirHandle">确认</button>
  </Modal>

</template>

<style scoped lang="scss">
:root {
  font-size: 1rem;
  --line-height: 1em;
}

* {
  box-sizing: border-box;
}

main {
  height: 100%;
  display: flex;
  border: solid 0px;

    >.sidebar {
      position: relative;
      padding: 5px 0;
      margin: 4px;
      width: 50px;
      border-radius: 5px;
      border: solid 1px;
      height: calc(100% - 8px);
      display: flex;
      flex-direction: column;
      align-items: center;
      div {
        margin-bottom: 5px;
      }

      >.account {
        padding: 0;
        border: solid 1px;
        border-radius: 30px;
        background-color: black;
        overflow: hidden;
        >img {
          cursor: pointer;
          width: 40px;
          display: block; /* 阻止图片下方出现额外的空间 */  
        }
      }

      >.setting {
        margin-top: auto;
        cursor: pointer;
      }
    }



  >.nav {
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

  >.content {
    margin: 4px;
    border-radius: 5px;
    border: solid 1px;

    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: left;
    //padding-top: 50px;
    //background-color: #f5f7f9;
    >.contentHeader {
      //position: relative; 
      //top: 0px; 
      //width: 100%; 
      display: flex; 
      align-items: center;
      border-bottom: solid 1px; 
      height: 30px; 
      padding: 0.2em 0.5em;

      >.title {
        width: 300px; 
        height: 20px;
      }


      >.save {
        margin-left: auto;
      }
    }
    >.footer {
      height: 30px;
      display: flex; 
      align-items: center;
      padding: 0.2em 0.5em;
      >.tag {

        display: inline-block; 
        margin: 0px;
        padding: 0px;
        >li {
          display: inline-block; 
          border: solid 1px; 
          margin-right: 3px;

          padding: 0px 10px; 
          border-radius: 3px;
        }
      }
      >.addTag {
        width: 60px;
        height: 20px;
      }
    }
  }
}



</style>
