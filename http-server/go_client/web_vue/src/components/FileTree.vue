<template>
  <div v-if="!fileTree || !fileTree.children || fileTree.children.length === 0" class="text-center text-slate-500 py-16">
    <div class="text-5xl mb-4">📁</div>
    <p class="text-xl">No audio files found</p>
    <p class="text-sm mt-2">Check the source directory for audio files.</p>
  </div>
  <a-tree
    v-else
    :tree-data="treeData"
    :show-icon="true"
    :default-expand-all="true"
    @select="onSelect"
  >
    <template #title="{ title, data }">
      <div class="flex items-center">
        <span class="truncate flex-grow">{{ title }}</span>
        <a-button
          v-if="data.isLeaf"
          type="text"
          size="small"
          @click.stop="onDelete(data.data)"
          class="ml-2"
        >
          <template #icon><DeleteOutlined /></template>
        </a-button>
      </div>
    </template>
    <template #icon="{ data }">
      <span v-if="data.type === 'folder'">📁</span>
      <span v-else>
        {{ getIcon(data.name) }}
      </span>
    </template>
  </a-tree>
</template>

<script setup>
import { computed } from 'vue'
import { Tree as ATree, Button as AButton } from 'ant-design-vue'
import { DeleteOutlined } from '@ant-design/icons-vue'

const props = defineProps({
  fileTree: Object,
  currentlyPlaying: String,
})

const emit = defineEmits(['selectFile', 'deleteFile', 'pauseCurrent'])

const getIcon = (name) => {
  const extension = name.split('.').pop().toLowerCase()
  switch (extension) {
    case 'mp3':
      return '🎵'
    case 'wav':
      return '🔊'
    case 'ogg':
      return '🎶'
    case 'flac':
      return '🎼'
    default:
      return '🎵'
  }
}

const transformTreeData = (node) => {
  if (!node) return null
  const { name, type, children, data } = node
  const key = data ? data.path : name
  const isLeaf = type === 'file'
  
  const treeNode = {
    title: name,
    key,
    data: node,
    isLeaf,
    type,
    name,
  }

  if (children && children.length > 0) {
    treeNode.children = children.map(transformTreeData)
  }

  return treeNode
}

const treeData = computed(() => {
  if (!props.fileTree) return []
  return props.fileTree.children.map(transformTreeData)
})

const onSelect = (selectedKeys, { node }) => {
  if (node.data.type === 'file') {
    if (props.currentlyPlaying === node.data.data.path) {
      emit('pauseCurrent')
    } else {
      emit('selectFile', node.data.data)
    }
  }
}

const onDelete = (data) => {
  if (data.type === 'file') {
    emit('deleteFile', data.data.name)
  }
}
</script>
