import { ref, computed, onMounted, onUnmounted, defineComponent } from 'vue';
import {
  Select as ASelect,
  Button as AButton,
  Modal as AModal,
} from 'ant-design-vue';
import { audio_text } from '@/assets/audio_text';
import { synthesizeTTS } from '@/services/api/tts';
import { useNotification } from '@/utils/notifications';
import TTSTable from './TTSTable.jsx';

const ASelectOption = ASelect.Option;

export default defineComponent({
  props: {
    jsonData: Array,
    audioFiles: Array,
  },
  emits: ['synthesizeComplete'],
  setup(props, { emit }) {
    const tableHeight = ref('calc(100vh - 200px)');
    const trainingRecords = ref({});
    const trainedRecords = ref({});
    const isMappingModalVisible = ref(false);
    const characterMappings = ref({});
    const tableData = ref([]);

    const { showError, showSuccess } = useNotification();

    const showNotification = (type, message, description) => {
      if (type === 'success') {
        showSuccess(message, description);
      } else if (type === 'error') {
        showError(message, description);
      } else if (type === 'warning') {
        showSuccess(message, description);
      }
    };

    onMounted(() => {
      const initialData = props.jsonData
        ? props.jsonData.map((item) => ({
            ...item,
            dubbing: item.dubbing || '请选择',
          }))
        : audio_text.map((item) => ({ ...item, dubbing: '请选择' }));
      tableData.value = initialData;

      const updateTableHeight = () => {
        const newHeight = window.innerHeight - 200;
        tableHeight.value = newHeight > 0 ? newHeight : 100;
      };
      updateTableHeight();
      window.addEventListener('resize', updateTableHeight);
    });

    onUnmounted(() => {
      window.removeEventListener('resize', updateTableHeight);
    });

    const uniqueCharacterNames = computed(() => {
      if (!tableData.value) return [];
      return [...new Set(tableData.value.map((item) => item.speaker))];
    });

    const getRecordKey = (record) => `${record.speaker}-${record.content}`;

    const handleTrain = async (record) => {
      const recordKey = getRecordKey(record);
      trainingRecords.value[recordKey] = true;

      try {
        const result = await synthesizeTTS(null, null, record);
        if (result.newFile && result.newFile.path) {
          trainedRecords.value[recordKey] = result.newFile.name;
          showSuccess('训练成功', '音频文件已生成');
        } else if (result.outpath) {
          trainedRecords.value[recordKey] = result.outpath;
          showSuccess('训练成功', '音频文件已生成');
        } else {
          showSuccess('训练成功', '音频文件已 generated');
        }
      } catch (error) {
        console.error('Error during training:', error);
        showError('训练失败', error.message);
      } finally {
        trainingRecords.value[recordKey] = false;
      }
    };

    const handlePlay = (record) => {
      const recordKey = getRecordKey(record);
      const outpath = trainedRecords.value[recordKey];

      if (outpath) {
        const audioUrl = `http://localhost:8081/api/audio-file${outpath.startsWith('/') ? outpath : '/' + outpath}`;
        const audio = new Audio(audioUrl);
        audio.play().catch((error) => {
          console.error('Error playing audio:', error);
          showError('播放失败', error.message);
        });
      } else {
        showError('播放失败', '音频文件未生成，请先训练此条数据');
      }
    };

    const handleDubbingChange = ({ record, value }) => {
      const recordKey = getRecordKey(record);
      const index = tableData.value.findIndex((item) => getRecordKey(item) === recordKey);
      if (index !== -1) {
        tableData.value[index].dubbing = value;
      }
    };

    const columns = [
      {
        title: '角色',
        width: 120,
        dataIndex: 'speaker',
        key: 'speaker',
        fixed: 'left',
      },
      {
        title: '配音',
        width: 150,
        dataIndex: 'dubbing',
        key: 'dubbing',
        fixed: 'left',
      },
      {
        title: '文本内容',
        dataIndex: 'content',
        key: 'content',
      },
      {
        title: '情感',
        width: 160,
        dataIndex: 'tone',
        key: 'tone',
      },
      {
        title: '情感比重',
        dataIndex: 'intensity',
        key: 'intensity',
        width: 80,
      },
      {
        title: '延迟',
        dataIndex: 'delay',
        key: 'delay',
        width: 100,
      },
      {
        title: '操作',
        key: 'action',
        width: 100,
        fixed: 'right',
      },
    ];

    const openMappingModal = () => {
      const initialMappings = {};
      if (tableData.value) {
        tableData.value.forEach((item) => {
          if (item.dubbing && item.dubbing !== '请选择') {
            initialMappings[item.speaker] = item.dubbing;
          }
        });
      }
      characterMappings.value = initialMappings;
      isMappingModalVisible.value = true;
    };

    const handleModalOk = () => {
      tableData.value = tableData.value.map((item) => {
        if (characterMappings.value[item.speaker]) {
          return { ...item, dubbing: characterMappings.value[item.speaker] };
        }
        return item;
      });
      isMappingModalVisible.value = false;
    };

    const handleModalCancel = () => {
      isMappingModalVisible.value = false;
      characterMappings.value = {};
    };

    const handleBatchTrain = async () => {
      if (!tableData.value || tableData.value.length === 0) {
        showNotification('warning', '警告', '没有数据可训练');
        return;
      }

      const allRecordKeys = tableData.value.map(getRecordKey);
      allRecordKeys.forEach((key) => {
        trainingRecords.value[key] = true;
      });

      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < tableData.value.length; i++) {
        const record = tableData.value[i];
        const recordKey = getRecordKey(record);

        try {
          const result = await synthesizeTTS(null, null, record);
          if (result.newFile && result.newFile.path) {
            trainedRecords.value[recordKey] = result.newFile.name;
            successCount++;
          } else if (result.outpath) {
            trainedRecords.value[recordKey] = result.outpath;
            successCount++;
          } else {
            successCount++;
          }
        } catch (error) {
          console.error('Error during batch training:', error);
          errorCount++;
          showError('训练失败', `训练失败: ${record.speaker} - ${error.message}`);
        } finally {
          trainingRecords.value[recordKey] = false;
        }

        if ((i + 1) % 5 === 0 || i === tableData.value.length - 1) {
          showSuccess('批量训练进度', `已处理: ${i + 1}/${tableData.value.length} 条记录 (${successCount} 成功, ${errorCount} 失败)`);
        }
      }

      showSuccess('批量训练完成', `总处理: ${tableData.value.length} 条记录 (${successCount} 成功, ${errorCount} 失败)`);
    };

    return () => (
      <div>
        <div style={{ padding: '10px' }}>
          <AButton type="primary" onClick={openMappingModal}>
            角色配音
          </AButton>
          <AButton type="primary" style={{ marginLeft: '10px' }} onClick={handleBatchTrain}>
            批量训练
          </AButton>
        </div>

        <AModal
          title="角色配音"
          open={isMappingModalVisible.value}
          onOk={handleModalOk}
          onCancel={handleModalCancel}
          width="600px"
        >
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {uniqueCharacterNames.value.map((characterName) => (
              <div
                key={characterName}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}
              >
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <strong>{characterName}</strong>
                </div>
                <div style={{ flex: 2, marginLeft: '20px' }}>
                  <ASelect
                    style={{ width: '100%' }}
                    placeholder="选择音频文件"
                    value={characterMappings.value[characterName]}
                    onUpdate:value={newValue => characterMappings.value[characterName] = newValue}
                    allowClear
                    virtual
                  >
                    {props.audioFiles.map((file) => (
                      <ASelectOption key={file.path} value={file.path}>
                        {file.name}
                      </ASelectOption>
                    ))}
                  </ASelect>
                </div>
              </div>
            ))}
          </div>
        </AModal>

        <TTSTable
          tableData={tableData.value}
          columns={columns}
          tableHeight={tableHeight.value}
          audioFiles={props.audioFiles}
          trainingRecords={trainingRecords.value}
          onTrain={handleTrain}
          onPlay={handlePlay}
          onDubbingChange={handleDubbingChange}
        />
      </div>
    );
  },
});
