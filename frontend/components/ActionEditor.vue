<template>
  <section class="action-editor">
    <div class="editor-header">
      <h2>{{ editingIndex !== null ? 'Edit Action' : 'Add Action' }}</h2>
      <router-link to="/actions" class="back-button">← Back to Actions</router-link>
    </div>
    
    <form @submit.prevent="save">
        <FormField
          id="action-title"
          label="Title"
          key-name="title"
          description="The display name for this action"
          :docs-url="getDocUrl('title')"
          docs-title="Action Title"
          type="text"
          placeholder="Action title"
          :required="true"
          v-model="actionData.title"
        />
        
        <FormField
          id="action-shell"
          label="Shell Command"
          key-name="shell"
          description="Command to execute when the action is triggered"
          :docs-url="getDocUrl('shell')"
          docs-title="Shell Command"
          input-type="textarea"
          :rows="3"
          placeholder="Command to execute"
          v-model="actionData.shell"
        />
        
        <label for="action-icon">
          Icon
          <span class="key-info">
            <code class="key-name">icon</code>
            <a :href="getDocUrl('icon')" target="_blank" class="docs-button" title="View documentation">📖</a>
          </span>
          <span class="description">Built-in icons: ping, disk, logs, clock, backup, restart, etc. Or use HTML/unicode.</span>
        </label>
        <div class="icon-input-group">
          <input id="action-icon" v-model="actionData.icon" type="text" placeholder="Icon name or HTML" />
          <button type="button" @click="showIconPicker = true" class="icon-picker-button" title="Open Icon Picker">🎨</button>
        </div>
        
        <FormField
          id="action-id"
          label="ID"
          key-name="id"
          description="Unique identifier for this action (optional)"
          :docs-url="getDocUrl('id')"
          docs-title="Action ID"
          type="text"
          placeholder="Unique identifier"
          v-model="actionData.id"
        />
        
        <FormField
          id="action-timeout"
          label="Timeout (seconds)"
          key-name="timeout"
          description="Maximum execution time in seconds (0 = no timeout)"
          :docs-url="getDocUrl('timeout')"
          docs-title="Action Timeout"
          type="number"
          :min="0"
          placeholder="0"
          v-model="actionData.timeout"
        />
        
        <template v-if="entities && entities.length > 0">
          <FormField
            id="action-entity"
            label="Entity"
            key-name="entity"
            description="Associate this action with an entity"
            :docs-url="getDocUrl('entity')"
            docs-title="Entity"
            input-type="select"
            :options="[{ value: '', label: 'None' }, ...entities.map(e => ({ value: e.id || e.name, label: e.name || e.id }))]"
            v-model="actionData.entity"
          />
        </template>
        <template v-else>
          <label>
            Entity
            <span class="key-info">
              <code class="key-name">entity</code>
              <a :href="getDocUrl('entity')" target="_blank" class="docs-button" title="View documentation">📖</a>
            </span>
            <span class="description">Associate this action with an entity</span>
          </label>
          <div class="no-entities-message">
            No entities defined yet
          </div>
        </template>
        
        <FormField
          id="action-hidden"
          label="Hidden"
          key-name="hidden"
          description="Hide this action from the web UI"
          :docs-url="getDocUrl('hidden')"
          docs-title="Hidden Action"
          type="checkbox"
          v-model="actionData.hidden"
        />
        
        <fieldset>
          <legend class="legend-with-docs">
            Arguments
            <a :href="getDocUrl('arguments')" target="_blank" class="docs-button" title="View documentation">📖</a>
          </legend>
          <div v-if="!actionData.arguments || actionData.arguments.length === 0" class="no-items">
            No arguments defined
          </div>
          <div v-else class="arguments-list">
            <div v-for="(arg, index) in actionData.arguments" :key="index" class="argument-item">
              <div class="argument-header">
                <strong>{{ arg.name || arg.title || 'Argument ' + (index + 1) }}</strong>
                <button type="button" @click="removeArgument(index)" class="remove-arg-button">Remove</button>
              </div>
              <div class="argument-fields">
                <FormField
                  :id="`arg-name-${index}`"
                  label="Name"
                  key-name="arguments[].name"
                  description="The argument name used in the shell command"
                  :docs-url="getDocUrl('arg-name')"
                  docs-title="Argument Name"
                  type="text"
                  placeholder="name"
                  v-model="arg.name"
                />
                
                <FormField
                  :id="`arg-title-${index}`"
                  label="Title"
                  key-name="arguments[].title"
                  description="Display title for this argument"
                  :docs-url="getDocUrl('arg-title')"
                  docs-title="Argument Title"
                  type="text"
                  placeholder="Display title"
                  v-model="arg.title"
                />
                
                <FormField
                  :id="`arg-type-${index}`"
                  label="Type"
                  key-name="arguments[].type"
                  description="The data type for this argument"
                  :docs-url="getDocUrl('arg-type')"
                  docs-title="Argument Type"
                  input-type="select"
                  :options="[
                    { value: 'text', label: 'text' },
                    { value: 'int', label: 'int' },
                    { value: 'ascii_identifier', label: 'ascii_identifier' },
                    { value: 'url', label: 'url' },
                    { value: 'html', label: 'html' },
                    { value: 'confirmation', label: 'confirmation' }
                  ]"
                  v-model="arg.type"
                />
                
                <FormField
                  :id="`arg-default-${index}`"
                  label="Default"
                  key-name="arguments[].default"
                  description="Default value for this argument"
                  :docs-url="getDocUrl('arg-default')"
                  docs-title="Argument Default"
                  type="text"
                  placeholder="Default value"
                  v-model="arg.default"
                />
                
                <FormField
                  :id="`arg-description-${index}`"
                  label="Description"
                  key-name="arguments[].description"
                  description="Help text describing this argument"
                  :docs-url="getDocUrl('arg-description')"
                  docs-title="Argument Description"
                  type="text"
                  placeholder="Description"
                  v-model="arg.description"
                />
              </div>
            </div>
          </div>
          <button type="button" @click="addArgument" class="add-arg-button">Add Argument</button>
          <small class="help-text">Arguments allow users to provide input when executing the action. See <a href="https://docs.olivetin.app/args/" target="_blank">documentation</a> for details.</small>
        </fieldset>
        
      <div class="actions-bar">
        <button type="button" @click="cancel" class="cancel-button">Cancel</button>
        <button type="submit" class="save-button" :disabled="!actionData.title">Save</button>
      </div>
    </form>
    
    <IconPicker
      :show="showIconPicker"
      :model-value="actionData.icon"
      @update:show="showIconPicker = $event"
      @update:model-value="actionData.icon = $event"
      @confirm="handleIconSelected"
    />
  </section>
