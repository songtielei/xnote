<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import HelloWorld from './components/HelloWorld.vue'
import { ref, reactive, shallowRef } from 'vue'
import Cherry from 'cherry-markdown'
import 'cherry-markdown/dist/cherry-markdown.min.css'
import CherryMarkdown from './components/CherryMarkdown.vue'
import Appearance from './components/Appearance.vue'

let showPreference = ref(true)
const contentList = ref<any>([])

let currentFile
let currentContent;

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


let contents
let file
let isLoad = false
let markdownContent = ref('')


async function content(handle) {
  currentFile = handle;
  const file = await handle.getFile()
  const text = await file.text()

  markdownContent.value = text
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

const items = ref([{ message: 'Foo' }, { message: 'Bar' }])
// document.getElementById('content').innerHTML =
//       marked.parse('# Marked in the browser\n\nRendered by **marked**.');

async function handleScroll() {

}
function preference() { }
let fileHandle: FileSystemDirectoryHandle
async function displayWorkspace(handle: FileSystemDirectoryHandle) {
  fileHandle = handle;
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
      contentList.value.push({
        content: text.substring(0, 20),
        dateTime: h.lastModified,
        handle: h
      })
      if (!isLoad) {
        markdownContent.value = text
        isLoad = true
      }
    }
  }
  isLoad = false
}






async function checkPermission(fileHandle) {
  const query = await fileHandle.queryPermission({})
  workspaceList.value.push(fileHandle);

}

function mdChange(mdHtml, mdTxt, mdContent) {
  currentContent = mdContent;
}

function saveContent() {
  writeFile(currentFile, currentContent);
}

async function newFile() {
  const draftHandle = await fileHandle.getFileHandle(new Date(), { create: true });
  contentList.value.push({
    content: '',
    dateTime: new Date(),
    handle: draftHandle,
  })
}
// 进入页面时检测是否有默认的文件夹
const dbName = 'xzfilehandle'
let db
const req = indexedDB.open(dbName, 1)
let reqq;
let curr = ref();
req.onsuccess = (ev) => {
  db = req.result
  reqq = db.transaction('handle', 'readwrite')?.objectStore('handle').openCursor();
  reqq.onsuccess = (event) => {
    const cursor = event.target.result;
    if (cursor) {
      console.log(cursor.value.current)
      if (cursor.value.current) {
        showPreference.value = false;
        curr.value = cursor.value.file;
      }
      cursor.continue();
    } else {
      console.log('没有默认文件夹');
    }

  }

}

// let curr;

// 如果没有则打开设置页面 新建或选择文件夹
// 如果有则进入首页

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
    <div class="nav" @scroll="handleScroll">
      <div class="workspace-item" @click="displayWorkspace(curr)">
          {{ curr?.name }}
        </div>
      <div><input /><button @click="newFile">新建</button></div>
      <div class="item" v-for="item in contentList" @click="content(item.handle)">
        {{ item.dateTime }} {{ item.content }}
      </div>
    </div>
    <div class="content">
      <div class="contentHeader" style="position: fixed; top: 0px; width: 100%; height: 50px; border: solid;">
        <button @click="saveContent">保存</button>
      </div>
      <CherryMarkdown :tocVisiable="false" :value="markdownContent" v-on:mdChange="mdChange" />
    </div>
  </main>
  <div class="preference" v-if="showPreference">
    <div class="videoMenu" @click="() => {
        showPreference = false
      }
      ">
      &times;
    </div>
    <Appearance />

  </div>
  <div class="overlay" v-if="showPreference"></div>
</template>

<style scoped lang="scss">
main {
  height: 100%;
  display: flex;
  border: solid 0px;

  >.sidebar {
    width: 50px;

    //background-color: white;
    >.top-group {
      >.account {
        border-radius: 30px;
        background-color: black;
        overflow: hidden;
      }
    }
  }

  >.nav {
    border: solid;
    width: 300px;
    overflow: auto;
    //background-color: white;
  }

  >.content {
    flex: 1;
    padding-top: 50px;
    //background-color: #f5f7f9;
  }
}

.top-group {
  position: absolute;
  top: 0px;
}

.bottom-group {
  position: absolute;
  bottom: 0px;
}

.item {
  border: solid;
  height: 50px;
}

.preference {
  position: absolute;
  width: 500px;
  height: 300px;
  position: fixed;
  z-index: 101;
  top: 0px;
  right: 0px;
  bottom: 0px;
  left: 0px;
  margin: auto;
  //border: solid red;
  background: white
}

.videoMenu {
  height: 30px;
}

.overlay {
  position: fixed;
  z-index: 100;
  top: 0;
  right: 0;
  left: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
}
</style>
