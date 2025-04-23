<template>
  <input type="text" placeholder="Search..." :value="selectDir" @click="show = true" />
  <ul class="tree" v-show="show">
    <TreeNode v-for="node in $props.data" :key="(node as any).id" :node="(node as any)" @toggle="onToggle" @select="onSelect" />
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
let show = ref(props.showIndex);

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
  background-color: transparent;
  background-image: none;
  border: 1px solid #000;
  box-sizing: border-box;
  width: 100%;
  line-height: 1;
  outline: none;
  padding: 0 0 0 8px;
  height: 100%;
  border-radius: 4px;
  &:focus {
    border-color: #409eff;
    outline: none;
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
  }
}
.tree {
  position: absolute;
  margin: 0 20px 0 0;
  list-style: none;
  background-color: white;
  padding: 0 0 0 0;
  border: 1px solid #ccc;
  border-radius: 4px;
  overflow: auto;
  top: 34px;
}
</style>