</template>

<script>
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import IconPicker from './IconPicker.vue'
import FormField from './FormField.vue'

export default {
  name: 'ActionEditor',
  components: {
    IconPicker,
    FormField
  },
  props: {
    index: {
      type: String,
      default: null
    }
  },
  setup(props) {
    const router = useRouter()
    const route = useRoute()
    const actionData = ref({
      title: '',
      shell: '',
      icon: '',
      id: '',
      timeout: 0,
      entity: '',
      hidden: false,
      arguments: []
    })
    
    const editingIndex = ref(null)
    const entities = ref([])
    const showIconPicker = ref(false)
    
    const loadEntities = async () => {
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
                if (data.success && data.config && data.config.entities) {
                  return data.config.entities
                }
              } catch (err) {
                console.warn('Failed to load from YAML:', err)
              }
            }
            // Fallback: try to load from stored config object
            if (latestFile.config && latestFile.config.entities) {
              return JSON.parse(JSON.stringify(latestFile.config.entities))
            }
          }
        }
      } catch (err) {
        console.warn('Failed to load entities:', err)
      }
      return []
    }
    
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
                  return data.config.actions
                }
              } catch (err) {
                console.warn('Failed to load from YAML:', err)
              }
            }
            // Fallback: try to load from stored config object
            if (latestFile.config && latestFile.config.actions) {
              return JSON.parse(JSON.stringify(latestFile.config.actions))
            }
          }
        }
      } catch (err) {
        console.warn('Failed to load actions:', err)
      }
      return []
    }
    
    const saveActions = async (actions) => {
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
              actions: actions,
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
              actions: actions,
              entities: [],
              dashboards: []
            }
          } else {
            targetFile.config.actions = actions
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
      } catch (err) {
        console.warn('Failed to save actions:', err)
      }
    }
    
    onMounted(async () => {
      // Load entities first
      entities.value = await loadEntities()
      
      const index = props.index || route.params.index
      editingIndex.value = index !== undefined && index !== null ? parseInt(index) : null
      
      if (editingIndex.value !== null) {
        // Load existing action
        const actions = await loadActions()
        if (actions[editingIndex.value]) {
          const action = actions[editingIndex.value]
          actionData.value = {
            title: action.title || '',
            shell: action.shell || '',
            icon: action.icon || '',
            id: action.id || '',
            timeout: action.timeout || 0,
            entity: action.entity || '',
            hidden: action.hidden || false,
            arguments: action.arguments ? JSON.parse(JSON.stringify(action.arguments)) : []
          }
        }
      }
    })
    
    const cancel = () => {
      router.push('/actions')
    }
    
    const save = async () => {
      if (!actionData.value.title) {
        return
      }
      
      const savedAction = { ...actionData.value }
      
      if (!savedAction.shell) {
        delete savedAction.shell
      }
      if (!savedAction.icon) {
        delete savedAction.icon
      }
      if (!savedAction.id) {
        delete savedAction.id
      }
      if (!savedAction.timeout || savedAction.timeout === 0) {
        delete savedAction.timeout
      }
      if (!savedAction.entity) {
        delete savedAction.entity
      }
      if (!savedAction.hidden) {
        delete savedAction.hidden
      }
      if (!savedAction.arguments || savedAction.arguments.length === 0) {
        delete savedAction.arguments
      }
      
      // Load current actions
      const actions = await loadActions()
      
      // Update or add action
      if (editingIndex.value !== null && editingIndex.value !== undefined) {
        actions[editingIndex.value] = savedAction
      } else {
        actions.push(savedAction)
      }
      
      // Save back to localStorage
      await saveActions(actions)
      
      // Navigate back to actions page
      router.push('/actions')
    }
    
    const addArgument = () => {
      if (!actionData.value.arguments) {
        actionData.value.arguments = []
      }
      actionData.value.arguments.push({
        name: '',
        title: '',
        type: 'text',
        default: '',
        description: ''
      })
    }
    
    const removeArgument = (index) => {
      actionData.value.arguments.splice(index, 1)
    }
    
    const handleIconSelected = (icon) => {
      actionData.value.icon = icon
      showIconPicker.value = false
    }
    
    const getDocUrl = (field) => {
      const baseUrl = 'https://docs.olivetin.app'
      const docMap = {
        'title': `${baseUrl}/actions/#title`,
        'shell': `${baseUrl}/actions/#shell`,
        'icon': `${baseUrl}/actions/#icon`,
        'id': `${baseUrl}/actions/#id`,
        'timeout': `${baseUrl}/actions/#timeout`,
        'entity': `${baseUrl}/entities/`,
        'hidden': `${baseUrl}/actions/#hidden`,
        'arguments': `${baseUrl}/args/`,
        'arg-name': `${baseUrl}/args/#name`,
        'arg-title': `${baseUrl}/args/#title`,
        'arg-type': `${baseUrl}/args/#type`,
        'arg-default': `${baseUrl}/args/#default`,
        'arg-description': `${baseUrl}/args/#description`
      }
      return docMap[field] || `${baseUrl}/actions/`
    }
    
    return {
      actionData,
      editingIndex,
      entities,
      showIconPicker,
      cancel,
      save,
      addArgument,
      removeArgument,
      handleIconSelected,
      getDocUrl
    }
  }
}
</script>

