<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import HelloWorld from './components/HelloWorld.vue'
import { ref, reactive, shallowRef } from 'vue'
import Cherry from 'cherry-markdown'
import 'cherry-markdown/dist/cherry-markdown.min.css'
import CherryMarkdown from './components/CherryMarkdown.vue'

const contentList = ref<any>([])

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
</script>

<template>
  <main>
    <div class="sidebar">
      <div class="form-group">
        <button class="btn btn-dark mr-2" @click="getFileHandle">选择文件</button>
      </div>
    </div>
    <div class="nav" @scroll="handleScroll">
      <div class="item" v-for="item in contentList" @click='content(item.handle)'>{{ item.dateTime }} {{ item.content }}</div>
    </div>
    <div class="content">
      <CherryMarkdown :tocVisiable="false" :value="markdownContent" />
    </div>
  </main>
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
.form-group {
  position: absolute;
  bottom: 0px;
}
.item {
  border: solid;
  height: 50px;
}
</style>
