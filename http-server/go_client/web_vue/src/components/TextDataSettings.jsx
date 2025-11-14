
import { ref } from 'vue';
import {
  UploadOutlined,
  EditOutlined,
} from '@ant-design/icons-vue';
import {
  Space as ASpace,
  Button as AButton,
  Upload as AUpload,
  Modal as AModal,
  Input as AInput,
  message,
} from 'ant-design-vue';
import { useNotification } from '../utils/notifications';

const { TextArea: ATextarea } = AInput;

export default {
  emits: ['uploadSuccess', 'jsonData'],
  setup(props, { emit }) {
    const { showError, showSuccess } = useNotification();
    const jsonModalVisible = ref(false);
    const jsonInput = ref('');
    const formattedJson = ref('');

    const handleJsonSubmit = () => {
      try {
        const parsedJson = JSON.parse(jsonInput.value);
        const formatted = JSON.stringify(parsedJson, null, 2);
        formattedJson.value = formatted;
        showSuccess('JSON Parsed Successfully', 'The JSON has been validated and formatted.');
        emit('jsonData', parsedJson);
        jsonModalVisible.value = false;
      } catch (error) {
        showError('Invalid JSON', 'Please enter valid JSON data.');
        formattedJson.value = error.message;
      }
    };

    const resetJsonModal = () => {
      jsonModalVisible.value = false;
      jsonInput.value = '';
      formattedJson.value = '';
    };

    const handleUploadChange = (info) => {
      if (info.file.status === 'done') {
        message.success(`${info.file.name} file uploaded successfully`);
        emit('uploadSuccess');
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} file upload failed.`);
        showError('Upload Failed', `Failed to upload ${info.file.name}`);
      }
    };

    return () => (
      <div class="w-full bg-white/80 backdrop-blur-lg border-b border-slate-200 p-3 flex justify-end items-center space-x-3">
        <ASpace>
          <AUpload
            name="file"
            action="http://localhost:8081/api/upload"
            headers={{ authorization: 'authorization-text' }}
            onChange={handleUploadChange}
          >
            <AButton>
              {{ icon: () => <UploadOutlined /> }}
              Upload File
            </AButton>
          </AUpload>
          <AButton onClick={() => (jsonModalVisible.value = true)}>
            {{ icon: () => <EditOutlined /> }}
            Manual Input
          </AButton>
        </ASpace>

        <AModal
          title="Manual JSON Input"
          open={jsonModalVisible.value}
          onUpdate:open={(value) => (jsonModalVisible.value = value)}
          onCancel={resetJsonModal}
          footer={null}
          width="700px"
        >
          <div class="space-y-4">
            <ATextarea
              value={jsonInput.value}
              onUpdate:value={(value) => (jsonInput.value = value)}
              rows={8}
              placeholder="Paste your JSON data here..."
              style="font-family: monospace; font-size: 14px"
            />
            <div class="flex justify-end py-4">
              <AButton type="primary" onClick={handleJsonSubmit} disabled={!jsonInput.value.trim()}>
                确定
              </AButton>
            </div>
            {formattedJson.value && (
              <div class="mt-4">
                <h4 class="font-medium mb-2">Formatted JSON / Error:</h4>
                <ATextarea
                  value={formattedJson.value}
                  rows={10}
                  read-only
                  style="font-family: monospace; font-size: 14px; background-color: #f9fafb"
                />
              </div>
            )}
          </div>
        </AModal>
      </div>
    );
  },
};
