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
import { ref, onMounted, watch, toRaw } from 'vue';
import CherryMarkdown from '../CherryMarkdown.vue';
import * as indexedDBUtil from '../../utils/indexedDBUtil'
import type { FileItem } from './types'
import { parse, stringify } from '../../utils/front_matter'
import { saveItem } from '@/utils/fileItemUtil'

const props = defineProps({
    currentFileItem: {
        type: Object as () => FileItem,
        required: true
    }
})

const parsedMarkdown = ref<any>({});

watch(() => props.currentFileItem, async (newValue) => {
    console.log('多个 props 变化:', newValue);
    if (!newValue) {
        return;
    }
    const file = await newValue.handle.getFile()
    const text = await file.text()
    parsedMarkdown.value = parse(text)

}, { immediate: true });
//TODO category
function saveContent() {
    const fileItem: FileItem = Object.assign({}, props.currentFileItem);
    const rawParsedMarkdown = toRaw(parsedMarkdown.value);
    fileItem.title = (rawParsedMarkdown as any).title;
    fileItem.tags = (rawParsedMarkdown as any).tags;
    fileItem.date = fileItem.date || new Date();
    fileItem.updated = new Date();
    saveItem(fileItem, parsedMarkdown.value._content);
    emit('update:list', fileItem);
}

function mdChange(mdHtml, mdTxt, mdContent) {
    (parsedMarkdown.value as any)._content = mdContent;
}

function addTag(event) {
    if (!(parsedMarkdown as any).value.tags) {
        (parsedMarkdown as any).value.tags = []
    }
    (parsedMarkdown as any).value.tags.push(event.target.value)
    event.target.value = ''
}

const activeStorage = ref<FileSystemDirectoryHandle>();

const emit = defineEmits(['update:list'])

onMounted(async () => {
    const storage = indexedDBUtil.getActiveStorage();
    activeStorage.value = (await storage).file;
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