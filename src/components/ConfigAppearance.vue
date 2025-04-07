<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import * as indexedDBUtil from '../utils/indexedDBUtil'

const workspaceList = ref<indexedDBUtil.FileHandleDO[]>([])
let fileHandle: FileSystemDirectoryHandle

// file picker
async function getFileHandle() {
  fileHandle = await (window as any).showDirectoryPicker();
  let exist = false;
  indexedDBUtil.openCursor(indexedDBUtil.defaultObjectStoreName, (objectStore, cursor) => {
    if (cursor) {
      if (cursor.value.file.name === fileHandle.name) {
        console.log('目录存在')
        exist = true;
        // cursor.continue();
      }
    }
  })

  if (!exist) {
    const f: indexedDBUtil.FileHandleDO = {
      id: new Date().getTime(),
      current: false,
      file: fileHandle
    }
    saveHandle(f)
    workspaceList.value.push(f);
  }

}

function saveHandle(handle: indexedDBUtil.FileHandleDO) {
  indexedDBUtil.getObjectStore(indexedDBUtil.defaultObjectStoreName).add(handle);
}

function restoreHandle() {
  workspaceList.value.length = 0;
  indexedDBUtil.openCursor(indexedDBUtil.defaultObjectStoreName, (objectStore, cursor) => {
    if (cursor) {
      workspaceList.value.push(cursor.value);
      cursor.continue();
    } else {
      console.log("没有更多记录了！");
    }
  })
}

function deleteItem(id: number) {
  indexedDBUtil.getObjectStore(indexedDBUtil.defaultObjectStoreName).delete(id);
  workspaceList.value = workspaceList.value.filter(item => item.id !== id)
}

function useItem(id: number) {
  indexedDBUtil.openCursor(indexedDBUtil.defaultObjectStoreName, (objectStore, cursor) => {
    if (cursor) {
      const f: indexedDBUtil.FileHandleDO = cursor.value;
      if (f.id === id) {
        f.current = true
      } else {
        f.current = false
      }
      objectStore.put(f)
      // 执行下一条数据的 req.onsuccess
      cursor.continue();
    } else {
      console.log("没有更多记录了！");
      restoreHandle();
    }
  })
}

onMounted(() => {
  restoreHandle();
})

onUnmounted(() => {
  // indexedDBUtil.closeDB();
});
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