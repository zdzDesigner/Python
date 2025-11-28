import React from 'react';
import { Button, Progress } from 'antd';
import { CloseOutlined } from '@ant-design/icons';

const BatchTrainingProgress = ({
  isVisible,
  progress,
  progressText,
  onCancelTraining
}) => {
  if (!isVisible) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: 'white',
      padding: '24px',
      borderRadius: '12px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
      zIndex: 1000,
      width: '450px',
      textAlign: 'center',
      border: '1px solid #e8e8e8'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '16px' 
      }}>
        <div style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          color: '#1677ff',
          flex: 1,
          textAlign: 'left'
        }}>
          批量训练进度
        </div>
        <Button
          type="text"
          icon={<CloseOutlined />}
          onClick={onCancelTraining}
          style={{ 
            border: 'none', 
            fontSize: '16px',
            color: '#888',
            padding: '4px',
            height: 'auto',
            width: 'auto'
          }}
        />
      </div>
      <div style={{ 
        marginBottom: '16px', 
        textAlign: 'left',
        fontSize: '14px',
        color: '#555',
        minHeight: '20px'
      }}>
        {progressText}
      </div>
      <Progress 
        percent={Math.round(progress)} 
        strokeColor={{
          '0%': '#1677ff',
          '100%': '#52c41a',
        }}
        size="large"
        status={progress === 100 ? 'success' : undefined}
        showInfo={true}
      />
      <div style={{ 
        marginTop: '16px',
        display: 'flex',
        justifyContent: 'center'
      }}>
        <Button
          type="primary"
          danger
          onClick={onCancelTraining}
          style={{ 
            fontWeight: '500',
            boxShadow: '0 2px 6px rgba(228, 32, 32, 0.2)'
          }}
        >
          取消训练
        </Button>
      </div>
    </div>
  );
};

export default BatchTrainingProgress;