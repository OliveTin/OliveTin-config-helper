<template>
  <div v-if="show" class="yaml-modal-overlay" @click.self="close">
    <div class="yaml-modal">
      <div class="yaml-modal-header">
        <h2>Generated YAML</h2>
        <button @click="close" class="close-modal-button" title="Close">×</button>
      </div>
      <div class="yaml-modal-content">
        <div v-if="loading" class="loading">Loading YAML...</div>
        <div v-else-if="error" class="error">{{ error }}</div>
        <div v-else-if="!yamlText" class="no-yaml">No YAML available yet. YAML will be generated as you edit the configuration.</div>
        <textarea
          v-else
          v-model="yamlText"
          readonly
          class="yaml-textarea"
        ></textarea>
      </div>
      <div class="yaml-modal-footer">
        <button @click="copyYAML" class="copy-button" :disabled="!yamlText || loading">
          {{ copySuccess ? 'Copied!' : 'Copy' }}
        </button>
        <button @click="downloadYAML" class="download-button" :disabled="!yamlText || loading">
          Download
        </button>
        <button @click="close" class="close-button">Close</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch } from 'vue'

export default {
  name: 'YAMLViewer',
  props: {
    show: {
      type: Boolean,
      required: true
    },
    fileId: {
      type: String,
      default: null
    }
  },
  emits: ['close'],
  setup(props, { emit }) {
    const yamlText = ref('')
    const loading = ref(false)
    const error = ref('')
    const copySuccess = ref(false)
    
    const loadYAML = () => {
      if (!props.fileId) {
        yamlText.value = ''
        return
      }
      
      loading.value = true
      error.value = ''
      
      try {
        const filesData = localStorage.getItem('olivetin-config-files')
        if (filesData) {
          const files = JSON.parse(filesData)
          const file = files.find(f => f.id === props.fileId)
          if (file && file.yaml) {
            yamlText.value = file.yaml
          } else {
            yamlText.value = ''
          }
        } else {
          yamlText.value = ''
        }
      } catch (err) {
        error.value = `Failed to load YAML: ${err.message}`
        yamlText.value = ''
      } finally {
        loading.value = false
      }
    }
    
    watch(() => props.show, (newValue) => {
      if (newValue) {
        loadYAML()
      }
    })
    
    watch(() => props.fileId, () => {
      if (props.show) {
        loadYAML()
      }
    })
    
    const copyYAML = async () => {
      if (!yamlText.value) return
      
      try {
        await navigator.clipboard.writeText(yamlText.value)
        copySuccess.value = true
        setTimeout(() => {
          copySuccess.value = false
        }, 2000)
      } catch (err) {
        error.value = `Failed to copy: ${err.message}`
      }
    }
    
    const downloadYAML = () => {
      if (!yamlText.value) return
      
      const blob = new Blob([yamlText.value], { type: 'text/yaml' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'config.yaml'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
    
    const close = () => {
      emit('close')
    }
    
    return {
      yamlText,
      loading,
      error,
      copySuccess,
      copyYAML,
      downloadYAML,
      close
    }
  }
}
</script>

<style scoped>
.yaml-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1em;
}

.yaml-modal {
  background: white;
  border-radius: 0.4em;
  box-shadow: 0 0 0.5em #9a9a9a;
  max-width: 90vw;
  max-height: 90vh;
  width: 800px;
  display: flex;
  flex-direction: column;
}

.yaml-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1em 1.5em;
  border-bottom: 1px solid var(--border-color);
}

.close-modal-button {
  background: none;
  border: none;
  font-size: 2em;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  width: 1.5em;
  height: 1.5em;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.4em;
}

.close-modal-button:hover {
  background: var(--hover-background-color);
}

.yaml-modal-content {
  flex: 1;
  overflow: auto;
  padding: 1.5em;
  min-height: 200px;
}

.yaml-textarea {
  width: 100%;
  min-height: 400px;
  font-family: monospace;
  font-size: 0.9em;
  resize: vertical;
}

.yaml-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5em;
  padding: 1em 1.5em;
  border-top: 1px solid var(--border-color);
}
</style>