<style scoped>
.action-editor {
  max-width: 1000px;
  margin: 0 auto;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2em;
}

.action-editor form {
  grid-template-columns: 1fr 1fr;
}

.action-editor textarea {
  font-family: monospace;
}

.action-editor label small {
  font-size: 0.8em;
  font-weight: normal;
  display: block;
}

.action-editor fieldset {
  grid-column: span 2;
}

.action-editor .checkbox-label {
  grid-column: span 2;
}

.required {
  color: red;
}

.argument-item {
  padding: 0.75em;
  border: 1px solid var(--border-color);
  border-radius: 0.4em;
  margin-bottom: 0.5em;
  background: var(--standout-bg-color);
}

.argument-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25em;
}

.argument-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5em;
  margin-top: 0.5em;
}

.argument-fields label {
  font-size: 0.875em;
  font-weight: normal;
}

.argument-fields input,
.argument-fields select {
  font-size: 0.875em;
}

.actions-bar {
  display: flex;
  justify-content: flex-end;
  gap: 0.5em;
  grid-column: span 2;
}

.no-entities-message {
  padding: 0.5em;
  color: #666;
  font-style: italic;
  background: var(--standout-bg-color);
  border: 1px solid var(--border-color);
  border-radius: 0.4em;
}

.icon-input-group {
  display: flex;
  gap: 0.5em;
  align-items: center;
}

.icon-input-group input {
  flex: 1;
}

.icon-picker-button {
  padding: 0.5em 0.75em;
  background: blue;
  color: white;
  border: none;
  border-radius: 0.4em;
  cursor: pointer;
  font-size: 1.2em;
  line-height: 1;
  min-width: 2.5em;
  height: 2.5em;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-picker-button:hover {
  background: #0056b3;
}

.label-with-docs {
  display: flex;
  align-items: center;
  gap: 0.5em;
}

.legend-with-docs {
  display: flex;
  align-items: center;
  gap: 0.5em;
}

.docs-button {
  text-decoration: none;
  font-size: 0.9em;
  opacity: 0.7;
  transition: opacity 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.docs-button:hover {
  opacity: 1;
  text-decoration: none;
}

.checkbox-label.label-with-docs {
  display: flex;
  align-items: center;
  gap: 0.5em;
}

.checkbox-label.label-with-docs input {
  margin-right: 0.25em;
}
</style>

