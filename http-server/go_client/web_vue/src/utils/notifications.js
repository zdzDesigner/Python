import { notification } from 'ant-design-vue';

export const useNotification = () => {
  const openNotification = (type, message, description, placement = 'topRight') => {
    notification[type]({
      message,
      description,
      placement,
      duration: 4.5,
    });
  };

  const showError = (message, description = '') => {
    openNotification('error', 'Error', message || description);
  };

  const showSuccess = (message, description = '') => {
    openNotification('success', 'Success', message || description);
  };

  const showWarning = (message, description = '') => {
    openNotification('warning', 'Warning', message || description);
  };

  const showInfo = (message, description = '') => {
    openNotification('info', 'Info', message || description);
  };

  return { showError, showSuccess, showWarning, showInfo };
};
