import React, { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'
import { Popconfirm } from 'antd'
import { EditOutlined, CloseOutlined } from '@ant-design/icons'
import { useNotification } from '@/utils/NotificationContext'
import api from '@/utils/api'

const SectionList = forwardRef(({ id }, ref) => {
  const { showError, showSuccess } = useNotification()
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(false)
  const [section_edit, setSectionEdit] = useState({
    book_id: '',
    name: '',
    describe: '',
    size: ''
  })
  const [hover_id, setHoverId] = useState(null)
  const [open_id, setOpenId] = useState(null)

  // Expose the addNewSection function to parent components
  useImperativeHandle(ref, () => ({ addNewSection }))
  // Fetch sections from API
  useEffect(() => {
    fetchSections()
  }, [])

  const fetchSections = async () => {
    try {
      setLoading(true)
      const data = await api.get('/sections')
      setSections(data || [])
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
    setSectionEdit((prev) => ({ ...prev, id: section.id, name: section.name }))
  }

  const saveInlineEdit = async (sectionId, newName) => {
    // Find the original section to compare with the new name
    const originalSection = sections.find((s) => s.id === sectionId)
    const originalName = originalSection ? originalSection.name : ''

    // Check if the name is empty
    if (!newName.trim()) {
      showError('Section name cannot be empty')
      // Revert to original name
      setSectionEdit((prev) => ({ ...prev, name: originalName }))
      return
    }

    // Check if the name has actually changed
    if (newName === originalName) {
      // If no change, simply exit edit mode
      setSectionEdit((prev) => ({ ...prev, id: null }))
      return
    }

    try {
      const response = await api.put(`/sections/${sectionId}`, { name: newName })
      if (response.code === 0) {
        setSections((prev) => prev.map((section) => (section.id === sectionId ? { ...section, name: newName } : section)))
        showSuccess('Success', 'Section name updated successfully')
        setSectionEdit((prev) => ({ ...prev, id: null })) // Exit edit mode
      } else {
        showError(response.error || 'Failed to update section name')
        // Revert the name back to the original
        setSectionEdit((prev) => ({ ...prev, name: originalName }))
      }
    } catch (error) {
      showError(error.message || 'Error updating section name')
      // Revert the name back to the original
      setSectionEdit((prev) => ({ ...prev, name: originalName }))
    }
  }

  // Function to save a new section to the backend
  const saveNewSection = async (tempId, newName) => {
    // Check if the name is empty
    if (!newName.trim()) {
      // showError('Section name cannot be empty')
      // Remove the temporary section
      setSections((prev) => prev.filter((s) => s.id !== tempId))
      setSectionEdit({ book_id: '', name: '', describe: '', size: '' })
      return
    }

    try {
      const response = await api.post('/sections', {
        name: newName,
        book_id: section_edit.book_id || 1, // Use provided book_id or default to 1
        describe: section_edit.describe || '',
        size: section_edit.size || 0
      })

      if (response.code === 0) {
        setSections((prev) => prev.map((section) => (section.id === section_edit.id ? { ...section, name: newName, id: response.id } : section)))
        showSuccess('Success', 'Section created successfully')
        setSectionEdit({ book_id: '', name: '', describe: '', size: '' }) // Exit edit mode
      }
    } catch (error) {
      showError(error.message || 'Error creating section')
      // Remove the temporary section
    }
  }

  // Function to add a new section
  const addNewSection = useCallback(() => {
    // Create a temporary section object with a temporary ID
    const newSection = {
      id: `temp-${Date.now()}`, // Use a temporary ID
      name: '',
      book_id: 1 // Default value, can be changed
    }

    // Add the new section to the end of the list
    setSections((prev) => [...prev, newSection])

    // Set the form data to edit this new section
    setSectionEdit({ ...newSection })
  }, [])

  return (
    <div className="bg-white border-r border-gray-200 h-full flex flex-col">
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
                className={`flex items-center justify-between px-2 py-2 hover:bg-gray-100 rounded ${id == section.id && 'bg-gray-100'}`}
                onMouseEnter={() => setHoverId(section.id)}
                onMouseLeave={() => setHoverId(null)}
              >
                {section_edit.id === section.id ? (
                  <input
                    type="text"
                    value={section_edit.name}
                    onChange={(e) => setSectionEdit((prev) => ({ ...prev, name: e.target.value }))}
                    onBlur={() => {
                      // Check if this is a temporary section (just added)
                      if (String(section.id).startsWith('temp-')) {
                        // This is a new section that needs to be saved to the backend
                        saveNewSection(section.id, section_edit.name)
                      } else {
                        saveInlineEdit(section.id, section_edit.name)
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (String(section.id).startsWith('temp-')) {
                          saveNewSection(section.id, section_edit.name)
                        } else {
                          saveInlineEdit(section.id, section_edit.name)
                        }
                      } else if (e.key === 'Escape') {
                        if (String(section.id).startsWith('temp-')) {
                          setSections((prev) => prev.filter((s) => s.id !== section.id))
                          setSectionEdit({ book_id: '', name: '', describe: '', size: '' })
                        } else {
                          setSectionEdit((prev) => ({ ...prev, name: section.name, id: null }))
                        }
                      }
                    }}
                    className="text-sm text-[14px]/[2] rounded px-0 py-0 flex-1 outline-none truncate bg-transparent leading-5"
                    autoFocus
                  />
                ) : (
                  <span className="text-sm text-[14px]/[2] text-gray-700 truncate flex-1 px-0 py-0 cursor-pointer hover:text-blue-600 transition-colors leading-5">
                    {section.name}
                  </span>
                )}
                {section_edit.id != section.id && (open_id === section.id || hover_id === section.id) && (
                  <div className="w-6 flex justify-center items-center">
                    {<EditOutlined style={{ fontSize: 12 }} onClick={() => startInlineEdit(section)} />}
                    <Popconfirm
                      title="确认删除"
                      description="您确定要删除这个章节吗？此操作不可撤销。"
                      onOpenChange={(isopen) => setOpenId(isopen ? section.id : null)}
                      onConfirm={(e) => {
                        e?.stopPropagation() // Prevent triggering the edit when clicking delete
                        handleDelete(section.id)
                      }}
                      okText="确认"
                      cancelText="取消"
                    >
                      <CloseOutlined style={{ fontSize: 12, color: 'red' }} className="px-2" onClick={(e) => e.stopPropagation()} />
                    </Popconfirm>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
})

export default SectionList
