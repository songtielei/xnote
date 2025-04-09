<template>
    <li class="tree-node">
        <div class="node-content" :class="{ 'is-selected': node.selected }" @click="handleSelect">
            <span v-if="hasChildren" class="toggle-icon" @click.stop="handleToggle">
                {{ isExpanded ? '−' : '+' }}
            </span>
            <span v-else class="toggle-placeholder"></span>

            <slot :node="node">
                <span>{{ node.label }}</span>
            </slot>
        </div>

        <ul v-if="hasChildren && isExpanded" class="tree-children">
            <TreeNode v-for="child in node.children" :key="child.id" :node="child" @toggle="$emit('toggle', $event)"
                @select="$emit('select', $event)">
                <template #default="{ node }">
                    <slot :node="node"></slot>
                </template>
            </TreeNode>
        </ul>
    </li>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

const props = defineProps({
    node: {
        type: Object,
        required: true
    }
});

const emit = defineEmits(['toggle', 'select']);

const isExpanded = ref(props.node.expanded || false);

const hasChildren = computed(() => {
    return props.node.children && props.node.children.length > 0;
});

function handleToggle() {
    isExpanded.value = !isExpanded.value;
    emit('toggle', props.node);
}

function handleSelect() {
    emit('select', props.node);
}
</script>

<style scoped lang="scss">
.tree-node {
    list-style: none;
    margin: 4px 0;

    >.node-content {
        display: flex;
        align-items: center;
        padding: 4px 8px;
        cursor: pointer;
        border-radius: 4px;

        &:hover {
            background-color: #f0f0f0;
        }

        &.is-selected {
            background-color: #e0e0ff;
        }

        >.toggle-icon,
        >.toggle-placeholder {
            display: inline-block;
            width: 20px;
            text-align: center;
            margin-right: 4px;
        }

        >.toggle-icon {
            cursor: pointer;
            user-select: none;
        }
    }

    >.tree-children {
        padding-left: 20px;
    }
}
</style>