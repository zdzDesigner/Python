<template>
  <div class="w-full bg-white/80 backdrop-blur-lg border-b border-slate-200 p-3 flex justify-end items-center space-x-3">
    <a-space>
      <a-upload
        name="file"
        action="http://localhost:8081/api/upload"
        :headers="{ authorization: 'authorization-text' }"
        @change="handleUploadChange"
      >
        <a-button>
          <template #icon><UploadOutlined /></template>
          Upload File
        </a-button>
      </a-upload>
      <a-button @click="jsonModalVisible = true">
        <template #icon><EditOutlined /></template>
        Manual Input
      </a-button>
    </a-space>

    <a-modal
      title="Manual JSON Input"
      v-model:open="jsonModalVisible"
      @cancel="resetJsonModal"
      :footer="null"
      width="700px"
    >
      <div class="space-y-4">
        <a-textarea
          v-model:value="jsonInput"
          :rows="8"
          placeholder="Paste your JSON data here..."
          style="font-family: monospace; font-size: 14px"
        />
        <div class="flex justify-end py-4">
          <a-button type="primary" @click="handleJsonSubmit" :disabled="!jsonInput.trim()">
            确定
          </a-button>
        </div>
        <div v-if="formattedJson" class="mt-4">
          <h4 class="font-medium mb-2">Formatted JSON / Error:</h4>
          <a-textarea
            v-model:value="formattedJson"
            :rows="10"
            read-only
            style="font-family: monospace; font-size: 14px; background-color: #f9fafb"
          />
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import {
  UploadOutlined,
  EditOutlined,
} from '@ant-design/icons-vue'
import {
  Space as ASpace,
  Button as AButton,
  Upload as AUpload,
  Modal as AModal,
  Input as AInput,
  message,
} from 'ant-design-vue'
import { useNotification } from '../utils/notifications'

const { TextArea: ATextarea } = AInput

const emit = defineEmits(['uploadSuccess', 'jsonData'])

const { showError, showSuccess } = useNotification()
const jsonModalVisible = ref(false)
const jsonInput = ref('')
const formattedJson = ref('')

const handleJsonSubmit = () => {
  try {
    const parsedJson = JSON.parse(jsonInput.value)
    const formatted = JSON.stringify(parsedJson, null, 2)
    formattedJson.value = formatted
    showSuccess('JSON Parsed Successfully', 'The JSON has been validated and formatted.')
    emit('jsonData', parsedJson)
    jsonModalVisible.value = false
  } catch (error) {
    showError('Invalid JSON', 'Please enter valid JSON data.')
    formattedJson.value = error.message
  }
}

const resetJsonModal = () => {
  jsonModalVisible.value = false
  jsonInput.value = ''
  formattedJson.value = ''
}

const handleUploadChange = (info) => {
  if (info.file.status === 'done') {
    message.success(`${info.file.name} file uploaded successfully`)
    emit('uploadSuccess')
  } else if (info.file.status === 'error') {
    message.error(`${info.file.name} file upload failed.`)
    showError('Upload Failed', `Failed to upload ${info.file.name}`)
  }
}
</script>
