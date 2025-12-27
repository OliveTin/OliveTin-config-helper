<template>
  <section class="actions-editor-page">
    <div class="editor-header">
      <h2>Actions Editor</h2>
      <router-link to="/config-navigator" class="back-button">← Back to Config Navigator</router-link>
    </div>
    
    <div class="actions-section">
      <div class="actions-header">
        <h3>Actions</h3>
        <button @click="addAction" class="add-button">+ Add Action</button>
      </div>
      
      <div class="actions-list">
        <div v-if="!actions || actions.length === 0" class="no-actions">
          <p>No actions yet. Click "Add Action" to create one.</p>
        </div>
        <div v-for="(action, index) in actions" :key="index" class="action-item">
          <div class="action-info">
            <div class="action-title-row">
              <strong>{{ action.title || 'Untitled Action' }}</strong>
              <div v-if="action.icon" class="action-icon">
                <iconify-icon v-if="isIconifyIcon(action.icon)" :icon="action.icon"></iconify-icon>
                <span v-else v-html="renderIcon(action.icon)"></span>
              </div>
            </div>
            <div v-if="action.shell" class="action-shell">{{ action.shell }}</div>
            <div class="action-meta">
              <span v-if="action.id" class="meta-item">ID: {{ action.id }}</span>
              <span v-if="action.entity" class="meta-item">Entity: {{ action.entity }}</span>
              <span v-if="action.hidden" class="meta-item badge">Hidden</span>
            </div>
          </div>
          <div class="action-actions">
            <button @click="editAction(index)" class="edit-button">Edit</button>
            <button @click="removeAction(index)" class="remove-button">Remove</button>
          </div>
        </div>
      </div>
    </div>
    
    <div class="actions-bar">
      <button @click="saveActions" class="save-button">Save Actions</button>
      <button @click="resetActions" class="reset-button">Reset</button>
    </div>
    
    <div v-if="message" :class="['message', messageType]">
      {{ message }}
    </div>
  </section>
</template>

<script>
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'

// Builtin emoji aliases from emoji.go
const builtinIcons = {
  poop: '&#x1f4a9;',
  smile: '&#x1F600;',
  ping: '&#x1f4e1;',
  backup: '&#128190;',
  reboot: '&#128260;',
  restart: '&#128260;',
  box: '&#128230;',
  ashtonished: '&#128562;',
  clock: '&#128338;',
  disk: '&#128189;',
  logs: '&#128269;',
  light: '&#128161;',
  robot: '&#129302;',
  ssh: '&#128272;',
  theme: '&#127912;'
}

export default {
  name: 'ActionsEditorPage',
  setup() {
    const router = useRouter()
    const route = useRoute()
    const actions = ref([])
    const message = ref('')
    const messageType = ref('')
    
    const loadActions = async () => {
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
                if (data.success && data.config && data.config.actions) {
                  actions.value = data.config.actions
                  return
                }
              } catch (err) {
                console.warn('Failed to load from YAML:', err)
              }
            }
            // Fallback: try to load from stored config object
            if (latestFile.config && latestFile.config.actions) {
              actions.value = JSON.parse(JSON.stringify(latestFile.config.actions))
            }
          }
        }
      } catch (err) {
        console.warn('Failed to load actions:', err)
      }
    }
    
    const saveActions = async () => {
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
              actions: actions.value,
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
              actions: actions.value,
              entities: [],
              dashboards: []
            }
          } else {
            targetFile.config.actions = actions.value
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
        
        message.value = 'Actions saved successfully!'
        messageType.value = 'success'
        setTimeout(() => {
          message.value = ''
        }, 3000)
      } catch (err) {
        message.value = `Error saving actions: ${err.message}`
        messageType.value = 'error'
      }
    }
    
    const resetActions = () => {
      actions.value = []
      message.value = 'Actions reset'
      messageType.value = 'info'
      setTimeout(() => {
        message.value = ''
      }, 3000)
    }
    
    const addAction = () => {
      router.push('/actions/new')
    }
    
    const editAction = (index) => {
      router.push(`/actions/edit/${index}`)
    }
    
    const removeAction = (index) => {
      if (confirm('Are you sure you want to remove this action?')) {
        actions.value.splice(index, 1)
      }
    }
    
    const isIconifyIcon = (iconValue) => {
      return iconValue && iconValue.includes(':')
    }
    
    const renderIcon = (iconValue) => {
      if (!iconValue) return ''
      
      // Check if it's a builtin alias
      if (builtinIcons[iconValue]) {
        return builtinIcons[iconValue]
      }
      
      // Otherwise, treat as HTML/Unicode (already HTML encoded or plain text)
      return iconValue
    }
    
    onMounted(() => {
      loadActions()
    })
    
    // Reload actions when returning from editor
    watch(() => route.path, (newPath) => {
      if (newPath === '/actions') {
        loadActions()
      }
    })
    
    return {
      actions,
      message,
      messageType,
      addAction,
      editAction,
      removeAction,
      saveActions,
      resetActions,
      renderIcon,
      isIconifyIcon
    }
  }
}
</script>

<style scoped>
.actions-editor-page {
  max-width: 1000px;
  margin: 0 auto;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2em;
}

.actions-section {
  margin-bottom: 1.5em;
}

.actions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5em;
}

.actions-list {
  display: flex;
  flex-direction: column;
  gap: 1em;
}

.action-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1em;
  border: 1px solid var(--border-color);
  border-radius: 0.4em;
  background: var(--standout-bg-color);
}

.action-item:hover {
  border-color: blue;
}

.action-info {
  flex: 1;
}

.action-title-row {
  display: flex;
  align-items: center;
  gap: 0.5em;
  margin-bottom: 0.5em;
}

.action-icon {
  font-size: 1.5em;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 1.5em;
  min-height: 1.5em;
}

.action-icon iconify-icon {
  font-size: 1.5em;
  color: inherit;
}

.action-shell {
  font-family: monospace;
  font-size: 0.9em;
  margin-bottom: 0.5em;
  padding: 0.5em;
  background: white;
  border-radius: 0.4em;
  word-break: break-all;
}

.action-meta {
  display: flex;
  gap: 1em;
  flex-wrap: wrap;
}

.meta-item {
  font-size: 0.875em;
}

.badge {
  background: #ffc107;
  color: #856404;
  padding: 0.25em 0.5em;
  border-radius: 0.4em;
  font-weight: 500;
}

.action-actions {
  display: flex;
  gap: 0.5em;
}

.actions-bar {
  display: flex;
  gap: 1em;
  justify-content: flex-end;
}
</style>

