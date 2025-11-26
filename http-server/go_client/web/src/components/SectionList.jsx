import React, { useState, useEffect } from 'react'
import { useNotification } from '@/utils/NotificationContext'
import api from '@/utils/api'
import { Popconfirm } from 'antd'

const SectionList = () => {
  const { showError, showSuccess } = useNotification()
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(false)
  const [editingSection, setEditingSection] = useState(null)
  const [formData, setFormData] = useState({
    book_id: '',
    name: '',
    describe: '',
    size: ''
  })
  const [hoveredItem, setHoveredItem] = useState(null)

  // Fetch sections from API
  useEffect(() => {
    fetchSections()
  }, [])

  const fetchSections = async () => {
    try {
      setLoading(true)
      const response = await api.get('/sections')
      if (response.code === 0) {
        setSections(response.data || [])
      } else {
        showError(response.error || 'Failed to fetch sections')
      }
    } catch (error) {
      showError(error.message || 'Error fetching sections')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      const response = await api.delete(`/sections/${id}`)
      if (response.code === 0) {
        showSuccess('Success', 'Section deleted successfully')
        setSections((prev) => prev.filter((section) => section.id !== id))
      } else {
        showError(response.error || 'Failed to delete section')
      }
    } catch (error) {
      showError(error.message || 'Error deleting section')
    }
  }

  // Function to handle inline editing of section name
  const startInlineEdit = (section) => {
    // Set the section being edited for inline editing (not the full form)
    setFormData((prev) => ({ ...prev, id: section.id, name: section.name }))
  }

  const saveInlineEdit = async (sectionId, newName) => {
    // Find the original section to compare with the new name
    const originalSection = sections.find((s) => s.id === sectionId)
    const originalName = originalSection ? originalSection.name : ''

    // Check if the name is empty
    if (!newName.trim()) {
      showError('Section name cannot be empty')
      // Revert to original name
      setFormData((prev) => ({ ...prev, name: originalName }))
      return
    }

    // Check if the name has actually changed
    if (newName === originalName) {
      // If no change, simply exit edit mode
      setFormData((prev) => ({ ...prev, id: null }))
      return
    }

    try {
      const response = await api.put(`/sections/${sectionId}`, { name: newName })
      if (response.code === 0) {
        setSections((prev) => prev.map((section) => (section.id === sectionId ? { ...section, name: newName } : section)))
        showSuccess('Success', 'Section name updated successfully')
        setFormData((prev) => ({ ...prev, id: null })) // Exit edit mode
      } else {
        showError(response.error || 'Failed to update section name')
        // Revert the name back to the original
        setFormData((prev) => ({ ...prev, name: originalName }))
      }
    } catch (error) {
      showError(error.message || 'Error updating section name')
      // Revert the name back to the original
      setFormData((prev) => ({ ...prev, name: originalName }))
    }
  }

  // Function to save a new section to the backend
  const saveNewSection = async (tempId, newName) => {
    // Check if the name is empty
    if (!newName.trim()) {
      showError('Section name cannot be empty')
      // Remove the temporary section
      setSections((prev) => prev.filter((s) => s.id !== tempId))
      setFormData({ book_id: '', name: '', describe: '', size: '' })
      return
    }

    try {
      const response = await api.post('/sections', {
        name: newName,
        book_id: formData.book_id || 1, // Use provided book_id or default to 1
        describe: formData.describe || '',
        size: formData.size || 0
      })

      if (response.code === 0) {
        // Replace the temporary section with the one from the backend
        setSections((prev) => prev.map((section) => (section.id === tempId ? response.data : section)))
        showSuccess('Success', 'Section created successfully')
        setFormData({ book_id: '', name: '', describe: '', size: '' }) // Exit edit mode
      } else {
        showError(response.error || 'Failed to create section')
        // Remove the temporary section
        setSections((prev) => prev.filter((s) => s.id !== tempId))
        setFormData({ book_id: '', name: '', describe: '', size: '' })
      }
    } catch (error) {
      showError(error.message || 'Error creating section')
      // Remove the temporary section
      setSections((prev) => prev.filter((s) => s.id !== tempId))
      setFormData({ book_id: '', name: '', describe: '', size: '' })
    }
  }

  // Function to add a new section
  const addNewSection = async () => {
    // Create a temporary section object with a temporary ID
    const newSection = {
      id: `temp-${Date.now()}`, // Use a temporary ID
      name: 'New Section',
      book_id: 1, // Default value, can be changed
      describe: '',
      size: 0
    }

    // Add the new section to the end of the list
    setSections((prev) => [...prev, newSection])

    // Set the form data to edit this new section
    setFormData({
      id: newSection.id,
      name: newSection.name,
      book_id: newSection.book_id,
      describe: newSection.describe,
      size: newSection.size
    })
  }

  return (
    <div className="bg-white border-r border-gray-200 h-full flex flex-col">
      {
        // <div className="p-3 border-b border-gray-200 bg-gray-50">
        //   <h3 className="text-sm font-semibold text-gray-700 mb-2">Sections</h3>
        //   <button
        //     onClick={addNewSection}
        //     className="w-full px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
        //   >
        //     添加章节
        //   </button>
        // </div>
      }

      {/* Sections list */}
      <div className="p-1 overflow-auto w-[200px]">
        {loading ? (
          <div className="flex justify-center items-center h-20">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : sections.length === 0 ? (
          <div className="text-center py-5 text-gray-500 text-sm">No sections</div>
        ) : (
          <div className="space-y-1">
            {sections.map((section) => (
              <div
                key={section.id}
                className="flex items-center justify-between px-2 py-2 hover:bg-gray-100 rounded"
                onMouseEnter={() => setHoveredItem(section.id)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                {formData.id === section.id ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    onBlur={() => {
                      // Check if this is a temporary section (just added)
                      if (String(section.id).startsWith('temp-')) {
                        // This is a new section that needs to be saved to the backend
                        saveNewSection(section.id, formData.name)
                      } else {
                        saveInlineEdit(section.id, formData.name)
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        // Check if this is a temporary section (just added)
                        if (String(section.id).startsWith('temp-')) {
                          // This is a new section that needs to be saved to the backend
                          saveNewSection(section.id, formData.name)
                        } else {
                          saveInlineEdit(section.id, formData.name)
                        }
                      } else if (e.key === 'Escape') {
                        // Cancel edit and remove the temporary section if it was just added
                        if (String(section.id).startsWith('temp-')) {
                          setSections((prev) => prev.filter((s) => s.id !== section.id))
                          setFormData({ book_id: '', name: '', describe: '', size: '' })
                        } else {
                          // Cancel edit and revert to original name
                          setFormData((prev) => ({ ...prev, name: section.name, id: null }))
                        }
                      }
                    }}
                    className="text-sm text-[14px]/[2] rounded px-0 py-0 flex-1 outline-none truncate bg-transparent leading-5"
                    autoFocus
                  />
                ) : (
                  <span
                    className="text-sm text-[14px]/[2] text-gray-700 truncate flex-1 px-0 py-0 cursor-pointer hover:text-blue-600 transition-colors leading-5"
                    onClick={() => startInlineEdit(section)}
                  >
                    {section.name}
                  </span>
                )}
                <div className="w-6 flex justify-center items-center">
                  {hoveredItem === section.id && formData.id != section.id && (
                    <Popconfirm
                      title="确认删除"
                      description="您确定要删除这个章节吗？此操作不可撤销。"
                      onConfirm={(e) => {
                        e?.stopPropagation() // Prevent triggering the edit when clicking delete
                        handleDelete(section.id)
                      }}
                      okText="确认"
                      cancelText="取消"
                    >
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="text-red-600 text-[20px]/[1]  hover:text-red-800 transition-colors cursor-pointer text-lg font-bold"
                      >
                        ×
                      </button>
                    </Popconfirm>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default SectionList
