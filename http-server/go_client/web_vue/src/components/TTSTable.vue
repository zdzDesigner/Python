<template>
  <a-table
    style="padding: 10px; background-color: #fff; width: calc(100vw - 300px)"
    :data-source="tableData"
    :columns="columns"
    size="small"
    :row-key="(record, index) => `${record.speaker}-${record.content}-${index}`"
    :pagination="false"
    :scroll="{ y: tableHeight, x: 1200 }"
    :locale="{
      emptyText: tableData && tableData.length > 0 ? 'JSON数据有效但不包含TTS条目' : '尚未提供JSON数据'
    }"
  >
    <template #bodyCell="{ column, record }">
      <template v-if="column.key === 'dubbing'">
        <a-select
          style="width: 100%"
          :value="record.dubbing"
          @change="(value) => emit('dubbingChange', { record, value })"
          virtual
        >
          <a-select-option v-for="file in audioFiles" :key="file.path" :value="file.path">
            {{ file.name }}
          </a-select-option>
        </a-select>
      </template>
      <template v-if="column.key === 'tone'">
        <a-tag :color="renderToneTag(record.tone).color">{{ record.tone || 'N/A' }}</a-tag>
      </template>
      <template v-if="column.key === 'intensity'">
        <a-tag color="orange">{{ record.intensity || 0 }}</a-tag>
      </template>
      <template v-if="column.key === 'delay'">
        {{ record.delay || 0 }}ms
      </template>
      <template v-if="column.key === 'action'">
        <a-space size="middle">
          <a-button
            :icon="h(ExperimentOutlined)"
            @click="emit('train', record)"
            title="训练此条数据"
            :loading="trainingRecords[getRecordKey(record)]"
            :disabled="trainingRecords[getRecordKey(record)]"
          />
          <a-button
            :icon="h(PlayCircleOutlined)"
            @click="emit('play', record)"
            :disabled="trainingRecords[getRecordKey(record)]"
            title="播放训练后的音频"
          />
        </a-space>
      </template>
    </template>
  </a-table>
</template>

<script setup>
import { h } from 'vue'
import {
  Table as ATable,
  Tag as ATag,
  Select as ASelect,
  Button as AButton,
  Space as ASpace,
} from 'ant-design-vue'
import { PlayCircleOutlined, ExperimentOutlined } from '@ant-design/icons-vue'

const ASelectOption = ASelect.Option

const props = defineProps({
  tableData: Array,
  columns: Array,
  tableHeight: String,
  audioFiles: Array,
  trainingRecords: Object,
})

const emit = defineEmits(['train', 'play', 'dubbingChange'])

const renderToneTag = (tone) => {
  const toneColors = {
    neutral: 'default',
    happy: 'green',
    sad: 'blue',
    angry: 'red',
    excited: 'volcano',
    calm: 'geekblue',
  }
  return { color: toneColors[tone] || 'default' }
}

const getRecordKey = (record) => `${record.speaker}-${record.content}`
</script>
