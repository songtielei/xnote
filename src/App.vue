<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import HelloWorld from './components/HelloWorld.vue'
import { ref, reactive, shallowRef, onMounted } from 'vue'
import Cherry from 'cherry-markdown'
import 'cherry-markdown/dist/cherry-markdown.min.css'
import CherryMarkdown from './components/CherryMarkdown.vue'
import Appearance from './components/Appearance.vue'
import { parse, stringify } from './utils/front_matter'
import moment from 'moment';

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


let showPreference = ref(true)
const contentList = ref<any>([])

let currentFileItem;
let tags = ref<any>([])
let title = ref<string>('')
let markdownContent = ref<string>('')


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


/**
 * 显示工作区内容
 *
 * @param handle 文件系统目录句柄
 * @returns 无返回值
 */
async function displayWorkspace(handle: FileSystemDirectoryHandle) {
  let isLoad = false
  let fileItem;
  const query = await handle.queryPermission({})
  if (query !== 'granted') {
    const request = await handle.requestPermission({})

  }
  contentList.value.length = 0

  for await (const h of handle.values()) {
    if (h.kind === 'directory') {
      continue
    }
    const file = await h.getFile()
    if (file !== null && !file.name.startsWith('.')) {
      const text = await file.text()
      const parsedMarkdown = parse(text)
      const fileItem = {
        summary: parsedMarkdown._content.substring(0, 20),
        parsedMarkdown: parsedMarkdown,
        handle: h
      }
      contentList.value.push(fileItem)

    }
  }
  if (contentList.value.length > 0) {
    contentList.value.sort((a, b) => {
      // 按照修改时间排序 修改时间晚的排前面
      if(!b.parsedMarkdown.updated) {
        return 1;
      }
      if (!a.parsedMarkdown.updated) {
        return 1;
      }
      return new Date(b.parsedMarkdown.updated).getTime() - new Date(a.parsedMarkdown.updated).getTime();
    })
  }
  currentFileItem = contentList.value[0]
  content(currentFileItem)

}

async function checkPermission(fileHandle) {
  const query = await fileHandle.queryPermission({})
  workspaceList.value.push(fileHandle);

}

function mdChange(mdHtml, mdTxt, mdContent) {
  currentFileItem.parsedMarkdown._content = mdContent;
}

function saveContent() {
  const fileHandle = currentFileItem.handle;
  const c = currentFileItem.parsedMarkdown._content
  currentFileItem.parsedMarkdown.tags = tags.value
  currentFileItem.parsedMarkdown.title = title.value
  if (!currentFileItem.parsedMarkdown.date) {
    currentFileItem.parsedMarkdown.date = new Date()
  }
  currentFileItem.parsedMarkdown.updated = new Date()
  const content = stringify(currentFileItem.parsedMarkdown, { mode: 'yaml', separator: '---', prefixSeparator: true });
  currentFileItem.parsedMarkdown._content = c
  markdownContent.value = currentFileItem.parsedMarkdown._content;
  writeFile(fileHandle, content);
}

async function newFile() {
  const fileName = new Date().getTime() + '.md';
  console.log(fileName)
  const draftHandle = await currentDir.value.file.getFileHandle(fileName, { create: true });
  const item = {
    summary: '',
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

let currentDir = ref();

onMounted(async () => {
  const dbName = 'xzfilehandle'
  const req = indexedDB.open(dbName, 1);

  req.onsuccess = (ev) => {
    let db = req.result
    let reqq = db.transaction('handle', 'readwrite')?.objectStore('handle').openCursor();

    reqq.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        if (cursor.value.current) {
          showPreference.value = false;
          currentDir.value = cursor.value;
          displayWorkspace(currentDir.value.file);
        } else {
          cursor.continue();
        }

      }

    }

  };

})

</script>

