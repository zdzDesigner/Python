import React, { createContext, useContext, useState } from 'react';
import { notification } from 'antd';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [api, contextHolder] = notification.useNotification();

  const openNotification = (type, message, description, placement = 'topRight') => {
    api[type]({
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

  return (
    <NotificationContext.Provider value={{ showError, showSuccess, showWarning, showInfo }}>
      {contextHolder}
      {children}
    </NotificationContext.Provider>
  );
};