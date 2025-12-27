<template>
  <div class="file-manager">
    <div class="file-manager-header">
      <h3>Configuration Files</h3>
      <button @click="showNewFileDialog = true" class="new-file-button">New Config</button>
    </div>
    
    <div class="files-list">
      <div
        v-for="file in files"
        :key="file.id"
        :class="['file-item', { active: file.id === currentFileId }]"
        @click="selectFile(file.id)"
      >
        <div class="file-name">{{ file.name }}</div>
        <div class="file-meta">
          <span class="file-date">{{ formatDate(file.lastEdited) }}</span>
          <button
            @click.stop="deleteFile(file.id)"
            class="delete-file-button"
            title="Delete file"
          >
            ×
          </button>
        </div>
      </div>
      <div v-if="files.length === 0" class="no-files">
        No saved files. Create a new file to get started.
      </div>
    </div>
    
    <div v-if="showNewFileDialog" class="modal-overlay" @click.self="closeNewFileDialog">
      <div class="modal-content">
        <div class="modal-header">
          <h3>New Configuration File</h3>
          <button @click="closeNewFileDialog" class="close-button">&times;</button>
        </div>
        <form @submit.prevent="createNewFile" class="modal-body">
          <label>
            File Name
            <input
              v-model="newFileName"
              type="text"
              placeholder="config.yaml"
              ref="newFileInput"
            />
          </label>
          <div class="modal-footer">
            <button type="button" @click="closeNewFileDialog" class="cancel-button">Cancel</button>
            <button type="submit" class="save-button" :disabled="!newFileName.trim()">
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, nextTick, watch } from 'vue'

export default {
  name: 'FileManager',
  props: {
    currentFileId: {
      type: String,
      default: null
    }
  },
  emits: ['select-file', 'new-file', 'delete-file'],
  setup(props, { emit }) {
    const files = ref([])
    const showNewFileDialog = ref(false)
    const newFileName = ref('')
    const newFileInput = ref(null)
    
    const loadFiles = () => {
      try {
        const filesData = localStorage.getItem('olivetin-config-files')
        if (filesData) {
          files.value = JSON.parse(filesData)
        }
      } catch (err) {
        console.warn('Failed to load files:', err)
        files.value = []
      }
    }
    
    const saveFiles = () => {
      try {
        localStorage.setItem('olivetin-config-files', JSON.stringify(files.value))
      } catch (err) {
        console.warn('Failed to save files:', err)
      }
    }
    
    const selectFile = (fileId) => {
      emit('select-file', fileId)
    }
    
    const createNewFile = () => {
      if (!newFileName.value.trim()) return
      
      const newFile = {
        id: Date.now().toString(),
        name: newFileName.value.trim(),
        yaml: '',
        lastEdited: Date.now()
      }
      
      files.value.push(newFile)
      saveFiles()
      emit('new-file', newFile.id)
      closeNewFileDialog()
    }
    
    const deleteFile = (fileId) => {
      if (confirm('Are you sure you want to delete this file?')) {
        files.value = files.value.filter(f => f.id !== fileId)
        saveFiles()
        emit('delete-file', fileId)
      }
    }
    
    const closeNewFileDialog = async () => {
      showNewFileDialog.value = false
      newFileName.value = ''
    }
    
    watch(showNewFileDialog, async (isOpen) => {
      if (isOpen) {
        await nextTick()
        if (newFileInput.value) {
          newFileInput.value.focus()
        }
      }
    })
    
    const formatDate = (timestamp) => {
      const date = new Date(timestamp)
      const now = new Date()
      const diff = now - date
      const minutes = Math.floor(diff / 60000)
      const hours = Math.floor(diff / 3600000)
      const days = Math.floor(diff / 86400000)
      
      if (minutes < 1) return 'Just now'
      if (minutes < 60) return `${minutes}m ago`
      if (hours < 24) return `${hours}h ago`
      if (days < 7) return `${days}d ago`
      
      return date.toLocaleDateString()
    }
    
    onMounted(() => {
      loadFiles()
    })
    
    return {
      files,
      showNewFileDialog,
      newFileName,
      newFileInput,
      selectFile,
      createNewFile,
      deleteFile,
      closeNewFileDialog,
      formatDate
    }
  }
}
</script>

<style>
.file-manager {
  margin-bottom: 2em;
  padding: 1em;
  border: 1px solid var(--border-color);
  border-radius: 0.4em;
  background: var(--standout-bg-color);
}

.file-manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1em;
}

.files-list {
  display: flex;
  flex-direction: column;
  gap: 0.5em;
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75em;
  border: 1px solid var(--border-color);
  border-radius: 0.4em;
  background: white;
  cursor: pointer;
}

.file-item:hover {
  background: var(--hover-background-color);
}

.file-item.active {
  border-color: blue;
  background: var(--standout-bg-color);
}

.file-meta {
  display: flex;
  align-items: center;
  gap: 1em;
}

.file-date {
  font-size: 0.875em;
  color: #666;
}

.delete-file-button {
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 50%;
  width: 1.5em;
  height: 1.5em;
  cursor: pointer;
  font-size: 1.2em;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 0.4em;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 0 0.5em #9a9a9a;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1em;
  border-bottom: 1px solid var(--border-color);
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5em;
  cursor: pointer;
  padding: 0;
  width: 2em;
  height: 2em;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-body {
  padding: 1em;
  grid-template-columns: 1fr;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5em;
  padding: 1em 0 0 0;
  margin-top: 1em;
  border-top: 1px solid var(--border-color);
}
</style>

