import React, { useState, useEffect } from 'react';
import { fetchVoices, createVoice, updateVoice, deleteVoice } from '@/service/api/dubbing';

// Voice Card Component
const VoiceCard = ({ voice, onEdit, onDelete }) => {
  // Construct full URL for avatar if it's a relative path
  const getAvatarUrl = () => {
    if (!voice.avatar) return null;
    if (voice.avatar.startsWith('http')) {
      return voice.avatar;
    }
    // Assuming the avatar is served from the backend
    return `http://localhost:8081/${voice.avatar}`;
  };

  return (
    <div style={{
      border: '1px solid #ddd',
      borderRadius: '8px',
      padding: '16px',
      margin: '8px',
      width: '200px',
      textAlign: 'center',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      backgroundColor: '#fff'
    }}>
      {/* Avatar */}
      <div style={{
        width: '100px',
        height: '100px',
        borderRadius: '50%',
        overflow: 'hidden',
        margin: '0 auto 12px',
        border: '2px solid #eee'
      }}>
        {voice.avatar ? (
          <img 
            src={getAvatarUrl()} 
            alt={voice.name} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '40px',
            color: '#999'
          }}>
            👤
          </div>
        )}
      </div>
      
      {/* Name and Age */}
      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
        {voice.name} · {voice.age_text}
      </div>
      
      {/* Emotion Text */}
      <div style={{ 
        fontSize: '14px', 
        color: '#666', 
        marginBottom: '12px',
        minHeight: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {voice.emotion_text}
      </div>
      
      {/* Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button 
          onClick={() => onEdit(voice)}
          style={{
            flex: 1,
            marginRight: '4px',
            padding: '6px 12px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          编辑
        </button>
        <button 
          onClick={() => onDelete(voice.id)}
          style={{
            flex: 1,
            marginLeft: '4px',
            padding: '6px 12px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          删除
        </button>
      </div>
    </div>
  );
};

// Voice Form Modal Component
const VoiceFormModal = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    name: '',
    age_text: '',
    emotion_text: '',
    avatar: '',
    wav_path: ''
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [wavFile, setWavFile] = useState(null);
  const [previewAvatar, setPreviewAvatar] = useState(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        age_text: initialData.age_text || '',
        emotion_text: initialData.emotion_text || '',
        avatar: initialData.avatar || '',
        wav_path: initialData.wav_path || ''
      });
      setPreviewAvatar(initialData.avatar || null);
      setAvatarFile(null);
      setWavFile(null);
    } else {
      setFormData({
        name: '',
        age_text: '',
        emotion_text: '',
        avatar: '',
        wav_path: ''
      });
      setPreviewAvatar(null);
      setAvatarFile(null);
      setWavFile(null);
    }
  }, [initialData, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files.length > 0) {
      const file = files[0];
      
      if (name === 'avatar_file') {
        setAvatarFile(file);
        
        // Preview avatar
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviewAvatar(e.target.result);
        };
        reader.readAsDataURL(file);
      } else if (name === 'wav_file') {
        setWavFile(file);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData, avatarFile, wavFile);
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '8px',
        width: '400px',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <h2 style={{ marginTop: 0 }}>{initialData ? '编辑音色' : '新增音色'}</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label>名称:</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '8px',
                marginTop: '4px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label>年龄文本:</label>
            <input
              type="text"
              name="age_text"
              value={formData.age_text}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '8px',
                marginTop: '4px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label>情感文本:</label>
            <input
              type="text"
              name="emotion_text"
              value={formData.emotion_text}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '8px',
                marginTop: '4px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label>头像URL:</label>
            <input
              type="text"
              name="avatar"
              value={formData.avatar}
              onChange={handleChange}
              placeholder="可选：头像图片URL"
              style={{
                width: '100%',
                padding: '8px',
                marginTop: '4px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label>上传头像:</label>
            <input
              type="file"
              name="avatar_file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ 
                width: '100%',
                marginTop: '4px'
              }}
            />
            {previewAvatar && (
              <div style={{ marginTop: '8px' }}>
                <img 
                  src={previewAvatar} 
                  alt="Preview" 
                  style={{ width: '50px', height: '50px', borderRadius: '50%' }}
                />
              </div>
            )}
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label>音频文件路径:</label>
            <input
              type="text"
              name="wav_path"
              value={formData.wav_path}
              onChange={handleChange}
              placeholder="可选：音频文件路径"
              style={{
                width: '100%',
                padding: '8px',
                marginTop: '4px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label>上传音频文件:</label>
            <input
              type="file"
              name="wav_file"
              accept="audio/wav,audio/mp3"
              onChange={handleFileChange}
              style={{ 
                width: '100%',
                marginTop: '4px'
              }}
            />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              取消
            </button>
            <button
              type="submit"
              style={{
                padding: '8px 16px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {initialData ? '更新' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main Dubbing Component
export const DubbingList = () => {
  const [voices, setVoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVoice, setEditingVoice] = useState(null);

  // Load voices on component mount
  useEffect(() => {
    loadVoices();
  }, []);

  const loadVoices = async () => {
    try {
      setLoading(true);
      const data = await fetchVoices();
      setVoices(data);
      setError(null);
    } catch (err) {
      setError('加载音色列表失败');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVoice = async (voiceData, avatarFile, wavFile) => {
    try {
      await createVoice(voiceData, avatarFile, wavFile);
      setIsModalOpen(false);
      loadVoices(); // Refresh the list
    } catch (err) {
      alert('创建音色失败');
      console.error(err);
    }
  };

  const handleUpdateVoice = async (voiceData, avatarFile, wavFile) => {
    try {
      await updateVoice(editingVoice.id, voiceData, avatarFile, wavFile);
      setIsModalOpen(false);
      setEditingVoice(null);
      loadVoices(); // Refresh the list
    } catch (err) {
      alert('更新音色失败');
      console.error(err);
    }
  };

  const handleDeleteVoice = async (id) => {
    if (!window.confirm('确定要删除这个音色吗？')) {
      return;
    }
    
    try {
      await deleteVoice(id);
      loadVoices(); // Refresh the list
    } catch (err) {
      alert('删除音色失败');
      console.error(err);
    }
  };

  const handleEditClick = (voice) => {
    setEditingVoice(voice);
    setIsModalOpen(true);
  };

  const handleAddClick = () => {
    setEditingVoice(null);
    setIsModalOpen(true);
  };

  const handleSubmit = (formData, avatarFile, wavFile) => {
    if (editingVoice) {
      handleUpdateVoice(formData, avatarFile, wavFile);
    } else {
      handleCreateVoice(formData, avatarFile, wavFile);
    }
  };

  if (loading) {
    return <div>加载中...</div>;
  }

  if (error) {
    return <div>错误: {error}</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px' 
      }}>
        <h1>音色管理</h1>
        <button
          onClick={handleAddClick}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          新增音色
        </button>
      </div>
      
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        {voices.map(voice => (
          <VoiceCard 
            key={voice.id} 
            voice={voice} 
            onEdit={handleEditClick}
            onDelete={handleDeleteVoice}
          />
        ))}
        
        {voices.length === 0 && !loading && (
          <div style={{ 
            width: '100%', 
            textAlign: 'center', 
            padding: '40px',
            color: '#666'
          }}>
            暂无音色数据，请添加新的音色
          </div>
        )}
      </div>
      
      <VoiceFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingVoice(null);
        }}
        onSubmit={handleSubmit}
        initialData={editingVoice}
      />
    </div>
  );
};