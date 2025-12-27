<template>
  <section class="common-settings-editor">
    <div class="editor-header">
      <h2>Common Settings</h2>
      <router-link to="/config-navigator" class="back-button">← Back to Config Navigator</router-link>
    </div>
    
    <form @submit.prevent="saveSettings" class="settings-form">
      <label for="listenAddressSingleHTTPFrontend">
        Listen Address:
        <small class="help-text">The address and port where OliveTin will listen for HTTP requests</small>
      </label>
      <input id="listenAddressSingleHTTPFrontend" v-model="localConfig.listenAddressSingleHTTPFrontend" type="text" placeholder="0.0.0.0:1337" />
      
      <label for="logLevel">
        Log Level:
        <small class="help-text">Set the logging verbosity level</small>
      </label>

    <select id="logLevel"  v-model="localConfig.logLevel">
        <option value="INFO">INFO</option>
        <option value="WARN">WARN</option>
        <option value="DEBUG">DEBUG</option>
    </select>

      <label for="showFooter">
        Show Footer:
        <small class="help-text">Display the footer in the OliveTin interface</small>
      </label>
      <label for="showFooter">
        <input id="showFooter" v-model="localConfig.showFooter" type="checkbox" />
        Show Footer
      </label>
      
      <label for="showNavigation">
        Show Navigation:
        <small class="help-text">Display the navigation menu in the OliveTin interface</small>
      </label>
      <label for="showNavigation">
        <input id="showNavigation" v-model="localConfig.showNavigation" type="checkbox" />
        Show Navigation
      </label>
      
      <label for="showNewVersions">
        Show New Versions:
        <small class="help-text">Display notifications for new OliveTin versions</small>
      </label>
      <label for="showNewVersions">
        <input id="showNewVersions" v-model="localConfig.showNewVersions" type="checkbox" />
        Show New Versions
      </label>
      
      <div class="actions-bar">
        <button type="submit" class="save-button">Save Settings</button>
        <button type="button" @click="resetSettings" class="reset-button">Reset</button>
      </div>
    </form>
    
    <div v-if="message" :class="['message', messageType]">
      {{ message }}
    </div>
  </section>
</template>

<script>
import { ref, onMounted } from 'vue'

export default {
  name: 'CommonSettingsEditor',
  setup() {
    const localConfig = ref({
      listenAddressSingleHTTPFrontend: '0.0.0.0:1337',
      logLevel: 'INFO',
      showFooter: true,
      showNavigation: true,
      showNewVersions: true
    })
    const message = ref('')
    const messageType = ref('')
    
    const loadConfig = async () => {
      try {
        const filesData = localStorage.getItem('olivetin-config-files')
        if (filesData) {
          const files = JSON.parse(filesData)
          if (files.length > 0) {
            const sortedFiles = [...files].sort((a, b) => b.lastEdited - a.lastEdited)
            const latestFile = sortedFiles[0]
            if (latestFile.yaml) {
              // Try to load from YAML via API
              try {
                const response = await fetch('/api/import', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    config: latestFile.yaml
                  })
                })
                
                const data = await response.json()
                if (data.success && data.config) {
                  localConfig.value.listenAddressSingleHTTPFrontend = data.config.listenAddressSingleHTTPFrontend || '0.0.0.0:1337'
                  localConfig.value.logLevel = data.config.logLevel || 'INFO'
                  localConfig.value.showFooter = data.config.showFooter !== undefined ? data.config.showFooter : true
                  localConfig.value.showNavigation = data.config.showNavigation !== undefined ? data.config.showNavigation : true
                  localConfig.value.showNewVersions = data.config.showNewVersions !== undefined ? data.config.showNewVersions : true
                  return
                }
              } catch (err) {
                console.warn('Failed to load from YAML:', err)
              }
            }
            // Fallback: try to load from stored config object
            if (latestFile.config) {
              localConfig.value.listenAddressSingleHTTPFrontend = latestFile.config.listenAddressSingleHTTPFrontend || '0.0.0.0:1337'
              localConfig.value.logLevel = latestFile.config.logLevel || 'INFO'
              localConfig.value.showFooter = latestFile.config.showFooter !== undefined ? latestFile.config.showFooter : true
              localConfig.value.showNavigation = latestFile.config.showNavigation !== undefined ? latestFile.config.showNavigation : true
              localConfig.value.showNewVersions = latestFile.config.showNewVersions !== undefined ? latestFile.config.showNewVersions : true
            }
          }
        }
      } catch (err) {
        console.warn('Failed to load config:', err)
      }
    }
    
    const saveSettings = async () => {
      try {
        // Get or create a config file
        const filesData = localStorage.getItem('olivetin-config-files')
        let files = filesData ? JSON.parse(filesData) : []
        
        let targetFile
        if (files.length === 0) {
          // Create a new file
          targetFile = {
            id: Date.now().toString(),
            name: 'Config',
            yaml: '',
            lastEdited: Date.now(),
            config: { ...localConfig.value, actions: [], entities: [], dashboards: [] }
          }
          files.push(targetFile)
        } else {
          // Update the latest file
          const sortedFiles = [...files].sort((a, b) => b.lastEdited - a.lastEdited)
          targetFile = sortedFiles[0]
          if (!targetFile.config) {
            targetFile.config = { ...localConfig.value, actions: [], entities: [], dashboards: [] }
          } else {
            targetFile.config.listenAddressSingleHTTPFrontend = localConfig.value.listenAddressSingleHTTPFrontend
            targetFile.config.logLevel = localConfig.value.logLevel
            targetFile.config.showFooter = localConfig.value.showFooter
            targetFile.config.showNavigation = localConfig.value.showNavigation
            targetFile.config.showNewVersions = localConfig.value.showNewVersions
          }
          targetFile.lastEdited = Date.now()
        }
        
        // Generate YAML
        try {
          const response = await fetch('/api/export', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              config: targetFile.config
            })
          })
          
          const data = await response.json()
          if (data.success) {
            targetFile.yaml = data.yaml
          }
        } catch (err) {
          console.warn('Failed to generate YAML:', err)
        }
        
        localStorage.setItem('olivetin-config-files', JSON.stringify(files))
        
        message.value = 'Settings saved successfully!'
        messageType.value = 'success'
        setTimeout(() => {
          message.value = ''
        }, 3000)
      } catch (err) {
        message.value = `Error saving settings: ${err.message}`
        messageType.value = 'error'
      }
    }
    
    const resetSettings = () => {
      localConfig.value = {
        listenAddressSingleHTTPFrontend: '0.0.0.0:1337',
        logLevel: 'INFO',
        showFooter: true,
        showNavigation: true,
        showNewVersions: true
      }
      message.value = 'Settings reset to defaults'
      messageType.value = 'info'
      setTimeout(() => {
        message.value = ''
      }, 3000)
    }
    
    onMounted(async () => {
      await loadConfig()
    })
    
    return {
      localConfig,
      message,
      messageType,
      saveSettings,
      resetSettings
    }
  }
}
</script>

<style scoped>
.common-settings-editor {
  max-width: 800px;
  margin: 0 auto;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.actions-bar {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  grid-column: 1;
}

label small {
    font-size: 0.8rem;
    font-weight: normal;
    display: block;
}
</style>

