<template>
    <div class="content">
        <div class="contentHeader">
            <input class="title" type="text" placeholder="标题" v-model="title" />

            <button class="save" @click="saveContent">保存</button>
        </div>
        <CherryMarkdown :tocVisiable="false" :value="markdownContent" v-on:mdChange="mdChange"
            :dirRoot="currentHandle?.file" :currentItem="currentFileItem" />
        <div class="footer">
            <ul class="tag">
                <li v-for="tag in tags" :key="tag">{{ tag }}</li>
            </ul>
            <input class="addTag" type="text" placeholder="添加标签" @keyup.enter="addTag" />
        </div>
    </div>
</template>
<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import CherryMarkdown from '../CherryMarkdown.vue';
import * as indexedDBUtil from '../../utils/indexedDBUtil'
import type { FileItem } from './types'

const props = defineProps({
    path: {
        type: String,
        default: ''
    },
    name: {
        type: String,
        default: ''
    }
})

let currentFileItem;

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

function addTag(event) {
    tags.value.push(event.target.value)
    event.target.value = ''
}

onMounted(async () => {
    content(currentFileItem)
    const fileItem = await indexedDBUtil.getNoteByPathAndName(props.path, props.name);
})
</script>
<style scoped lang="scss"></style>