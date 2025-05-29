
<template>
  <transition name="fade">
    <div v-if="visible" class="message" :class="type" :style="{ top: `${top}px` }">
      {{ content }}
    </div>
  </transition>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
  content: String,
  type: {
    type: String,
    default: 'info',
    validator: val => ['success', 'warning', 'error', 'info'].includes(val)
  },
  duration: {
    type: Number,
    default: 3000
  }
})

const visible = ref(false)
const top = ref(20)

onMounted(() => {
  visible.value = true
  console.log('Message mounted:', props.type, props.duration)
  setTimeout(() => {
    visible.value = false
  }, props.duration)
})
</script>

<style scoped>
.message {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  padding: 10px 20px;
  border-radius: 4px;
  z-index: 9999;
    border-width: 1px;
  border-style: solid;
}
.success { background: #f0f9eb; color: #67c23a; }
.warning { background: #fdf6ec; color: #e6a23c; }
.error { background: #fef0f0; color: #f56c6c; }
.info { background: #f4f4f5; color: #909399; }
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
