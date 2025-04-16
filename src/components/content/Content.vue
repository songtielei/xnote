<template>
    <div class="content">
        <div class="contentHeader">
            <input class="title" type="text" placeholder="标题" v-model="(parsedMarkdown as any).title" />

            <button class="save" @click="saveContent">保存</button>
        </div>
        <CherryMarkdown :tocVisiable="false" :value="(parsedMarkdown as any)._content" v-on:mdChange="mdChange"
            :dirRoot="activeStorage" :currentItem="props.currentFileItem" />
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
    currentFileItem: {
        type: Object as () => FileItem,
    }
})
watch(() => props.currentFileItem, async (newValue) => {
    console.log('多个 props 变化:', newValue);
    if (!newValue) {
        return;
    }
    const file = await newValue.handle.getFile()
    const text = await file.text()
    parsedMarkdown.value = parse(text)

});
//TODO category
function saveContent() {
    if (!props.currentFileItem) {
        return;
    }
    (parsedMarkdown.value as any).tags = props.currentFileItem.tags;
    (parsedMarkdown.value as any).title = props.currentFileItem.title;
    if (!(parsedMarkdown.value as any).date) {
        (parsedMarkdown.value as any).date = new Date()
    }
    (parsedMarkdown.value as any).updated = new Date()
    const content = stringify(parsedMarkdown.value, { mode: '', separator: '---', prefixSeparator: true });

    writeFile(props.currentFileItem.handle, content);
    emit('update:list');
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

const emit = defineEmits(['update:list'])

onMounted(async () => {
    const storage = indexedDBUtil.getActiveStorage();
    activeStorage.value = (await storage).file;
    const file = await props.currentFileItem.handle.getFile()
    const text = await file.text()
    parsedMarkdown.value = parse(text)
})
</script>
<style scoped lang="scss">
.content {
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
</style>