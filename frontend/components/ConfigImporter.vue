<template>
  <section class="config-importer">
    <div class="options">
      <div class="option-card">
        <h3>Import Existing Config (Copy and Paste)</h3>
        <p>Your config will  be sent to the server. Be careful not to paste any sensitive information.</p>
        <textarea
          v-model="configText"
          placeholder="Paste your config.yaml content here..."
          rows="10"
        ></textarea>
        <button @click="importConfig" :disabled="loading">
          {{ loading ? 'Importing...' : 'Import Config' }}
        </button>
        <div v-if="error" class="error">{{ error }}</div>
        <div v-if="success" class="success">Config imported successfully!</div>
      </div>
    </div>
  </section>
</template>

<script>
import { ref } from 'vue'

export default {
  name: 'ConfigImporter',
  emits: ['imported'],
  setup(props, { emit }) {
    const configText = ref('')
    const loading = ref(false)
    const error = ref('')
    const success = ref(false)
    
    const importConfig = async () => {
      if (!configText.value.trim()) {
        error.value = 'Please paste a configuration'
        return
      }
      
      loading.value = true
      error.value = ''
      success.value = false
      
      try {
        const response = await fetch('/api/import', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            config: configText.value
          })
        })
        
        const data = await response.json()
        
        if (data.success) {
          success.value = true
          emit('imported', data.config, configText.value)
        } else {
          error.value = data.error || 'Failed to import config'
        }
      } catch (err) {
        error.value = `Error: ${err.message}`
      } finally {
        loading.value = false
      }
    }
    
    return {
      configText,
      loading,
      error,
      success,
      importConfig
    }
  }
}
</script>

<style>
.options {
  margin-top: 1em;
}

.config-importer textarea {
  font-family: monospace;
}
</style>

