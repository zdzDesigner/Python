
import { h } from 'vue';
import {
  Table as ATable,
  Tag as ATag,
  Select as ASelect,
  Button as AButton,
  Space as ASpace,
} from 'ant-design-vue';
import { PlayCircleOutlined, ExperimentOutlined } from '@ant-design/icons-vue';

const ASelectOption = ASelect.Option;

export default {
  props: {
    tableData: Array,
    columns: Array,
    tableHeight: String,
    audioFiles: Array,
    trainingRecords: Object,
  },
  emits: ['train', 'play', 'dubbingChange'],
  setup(props, { emit }) {
    const renderToneTag = (tone) => {
      const toneColors = {
        neutral: 'default',
        happy: 'green',
        sad: 'blue',
        angry: 'red',
        excited: 'volcano',
        calm: 'geekblue',
      };
      return { color: toneColors[tone] || 'default' };
    };

    const getRecordKey = (record) => `${record.speaker}-${record.content}`;

    return () => (
      <ATable
        style={{ padding: '10px', backgroundColor: '#fff', width: 'calc(100vw - 300px)' }}
        dataSource={props.tableData}
        columns={props.columns}
        size="small"
        rowKey={(record, index) => `${record.speaker}-${record.content}-${index}`}
        pagination={false}
        scroll={{ y: props.tableHeight, x: 1200 }}
        locale={{
          emptyText: props.tableData && props.tableData.length > 0 ? 'JSON数据有效但不包含TTS条目' : '尚未提供JSON数据',
        }}
        v-slots={{
          bodyCell: ({ column, record }) => {
            if (column.key === 'dubbing') {
              return (
                <ASelect
                  style={{ width: '100%' }}
                  value={record.dubbing}
                  onChange={(value) => emit('dubbingChange', { record, value })}
                  virtual
                >
                  {props.audioFiles.map((file) => (
                    <ASelectOption key={file.path} value={file.path}>
                      {file.name}
                    </ASelectOption>
                  ))}
                </ASelect>
              );
            }
            if (column.key === 'tone') {
              return <ATag color={renderToneTag(record.tone).color}>{record.tone || 'N/A'}</ATag>;
            }
            if (column.key === 'intensity') {
              return <ATag color="orange">{record.intensity || 0}</ATag>;
            }
            if (column.key === 'delay') {
              return `${record.delay || 0}ms`;
            }
            if (column.key === 'action') {
              return (
                <ASpace size="middle">
                  <AButton
                    icon={h(ExperimentOutlined)}
                    onClick={() => emit('train', record)}
                    title="训练此条数据"
                    loading={props.trainingRecords[getRecordKey(record)]}
                    disabled={props.trainingRecords[getRecordKey(record)]}
                  />
                  <AButton
                    icon={h(PlayCircleOutlined)}
                    onClick={() => emit('play', record)}
                    disabled={props.trainingRecords[getRecordKey(record)]}
                    title="播放训练后的音频"
                  />
                </ASpace>
              );
            }
            return record[column.dataIndex];
          },
        }}
      />
    );
  },
};
