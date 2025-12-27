import { ref, computed } from 'vue'

// Global reactive state for current file
const currentFileId = ref(null)

export function useCurrentFile() {
  const currentFileName = computed(() => {
    if (!currentFileId.value) return null
    
    try {
      const filesData = localStorage.getItem('olivetin-config-files')
      if (filesData) {
        const files = JSON.parse(filesData)
        const file = files.find(f => f.id === currentFileId.value)
        return file ? file.name : null
      }
    } catch (err) {
      console.warn('Failed to get current file name:', err)
    }
    
    return null
  })
  
  const setCurrentFileId = (fileId) => {
    currentFileId.value = fileId
  }
  
  const getCurrentFileId = () => {
    return currentFileId.value
  }
  
  return {
    currentFileId,
    currentFileName,
    setCurrentFileId,
    getCurrentFileId
  }
}

