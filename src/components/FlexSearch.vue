<template>
    <input type="text" placeholder="搜索" v-model="searchInput" @keyup.enter="performSearch" />
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { FlexSearchHelper } from '@/utils/flexsearch-helper';

const props = defineProps({
  contentList: {
    type: Array,
    default: () => []
  }
});
// 搜索
const searchInput = ref('');
const oldList = props.contentList;

const contentSearch = new FlexSearchHelper<Content>(['name', 'content']);
// 搜索
async function performSearch() {
  if (!searchInput.value) {
    // 如果搜索框为空，恢复原始列表
    props.contentList = oldList;
    return;
  }
  // 简单搜索
  const results = await contentSearch.search(searchInput.value);
  const resultsSet = new Set();
  results.forEach(result => {
    resultsSet.add(result.id);
  });
  contentList.value = contentList.value.filter(item => resultsSet.has(item.name));
}
onMounted(() => {
  props.contentList.forEach(item => {
    const content = {
      name: item.name,
      content: item.parsedMarkdown._content
    }
    contentSearch.add(item.name, content);
  })

})
</script>