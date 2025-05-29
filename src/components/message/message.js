// src/components/message/message.js
import { createApp, h, ref } from 'vue'
import Message from '@/components/message/Message.vue'

const messageArr = ref([])

const MessageFn = (options) => {
  if (typeof options === 'string') {
    options = {
      message: options
    }
  }
  
  // 计算偏移量
  const offset = options.offset || 20
  const calcOffset = messageArr.value.length * (40 + offset) + offset
  
  // 创建消息容器
  const messageNode = document.createElement('div')
  document.body.appendChild(messageNode)
  
  // 关闭回调
  const userOnClose = options.onClose
  const onClose = () => {
    close()
    userOnClose?.()
  }
  
  const close = () => {
    // 从数组中移除
    const index = messageArr.value.findIndex(item => item.id === id)
    if (index > -1) {
      messageArr.value.splice(index, 1)
    }
    
    // 移除DOM
    app.unmount()
    messageNode.remove()
    
    // 重新计算其他消息位置
    messageArr.value.forEach((item, i) => {
      item.top = i * (40 + offset) + offset
    })
  }
  
  const id = `message_${Date.now()}`
  const props = {
    ...options,
    id,
    top: calcOffset,
    onClose
  }
  
  // 创建应用实例
  const app = createApp({
    render() {
      return h(Message, props)
    }
  })
  
  app.mount(messageNode)
  
  // 保存实例信息
  messageArr.value.push({
    id,
    top: calcOffset
  })
  
  return {
    close
  }
}

// 添加不同类型的方法
const types = ['success', 'warning', 'info', 'error']
types.forEach(type => {
  MessageFn[type] = (options) => {
    if (typeof options === 'string') {
      options = {
        content: options, type
      }
    }
    return MessageFn({
      ...options,
      type
    })
  }
})

export default MessageFn