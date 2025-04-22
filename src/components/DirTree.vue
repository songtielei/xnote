<template>
    <Tree :data="treeData" :showIndex="showIndex" :select-dir="selectDir" @node-toggle="onNodeToggle"
        @node-select="onNodeSelect">
        <template #default="{ node }">
            <span>{{ node.label }}</span>
            <span v-if="node.selected" style="margin-left: 8px; color: green">✓</span>
        </template>
    </Tree>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Tree from '@/components/tree/Tree.vue'
import type { CustomStorage } from '@/utils/indexedDBUtil'

export interface TreeNode {
    id: string;
    label: string;
    path: string;
    selected?: boolean;
    dirHandle: FileSystemDirectoryHandle;
    expanded?: boolean;
    children?: TreeNode[];
}
const props = defineProps({
    activeStorage: {
        type: Object as () => CustomStorage,
    },
    workspace: {
        type: String,
    }
})

const emit = defineEmits(['update:selectDir']);

let treeData = ref<TreeNode[]>([]);
const selectDir = ref('')
const showIndex = ref(false)

function onNodeToggle(node: TreeNode) {
    console.log('Node toggled:', node);
}

function onNodeSelect(node: TreeNode) {
    // 清除所有选中状态
    const clearSelection = (nodes) => {
        nodes.forEach(n => {
            n.selected = false;
            if (n.children) clearSelection(n.children);
        });
    };

    clearSelection(treeData.value);

    // 设置当前节点选中
    node.selected = true;
    console.log('Node selected:', node);
    selectDir.value = node.label;
    showIndex.value = false;
    // TODO: 加载工作区内容，并显示在编辑器中
    emit('update:selectDir', node);
    // displayWorkspace(node.dirHandle);
    // path.value = node.path;
    // name.value = node.label;
}

const recursiveGetTreeData = async (parentPath: string, directoryHandle: FileSystemDirectoryHandle): Promise<TreeNode> => {
    const treeNode: TreeNode = {
        id: directoryHandle.name,
        label: directoryHandle.name,
        path: parentPath + directoryHandle.name,
        selected: false,
        dirHandle: directoryHandle,
        expanded: false,
        children: []
    }
    for await (const h of (directoryHandle as any).values()) {
        if (h.kind === 'file') {
            continue;
        }
        const childTreeNode = await recursiveGetTreeData(treeNode.path + '/', h);
        treeNode.children?.push(childTreeNode);
    }
    return treeNode;
}

const getTreeData = async (handle: FileSystemDirectoryHandle) => {
    if (!props.workspace) {
        console.error('Workspace is not defined');
        return;
    }
    const noteDirectoryHandle = await handle.getDirectoryHandle(props.workspace, { create: false });
    const data = await recursiveGetTreeData('', noteDirectoryHandle);
    data.label = handle.name;
    treeData.value = [data];
    onNodeSelect(treeData.value[0]);

}
onMounted(async () => {
    if (!props.activeStorage) {
        console.error('activeStorage is not defined');
        return;
    }
    getTreeData(props.activeStorage.file);
})
</script>