<template>
  <main>
    <div class="sidebar">
      <div class="top-group">

        <div class="account">
          <img src="src/assets/avatar.png" />
        </div>
        <div>笔记</div>
        <div>标签</div>
        <div>文件</div>
      </div>
      <div class="bottom-group">
        <div @click="() => {
          showPreference = true
        }
          ">
          设置
        </div>
      </div>
    </div>
    <div class="nav" @scroll="handleScroll" style="padding-top: 50px;">
      <div style="position: absolute; top: 0px; border-bottom: solid 1px; width: 300px; height: 50px;">
        <div class="workspace-item" @click="displayWorkspace(currentDir.file)">
          {{ currentDir?.file.name }}
        </div>
        <div><button @click="newFile">新建</button></div>
      </div>
      <div class="item-list">
        <div class="item" v-for="item in contentList" @click="content(item)">
          {{ moment(item.parsedMarkdown?.date).format('YYYY-MM-DD HH:mm:ss') }} <br /> {{ item.summary }}
        </div>
      </div>


    </div>
    <div class="content">
      <div class="contentHeader">
        <input class="title" type="text" placeholder="标题" v-model="title"/>
        <ul class="tag">
          <li v-for="tag in tags">{{ tag }}</li>
        </ul>
        <input class="addTag" type="text" placeholder="添加标签" @keyup.enter="addTag" />
        <button @click="saveContent" style="float: right;">保存</button>
      </div>
      <CherryMarkdown :tocVisiable="false" :value="markdownContent" v-on:mdChange="mdChange" />

    </div>
  </main>

  <div class="modal" v-if="showPreference">
    <div class="modal-backdrop"></div>
    <div class="modal-body">
      <div class="modal-head">
        <button class="modal-close" @click="() => { showPreference = false}">close</button>
      </div>
      
      <Appearance />
    </div>
  </div>
</template>

<style scoped lang="scss">
.modal {
  //display: block;
  z-index: 100;
  .modal-backdrop {
    z-index: 100;
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background-color: rgba(0, 0, 0, 0.5);
  }
  .modal-body {
    z-index: 101;
    position: fixed;
    top: 3em;
    bottom: 3em;
    right: 20%;
    left: 20%;
    padding: 2em, 3em;
    background-color: white;
    overflow: auto;
    border-radius: 5px;
    .modal-head {
      height: 40px;
      .modal-close {
        cursor: pointer;
        position: absolute;
        top: 0.3em;
        right: 0.3em;
        padding: 0.3em;
        font-size: 2em;
        height: 1em;
        width: 1em;
        text-indent: 10em;
        overflow: hidden;
        border: 0;

      }
      .modal-close::after {
        position: absolute;
        line-height: 0.5;
        top: 0.3em;
        left: 0.2em;
        text-indent: 0;
        content: "\00D7"
      }
    }
  }
}


main {
  height: 100%;
  display: flex;
  border: solid 0px;

  >.sidebar {
    width: 50px;

    //background-color: white;
    >.top-group {
      position: absolute;
      top: 0px;
      >.account {
        border-radius: 30px;
        background-color: black;
        overflow: hidden;
      }
    }
    >.bottom-group {
      position: absolute;
      bottom: 0px;
    }
  }

  >.nav {
    border-left: solid 1px;
    border-right: solid 1px;
    width: 300px;
    overflow: hidden;

    //background-color: white;

    .item-list {
      height: 100%;
      overflow: auto;
      

      .item {
        border-bottom: solid 1px;
        border-right: solid 1px;
        height: 90px;
      }
    }

  }

  >.content {
    flex: 1;
    //padding-top: 50px;
    //background-color: #f5f7f9;
    .contentHeader {
      //position: relative; 
      //top: 0px; 
      //width: 100%; 
      height: 44px; 
      border-bottom: solid 1px;
      >.title {
        width: 300px; 
        height: 20px;
      }
      >.tag {
        display: inline-block; 
        margin: 0px;
        >li {
          display: inline-block; 
          border: solid 1px; 
          margin-right: 3px; 
          padding: 2px 10px; 
          border-radius: 5px;
        }
      }
      >.addTag {
        height: 20px;
      }
    }
  }
}



</style>
