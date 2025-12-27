<template>
  <section class="troubleshooting-editor">
    <div class="editor-header">
      <h2>Troubleshooting Settings</h2>
      <router-link to="/config-navigator" class="back-button">← Back to Config Navigator</router-link>
    </div>
    
    <div class="warning-banner">
      <strong>⚠️ Warning:</strong> These options expose sensitive information and should only be enabled temporarily for troubleshooting purposes. Disable them when not in use.
    </div>
    
    <form @submit.prevent="saveSettings" class="settings-form">
      <label for="dumpSOSReports">
        Dump SOS Reports:
        <small class="help-text">Allows dumping SOS reports as plain text for debugging</small>
      </label>
      <label class="checkbox-label">
        <input id="dumpSOSReports" v-model="localConfig.insecure.dumpSOSReports" type="checkbox" />
        Enable Dump SOS Reports
      </label>
      
      <label for="dumpActionMap">
        Dump Action Map:
        <small class="help-text">Enables dumping all actions and their public IDs</small>
      </label>
      <label class="checkbox-label">
        <input id="dumpActionMap" v-model="localConfig.insecure.dumpActionMap" type="checkbox" />
        Enable Dump Action Map
      </label>
      
      <label for="dumpVars">
        Dump Vars:
        <small class="help-text">Permits dumping all string variables used for entities</small>
      </label>
      <label class="checkbox-label">
        <input id="dumpVars" v-model="localConfig.insecure.dumpVars" type="checkbox" />
        Enable Dump Vars
      </label>
      
      <label for="dumpJWTClaims">
        Dump JWT Claims:
        <small class="help-text">Allows dumping all claims from a successfully parsed JWT token</small>
      </label>
      <label class="checkbox-label">
        <input id="dumpJWTClaims" v-model="localConfig.insecure.dumpJWTClaims" type="checkbox" />
        Enable Dump JWT Claims
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
  name: 'TroubleshootingEditor',
  setup() {
    const localConfig = ref({
      insecure: {
        dumpSOSReports: false,
        dumpActionMap: false,
        dumpVars: false,
        dumpJWTClaims: false
      }
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
                  if (data.config.insecure) {
                    localConfig.value.insecure = {
                      dumpSOSReports: data.config.insecure.dumpSOSReports || false,
                      dumpActionMap: data.config.insecure.dumpActionMap || false,
                      dumpVars: data.config.insecure.dumpVars || false,
                      dumpJWTClaims: data.config.insecure.dumpJWTClaims || false
                    }
                  }
                  return
                }
              } catch (err) {
                console.warn('Failed to load from YAML:', err)
              }
            }
            // Fallback: try to load from stored config object
            if (latestFile.config && latestFile.config.insecure) {
              localConfig.value.insecure = {
                dumpSOSReports: latestFile.config.insecure.dumpSOSReports || false,
                dumpActionMap: latestFile.config.insecure.dumpActionMap || false,
                dumpVars: latestFile.config.insecure.dumpVars || false,
                dumpJWTClaims: latestFile.config.insecure.dumpJWTClaims || false
              }
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
            config: { 
              listenAddressSingleHTTPFrontend: '0.0.0.0:1337',
              logLevel: 'INFO',
              insecure: { ...localConfig.value.insecure },
              actions: [], 
              entities: [], 
              dashboards: [] 
            }
          }
          files.push(targetFile)
        } else {
          // Update the latest file
          const sortedFiles = [...files].sort((a, b) => b.lastEdited - a.lastEdited)
          targetFile = sortedFiles[0]
          if (!targetFile.config) {
            targetFile.config = { 
              listenAddressSingleHTTPFrontend: '0.0.0.0:1337',
              logLevel: 'INFO',
              insecure: { ...localConfig.value.insecure },
              actions: [], 
              entities: [], 
              dashboards: [] 
            }
          } else {
            if (!targetFile.config.insecure) {
              targetFile.config.insecure = {}
            }
            targetFile.config.insecure.dumpSOSReports = localConfig.value.insecure.dumpSOSReports
            targetFile.config.insecure.dumpActionMap = localConfig.value.insecure.dumpActionMap
            targetFile.config.insecure.dumpVars = localConfig.value.insecure.dumpVars
            targetFile.config.insecure.dumpJWTClaims = localConfig.value.insecure.dumpJWTClaims
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
        insecure: {
          dumpSOSReports: false,
          dumpActionMap: false,
          dumpVars: false,
          dumpJWTClaims: false
        }
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
.troubleshooting-editor {
  max-width: 800px;
  margin: 0 auto;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.warning-banner {
  padding: 1em;
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 0.4em;
  margin-bottom: 2em;
  color: #856404;
}

.warning-banner strong {
  display: block;
  margin-bottom: 0.5em;
}

.settings-form {
  grid-template-columns: 1fr 1fr;
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

.checkbox-label {
  grid-column: span 2;
}
</style>

