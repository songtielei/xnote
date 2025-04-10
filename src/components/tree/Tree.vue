<template>
  <input type="text" placeholder="Search..." :value="selectDir" @click="showIndex = true" />
  <ul class="tree" v-show="showIndex">
    <TreeNode v-for="node in $props.data" :key="node.id" :node="node" @toggle="onToggle" @select="onSelect" />
  </ul>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import TreeNode from './TreeNode.vue';

const props = defineProps({
  data: {
    type: Array,
    required: true
  },
  selectDir: {
    type: String,
    default: ''
  },
  showIndex: {
    type: Boolean,
    default: false
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
input {
  width: 200px;
  padding: 5px;
  margin-bottom: 10px;
}
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