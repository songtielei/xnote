<script setup lang="ts">
import { ref } from 'vue'

interface FileHandleDO {
  id: number,
  current: boolean,
  file: FileSystemDirectoryHandle
}
const dbName = 'xzfilehandle'
let db: IDBOpenDBRequest
const workspaceList = ref<FileHandleDO[]>([])
let fileHandle: FileSystemDirectoryHandle

// file picker
async function getFileHandle() {
  fileHandle = await (window as any).showDirectoryPicker()

  const req = indexedDB.open(dbName, 1)

  req.onsuccess = () => {
    const cursorReq = req.result.transaction('handle', 'readwrite')?.objectStore('handle').openCursor();
    cursorReq.onsuccess = (event) => {
      let cursor = (event.target as any).result;
      let exist = false;
      if (cursor) {
        if (cursor.value.file.name === fileHandle.name) {
          console.log('目录存在')
          exist = true;
          cursor.continue();
        } else {

          if (!exist) {
            let f: FileHandleDO = {
              id: new Date().getTime(),
              current: false,
              file: fileHandle
            }
            saveHandle(f)
            workspaceList.value.push(f)


          } else {
            console.log('目录已存在')
          }
        }
      } else {
        let f: FileHandleDO = {
          id: new Date().getTime(),
          current: false,
          file: fileHandle
        }
        saveHandle(f)
        workspaceList.value.push(f)
      }

    }

  }


}
function saveHandle(handle: FileHandleDO) {
  const transaction = (db as any).transaction('handle', 'readwrite').objectStore('handle')
  transaction.add(handle)
}

function restoreHandle(db: IDBOpenDBRequest) {
  workspaceList.value.length = 0;
  const req = (db as any).transaction('handle', 'readwrite')?.objectStore('handle').openCursor();

  req.onsuccess = (event) => {
    const cursor = event.target.result;
    if (cursor) {
      console.log(cursor.value)
      let f: FileHandleDO = cursor.value;
      workspaceList.value.push(f);
      cursor.continue();
    } else {
      console.log("没有更多记录了！");
    }

  }
}

function openDB() {
  const req = indexedDB.open(dbName, 1)
  req.onupgradeneeded = (event) => {
    (event.target as any).result.createObjectStore('handle', {
      keyPath: 'id'
    })
  }
  req.onsuccess = (event) => {
    db = (event.target as any).result
    restoreHandle(db)
  }
}
function deleteItem(id: number) {
  const transaction = (db as any).transaction('handle', 'readwrite').objectStore('handle')
  transaction.delete(id)
  workspaceList.value = workspaceList.value.filter(item => item.id !== id)
}
function useItem(id: number) {
  const transaction = (db as any).transaction('handle', 'readwrite').objectStore('handle')
  transaction.openCursor().onsuccess = (event) => {
    const cursor = event.target.result;
    if (cursor) {
      console.log(cursor.value)
      let f: FileHandleDO = cursor.value;
      if (f.id === id) {
        f.current = true
      } else {
        f.current = false
      }
      transaction.put(f)
      cursor.continue();
    } else {
      console.log("没有更多记录了！");
      restoreHandle(db);
    }
  }
}
openDB()
</script>
<template>
  <div class="container">
    <ul class="sidebar">
      <li>目录</li>
      <li>外观</li>
    </ul>
    <div class="p-content p-storage" v-if="true">
      <div class="operate">
        <button class="btn btn-dark mr-2" @click="getFileHandle">选择文件</button>
      </div>
      <div class="workspace-item" v-for="item in workspaceList" :key="item.id">
        <span>{{ item.file.name }} </span>
        <button @click="useItem(item.id)" :disabled="item.current">使用</button>
        <button @click="deleteItem(item.id)">删除</button>
      </div>
    </div>

  </div>

</template>
<style scoped lang="scss">
.container {
  display: flex;
  height: calc(100% - 40px);
  border-radius: 5px;

  .sidebar {
    width: 100px;
    height: 100%;
    margin: 0;
    padding: 0;
    border-right: 1px solid black;

    >li {
      height: 1em;
      list-style: none;
      text-align: center;
      padding: 0.5em 0px;

    }
  }

  .p-content {
    flex: 1;
    >.operate {
      padding: 0.5em 1em;
      border-bottom: 1px solid black;
    }
    >.workspace-item {
      display: flex;
      align-items: center;
      
      padding: 0.5em 1em;
      border-bottom: 1px solid black;
      >span {
        flex: 1;
      }
      >button {
        width: 70px;
        margin-left: 1em;
      }

    }

  }

  .p-storage {}

  .p-appearance {}
}
</style>