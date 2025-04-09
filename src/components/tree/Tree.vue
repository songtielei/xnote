<template>
  <input type="text" placeholder="Search..." />
  <ul class="tree">
    <TreeNode v-for="node in $props.data" :key="node.id" :node="node" @toggle="onToggle" @select="onSelect" />
  </ul>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TreeNode from './TreeNode.vue';

const props = defineProps({
  data: {
    type: Array,
    required: true
  }
});

const treeData = ref(props.data);

const emit = defineEmits(['node-toggle', 'node-select']);

function onToggle(node) {
  emit('node-toggle', node);
}

function onSelect(node) {
  emit('node-select', node);
}
</script>

<style scoped lang="scss">
.tree {
  position: relative;
  margin: 0 20px 0 0;
  list-style: none;
  background-color: white;
  padding: 0 0 0 0;
  border: 1px solid #ccc;
  border-radius: 4px;
  overflow: auto;
}
</style>