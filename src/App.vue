<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import HelloWorld from './components/HelloWorld.vue'
import { ref, reactive, shallowRef } from 'vue'
import Cherry from 'cherry-markdown'
import 'cherry-markdown/dist/cherry-markdown.min.css'
import CherryMarkdown from './components/CherryMarkdown.vue'

let showPreference = ref(false);
const contentList = ref<any>([])
const workspaceList = ref<any>([]);

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

let fileHandle: FileSystemDirectoryHandle
let contents
let file
let isLoad = false;
let markdownContent = ref('');

// file picker
async function getFileHandle() {
  fileHandle = await window.showDirectoryPicker()
  workspaceList.value.push(fileHandle);
  saveHandle(fileHandle);
  console.log(fileHandle);
  for await (const handle of fileHandle.values()) {
    if (handle.kind === 'directory') {
      continue
    }
    const file = await handle.getFile()
    if (file !== null && !file.name.startsWith('.')) {
      const text = await file.text()
      //console.log(file.lastModified)
      contentList.value.push({ content: text.substring(0, 20), dateTime: handle.lastModified, handle: handle })
      if (!isLoad) {
        //console.log(CherryMarkdown)
        markdownContent.value = text;
        isLoad = true;
      }
      
    }
  }
  isLoad = false;
}
async function content(handle) {

  const file = await handle.getFile();
  const text = await file.text();

  //console.log(text);
  markdownContent.value = text;
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
  console.log('scroll');
}
function preference() {

}


const dbName = 'xzfilehandle'
      let db
      function openDB() {
        const req = indexedDB.open(dbName, 1)
        req.onupgradeneeded = (ev) => {
          req.result.createObjectStore('handle', {
            keyPath: 'id',
          })
        }
        req.onsuccess = (ev) => {
          db = req.result
          restoreHandle(db)
        }
      }
      openDB()

      function saveHandle(handle) {
        const transaction = db
          .transaction('handle', 'readwrite')
          .objectStore('handle')
        transaction.add({
          id: '111',
          handle: handle,
        })
        console.log('已保存 handle')
      }

      function restoreHandle(db) {
        const req = db
          .transaction('handle', 'readwrite')
          .objectStore('handle')
          .get('111')

        req.onsuccess = (ev) => {
          const data = req.result
          if (data) {
            console.log('已读取保存的 handle')
            checkPermission(data.handle)
          }
        }
      }
      async function checkPermission(fileHandle) {
        const query = await fileHandle.queryPermission({})
        console.log('query', query)
        if (query !== 'granted') {
          const b = document.querySelector('#b')
          b.onclick = async () => {
            const request = await fileHandle.requestPermission({})
            console.log('request', request)

            //sendFile(fileHandle, '22222,22222')
          }
        }
      }
</script>

<template>
  <main>
    <div class="sidebar">
      <div class="top-group">
        <div class="workspace-item" v-for="item in workspaceList" @click=''>{{ item.name }}</div>
      </div>
      <div class="bottom-group">
        <div @click="() => {showPreference = true}">设置</div>
      </div>
    </div>
    <div class="nav" @scroll="handleScroll">
      <div class="item" v-for="item in contentList" @click='content(item.handle)'>{{ item.dateTime }} {{ item.content }}</div>
    </div>
    <div class="content">
      <CherryMarkdown :tocVisiable="false" :value="markdownContent" />
    </div>

  </main>
  <div class="preference " v-if="showPreference">
    <div class="videoMenu" @click="() => {showPreference = false}">&times;</div>
      选择文件夹
      <button class="btn btn-dark mr-2" @click="getFileHandle">选择文件</button>
    </div>
</template>

<style scoped lang="scss">
main {
  width: 100%;
  height: 100%;
  margin: 0;
  display: flex;
  border: solid;

  > .sidebar {
    width: 50px;
    //background-color: white;
  }
  > .nav {
    border: solid;
    width: 300px;
    overflow: scroll;
    //background-color: white;
  }

  > .content {
    flex: 1;
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
  display: block;
  width: 100%;
    position: fixed;
    z-index: 100px;
    //right: 0px;
    top: 0px;
    bottom: 0px;
    margin: 0 0 0 50px;
    border: solid red;
  }
  .videoMenu {
  width: 700px;
  height: 30px;

}
</style>
