<template>
    <div class="content">
        <div class="contentHeader">
            <input class="title" type="text" placeholder="标题" v-model="(parsedMarkdown as any).title" />

            <button class="save" @click="saveContent">保存</button>
        </div>
        <CherryMarkdown :tocVisiable="false" :value="(parsedMarkdown as any)._content" v-on:mdChange="mdChange"
            :dirRoot="activeStorage" :currentItem="currentFileItem" />
        <div class="footer">
            <ul class="tag">
                <li v-for="tag in (parsedMarkdown as any).tags" :key="tag">{{ tag }}</li>
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
import { parse, stringify } from '../../utils/front_matter'

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

//TODO category
function saveContent() {
    (parsedMarkdown.value as any).tags = currentFileItem.value?.tags;
    (parsedMarkdown.value as any).title = currentFileItem.value?.title;
    if (!(parsedMarkdown.value as any).date) {
        (parsedMarkdown.value as any).date = new Date()
    }
    (parsedMarkdown.value as any).updated = new Date()
    const content = stringify(parsedMarkdown.value, { mode: '', separator: '---', prefixSeparator: true });

    writeFile(currentFileItem.value?.handle, content);
    emit('update:list', props.path, props.name);
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

function mdChange(mdHtml, mdTxt, mdContent) {
    (parsedMarkdown.value as any)._content = mdContent;
}

function addTag(event) {
    (parsedMarkdown as any).tags.value.push(event.target.value)
    event.target.value = ''
}

const parsedMarkdown = ref({});
const activeStorage = ref<FileSystemDirectoryHandle>();
const currentFileItem = ref<FileItem>();

const emit = defineEmits(['update:list'])

onMounted(async () => {
    currentFileItem.value = await indexedDBUtil.getNoteByPathAndName(props.path, props.name);
    const file = await currentFileItem.value.handle.getFile()
    const text = await file.text()
    parsedMarkdown.value = parse(text)

    const storage = indexedDBUtil.getActiveStorage();
    activeStorage.value = (await storage).file;
})
</script>
<style scoped lang="scss"></style>