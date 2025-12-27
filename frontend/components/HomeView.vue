<template>
  <div class="home-view">
    <!-- Selection Dialog: New/Import/Load -->
    <div v-if="!config" class="selection-dialog">
      <div class="tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="['tab-button', { active: activeTab === tab.id }]"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>
      
      <div class="tab-content">
        <!-- Load Tab -->
        <div v-if="activeTab === 'load'" class="tab-panel">
          <FileManager
            :current-file-id="localFileId"
            @select-file="handleSelectFile"
            @new-file="handleNewFile"
            @delete-file="handleDeleteFile"
          />
        </div>
        
        <!-- Import Tab -->
        <div v-if="activeTab === 'import'" class="tab-panel">
          <ConfigImporter
            @imported="handleConfigImported"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import FileManager from './FileManager.vue'
import ConfigImporter from './ConfigImporter.vue'
import { useCurrentFile } from '../composables/useCurrentFile.js'

export default {
  name: 'HomeView',
  components: {
    FileManager,
    ConfigImporter
  },
  setup() {
    const router = useRouter()
    const route = useRoute()
    const config = ref(null)
    const localFileId = ref(null)
    const activeTab = ref('load')
    
    const { setCurrentFileId, currentFileId } = useCurrentFile()
    
    // Watch for current file ID changes and reset config if it becomes null
    watch(currentFileId, (newFileId) => {
      if (!newFileId && localFileId.value) {
        config.value = null
        localFileId.value = null
      }
    })
    
    const tabs = [
      { id: 'load', label: 'Load' },
      { id: 'import', label: 'Import' }
    ]
    
    const getFiles = () => {
      try {
        const filesData = localStorage.getItem('olivetin-config-files')
        return filesData ? JSON.parse(filesData) : []
      } catch (err) {
        console.warn('Failed to get files:', err)
        return []
      }
    }
    
    const saveFiles = (files) => {
      try {
        localStorage.setItem('olivetin-config-files', JSON.stringify(files))
      } catch (err) {
        console.warn('Failed to save files:', err)
      }
    }
    
    const loadFile = async (fileId) => {
      const files = getFiles()
      const file = files.find(f => f.id === fileId)
      if (file && file.yaml) {
        try {
          const response = await fetch('/api/import', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              config: file.yaml
            })
          })
          
          const data = await response.json()
          if (data.success && data.config) {
            config.value = data.config
            localFileId.value = fileId
            setCurrentFileId(fileId)
            return true
          }
        } catch (err) {
          console.warn('Failed to load file:', err)
        }
      } else if (file) {
        // File exists but has no YAML - treat as new file
        localFileId.value = fileId
        setCurrentFileId(fileId)
        config.value = {
          listenAddressSingleHTTPFrontend: '0.0.0.0:1337',
          logLevel: 'INFO',
          actions: [],
          entities: [],
          dashboards: []
        }
        return true
      }
      return false
    }
    
    const loadLastEditedFile = async () => {
      const files = getFiles()
      if (files.length === 0) return false
      
      const sortedFiles = [...files].sort((a, b) => b.lastEdited - a.lastEdited)
      return await loadFile(sortedFiles[0].id)
    }
    
    const handleConfigImported = (importedConfig, yaml) => {
      const newFile = {
        id: Date.now().toString(),
        name: 'Imported Config',
        yaml: yaml || '',
        lastEdited: Date.now()
      }
      
      const files = getFiles()
      files.push(newFile)
      saveFiles(files)
      
      config.value = importedConfig
      localFileId.value = newFile.id
      setCurrentFileId(newFile.id)
      router.push('/config-navigator')
    }
    
    const handleSelectFile = async (fileId) => {
      const loaded = await loadFile(fileId)
      if (loaded) {
        router.push('/config-navigator')
      }
    }
    
    const handleNewFile = (fileId) => {
      localFileId.value = fileId
      setCurrentFileId(fileId)
      config.value = {
        listenAddressSingleHTTPFrontend: '0.0.0.0:1337',
        logLevel: 'INFO',
        actions: [],
        entities: [],
        dashboards: []
      }
      router.push('/config-navigator')
    }
    
    const handleDeleteFile = (fileId) => {
      if (localFileId.value === fileId) {
        const files = getFiles()
        const remainingFiles = files.filter(f => f.id !== fileId)
        if (remainingFiles.length > 0) {
          const lastEdited = [...remainingFiles].sort((a, b) => b.lastEdited - a.lastEdited)[0]
          loadFile(lastEdited.id)
        } else {
          config.value = null
          localFileId.value = null
          setCurrentFileId(null)
        }
      }
    }
    
    onMounted(async () => {
      // Don't auto-load if user explicitly closed the config
      if (route.query.closed === 'true') {
        // Remove the query parameter for clean URL
        router.replace({ path: '/', query: {} })
        return
      }
      // Only auto-load if no file is currently selected
      if (!currentFileId.value) {
        await loadLastEditedFile()
      }
    })
    
    return {
      config,
      localFileId,
      currentFileId: localFileId,
      activeTab,
      tabs,
      handleConfigImported,
      handleSelectFile,
      handleNewFile,
      handleDeleteFile
    }
  }
}
</script>

<style scoped>
.tabs {
  display: flex;
  border-bottom: 2px solid var(--border-color);
  margin-bottom: 1.5em;
}

.tab-button {
  padding: 0.75em 1.5em;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  margin-bottom: -2px;
}

.tab-button.active {
  border-bottom-color: blue;
  font-weight: 600;
}

.tab-content {
  min-height: 300px;
}
</style>

