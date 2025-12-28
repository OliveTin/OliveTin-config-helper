<template>
  <div class="app">
    <header>
      <div class="header-top-row">
        <router-link to="/" class="clickable-title">
          <div class="header-title-container">
            <img :src="OliveTinLogo" alt="OliveTin Logo" class="header-logo" />
            <h1>OliveTin Config Helper</h1>
          </div>
        </router-link>
        <div v-if="currentFileName" class="current-file-container">
          <p class="current-file">Currently editing: <strong>{{ currentFileName }}</strong></p>
          <div class="header-buttons">
            <button @click="closeConfig" class="close-button" title="Close current config">×</button>
            <button @click="showYAMLViewer = true" class="yaml-button" title="View YAML">Get YAML</button>
          </div>
        </div>
      </div>
    </header>
   
    <div id = "layout">
      <div id = "content">
        <main>
          <router-view />
        </main>
        
        <footer>
          <span><a href="https://docs.olivetin.app" target="_blank">Documentation</a></span>
          <span v-if="appVersion">v{{ appVersion }}</span>
        </footer>
      </div>
    </div>
    
    <YAMLViewer
      :show="showYAMLViewer"
      :file-id="currentFileId"
      @close="showYAMLViewer = false"
    />
  </div>
</template>

<script>
import { ref, onMounted, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCurrentFile } from './composables/useCurrentFile.js'
import YAMLViewer from './components/YAMLViewer.vue'
import OliveTinLogo from './OliveTinLogo.svg'

export default {
  name: 'App',
  components: {
    YAMLViewer
  },
  setup() {
    const router = useRouter()
    const route = useRoute()
    const { currentFileName, setCurrentFileId, getCurrentFileId, currentFileId } = useCurrentFile()
    const showYAMLViewer = ref(false)
    const appVersion = ref(null)
    
    // Fetch app initialization data
    const fetchInitData = async () => {
      try {
        const response = await fetch('/api/init')
        if (response.ok) {
          const data = await response.json()
          appVersion.value = data.version
        }
      } catch (err) {
        console.warn('Failed to fetch init data:', err)
      }
    }
    
    // Initialize current file ID from localStorage if not already set
    onMounted(() => {
      fetchInitData()
      if (!getCurrentFileId()) {
        try {
          const filesData = localStorage.getItem('olivetin-config-files')
          if (filesData) {
            const files = JSON.parse(filesData)
            if (files.length > 0) {
              // Get the most recently edited file
              const sortedFiles = [...files].sort((a, b) => b.lastEdited - a.lastEdited)
              setCurrentFileId(sortedFiles[0].id)
            }
          }
        } catch (err) {
          console.warn('Failed to initialize current file:', err)
        }
      }
      
      // If we have a current file ID and we're on the home page, navigate to config navigator
      if (getCurrentFileId() && route.path === '/') {
        router.push('/config-navigator')
      }
    })
    
    // Watch for route changes to home page - if we have a config, navigate to config navigator
    // Use currentFileId ref directly to ensure reactive updates
    watch([() => route.path, currentFileId], ([newPath, fileId]) => {
      // Only redirect if we're on home and have a file ID (not null)
      if (newPath === '/' && fileId) {
        router.push('/config-navigator')
      }
    })
    
    const closeConfig = async () => {
      // Clear the file ID first - this will make the watcher not redirect
      setCurrentFileId(null)
      // Wait for reactive state to update
      await nextTick()
      // Then navigate to home with a flag to prevent auto-loading
      router.push({ path: '/', query: { closed: 'true' } })
    }
    
    return {
      currentFileName,
      currentFileId,
      showYAMLViewer,
      closeConfig,
      OliveTinLogo,
      appVersion
    }
  }
}
</script>

<style>
header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 2em;
}

.header-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 2em;
}

.header-subtitle {
  margin-top: 0.5em;
}

.clickable-title {
  text-decoration: none;
  color: inherit;
  cursor: pointer;
  display: inline-block;
}

.header-title-container {
  display: flex;
  align-items: center;
  gap: 1em;
}

.header-logo {
  height: 3em;
  width: auto;
}

.current-file-container {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1em;
  flex-shrink: 0;
}

.current-file {
  margin: 0;
}

.header-buttons {
  display: flex;
  align-items: center;
  gap: 0.5em;
  padding-right: .5em;
}

.yaml-button {
  color: white;
  background-color: black;
  border: 2px solid white;
}

.yaml-button:hover {
  background: blue;
  color: #fff;
}

.close-button {
  background: #fff;
  color: #dc3545;
  border: 2px solid #dc3545;
  border-radius: 50%;
  width: 1.75em;
  height: 1.75em;
  font-size: 1.5em;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  font-weight: bold;
}

.close-button:hover {
  background: #dc3545;
  color: #fff;
  transform: scale(1.1);
}

</style>

