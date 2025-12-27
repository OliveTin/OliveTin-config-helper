<template>
  <div v-if="show" class="icon-picker-overlay" @click.self="close">
    <div class="icon-picker-modal">
      <div class="icon-picker-header">
        <h3>Select Icon</h3>
        <button @click="close" class="close-button" title="Close">×</button>
      </div>
      
      <div class="icon-picker-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="['tab-button', { active: activeTab === tab.id }]"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>
      
      <div class="icon-picker-content">
        <!-- Builtin Emoji Aliases Tab -->
        <div v-if="activeTab === 'builtin'" class="tab-panel">
          <div class="search-box">
            <input
              v-model="builtinSearch"
              type="text"
              placeholder="Search builtin icons..."
              class="search-input"
            />
          </div>
          <div class="icon-grid">
            <div
              v-for="(emoji, alias) in filteredBuiltinIcons"
              :key="alias"
              :class="['icon-item', { selected: selectedIcon === alias }]"
              @click="selectIcon(alias)"
              :title="alias"
            >
              <div class="icon-display" v-html="emoji"></div>
              <div class="icon-label">{{ alias }}</div>
            </div>
          </div>
        </div>
        
        <!-- Iconify Icons Tab -->
        <div v-if="activeTab === 'iconify'" class="tab-panel">
          <div class="search-box">
            <input
              v-model="iconifySearch"
              type="text"
              placeholder="Search Iconify icons (e.g., mdi:home, material-symbols:settings)..."
              class="search-input"
            />
          </div>
          <div v-if="iconifySearch && iconifyLoading" class="icon-picker-loading">
            Searching icons...
          </div>
          <div v-else-if="iconifySearch && iconifyResults.length > 0" class="icon-grid">
            <div
              v-for="icon in iconifyResults"
              :key="icon"
              :class="['icon-item', { selected: selectedIcon === icon }]"
              @click="selectIcon(icon)"
              :title="icon"
            >
              <iconify-icon :icon="icon" class="iconify-icon"></iconify-icon>
              <div class="icon-label">{{ icon }}</div>
            </div>
          </div>
          <div v-else-if="iconifySearch && !iconifyLoading" class="icon-picker-help">
            <p>No icons found. Try a different search term.</p>
          </div>
          <div v-else class="icon-picker-help">
            <p>Enter an icon name to search. Iconify uses the format:</p>
            <p><code>collection:icon-name</code></p>
            <p>Examples:</p>
            <ul>
              <li><code>mdi:home</code> - Material Design Icons</li>
              <li><code>material-symbols:settings</code> - Material Symbols</li>
              <li><code>carbon:user</code> - Carbon Icons</li>
              <li><code>heroicons:heart</code> - Heroicons</li>
            </ul>
            <p>Browse collections at <a href="https://icon-sets.iconify.design/" target="_blank">icon-sets.iconify.design</a></p>
          </div>
        </div>
        
        <!-- Custom HTML/Unicode Tab -->
        <div v-if="activeTab === 'custom'" class="tab-panel">
          <div class="custom-icon-input">
            <label for="custom-icon-value">
              Enter custom HTML or Unicode:
              <small class="help-text">You can use HTML entities (e.g., &#x1F600;) or Unicode emojis (e.g., 😀)</small>
            </label>
            <textarea
              id="custom-icon-value"
              v-model="customIconValue"
              rows="4"
              placeholder="Enter HTML or Unicode..."
              class="custom-textarea"
            ></textarea>
            <div class="custom-preview">
              <strong>Preview:</strong>
              <div class="preview-display" v-html="customIconValue || 'No preview'"></div>
            </div>
            <button
              type="button"
              @click="selectIcon(customIconValue)"
              class="use-custom-button"
              :disabled="!customIconValue"
            >
              Use This Icon
            </button>
          </div>
        </div>
      </div>
      
      <div class="icon-picker-footer">
        <div v-if="selectedIcon" class="selected-icon-display">
          <strong>Selected:</strong>
          <span class="selected-value">{{ selectedIcon }}</span>
        </div>
        <div class="icon-picker-actions">
          <button @click="close" class="cancel-button">Cancel</button>
          <button @click="confirmSelection" class="confirm-button" :disabled="!selectedIcon">Confirm</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'

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
  name: 'IconPicker',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    modelValue: {
      type: String,
      default: ''
    }
  },
  emits: ['update:show', 'update:modelValue', 'confirm'],
  setup(props, { emit }) {
    const activeTab = ref('builtin')
    const builtinSearch = ref('')
    const iconifySearch = ref('')
    const customIconValue = ref('')
    const selectedIcon = ref(props.modelValue || '')
    const iconifyResults = ref([])
    const iconifyLoading = ref(false)
    
    const tabs = [
      { id: 'builtin', label: 'Builtin Icons' },
      { id: 'iconify', label: 'Iconify Icons' },
      { id: 'custom', label: 'Custom HTML/Unicode' }
    ]
    
    const filteredBuiltinIcons = computed(() => {
      if (!builtinSearch.value) {
        return builtinIcons
      }
      const search = builtinSearch.value.toLowerCase()
      const filtered = {}
      for (const [alias, emoji] of Object.entries(builtinIcons)) {
        if (alias.toLowerCase().includes(search)) {
          filtered[alias] = emoji
        }
      }
      return filtered
    })
    
    // Watch for iconify search changes and load icons
    let searchTimeout = null
    watch(iconifySearch, async (newSearch) => {
      if (searchTimeout) {
        clearTimeout(searchTimeout)
      }
      
      if (!newSearch || newSearch.length < 2) {
        iconifyResults.value = []
        return
      }
      
      // Debounce search
      searchTimeout = setTimeout(async () => {
        iconifyLoading.value = true
        try {
          if (newSearch.includes(':')) {
            // It's already in iconify format, validate and add it
            const [collection, icon] = newSearch.split(':')
            if (collection && icon) {
              iconifyResults.value = [newSearch]
              // Try to load a few variations
              const variations = [
                newSearch,
                `${collection}:${icon}-outline`,
                `${collection}:${icon}-filled`,
                `${collection}:${icon}-round`
              ]
              iconifyResults.value = [...new Set(variations)]
            } else {
              iconifyResults.value = []
            }
          } else {
            // Search using Iconify API
            try {
              const response = await fetch(
                `https://api.iconify.design/search?query=${encodeURIComponent(newSearch)}&limit=50`
              )
              if (response.ok) {
                const data = await response.json()
                if (data.icons && Array.isArray(data.icons)) {
                  iconifyResults.value = data.icons.slice(0, 50)
                } else {
                  iconifyResults.value = []
                }
              } else {
                iconifyResults.value = []
              }
            } catch (err) {
              console.warn('Failed to search Iconify icons:', err)
              iconifyResults.value = []
            }
          }
        } finally {
          iconifyLoading.value = false
        }
      }, 300)
    })
    
    // Watch for modelValue changes
    watch(() => props.modelValue, (newValue) => {
      selectedIcon.value = newValue || ''
      if (newValue) {
        // Try to determine which tab to show
        if (builtinIcons[newValue]) {
          activeTab.value = 'builtin'
        } else if (newValue.includes(':')) {
          activeTab.value = 'iconify'
          iconifySearch.value = newValue
        } else {
          activeTab.value = 'custom'
          customIconValue.value = newValue
        }
      }
    }, { immediate: true })
    
    // Watch for show prop to initialize when opened
    watch(() => props.show, (isShowing) => {
      if (isShowing && props.modelValue) {
        selectedIcon.value = props.modelValue
        // Initialize tab based on current value
        if (builtinIcons[props.modelValue]) {
          activeTab.value = 'builtin'
        } else if (props.modelValue.includes(':')) {
          activeTab.value = 'iconify'
          iconifySearch.value = props.modelValue
        } else {
          activeTab.value = 'custom'
          customIconValue.value = props.modelValue
        }
      }
    })
    
    const selectIcon = (icon) => {
      selectedIcon.value = icon
    }
    
    const confirmSelection = () => {
      if (selectedIcon.value) {
        emit('update:modelValue', selectedIcon.value)
        emit('confirm', selectedIcon.value)
        close()
      }
    }
    
    const close = () => {
      emit('update:show', false)
    }
    
    return {
      activeTab,
      builtinSearch,
      iconifySearch,
      customIconValue,
      selectedIcon,
      iconifyResults,
      tabs,
      filteredBuiltinIcons,
      iconifyLoading,
      selectIcon,
      confirmSelection,
      close
    }
  }
}
</script>

<style scoped>
.icon-picker-overlay {
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
}

.icon-picker-modal {
  background: white;
  border-radius: 0.5em;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.icon-picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1em;
  border-bottom: 1px solid var(--border-color);
}

.icon-picker-header h3 {
  margin: 0;
}

.icon-picker-header .close-button {
  background: none;
  border: none;
  font-size: 2em;
  line-height: 1;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 1.5em;
  height: 1.5em;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-picker-header .close-button:hover {
  color: #000;
  background: #f0f0f0;
  border-radius: 50%;
}

.icon-picker-tabs {
  display: flex;
  border-bottom: 1px solid var(--border-color);
  padding: 0 1em;
}

.tab-button {
  padding: 0.75em 1.5em;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  margin-bottom: -1px;
  font-size: 0.9em;
}

.tab-button.active {
  border-bottom-color: blue;
  font-weight: 600;
}

.icon-picker-content {
  flex: 1;
  overflow-y: auto;
  padding: 1em;
}

.tab-panel {
  min-height: 300px;
}

.search-box {
  margin-bottom: 1em;
}

.search-input {
  width: 100%;
  padding: 0.5em;
  border: 1px solid var(--border-color);
  border-radius: 0.4em;
  font-size: 1em;
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 0.75em;
  max-height: 400px;
  overflow-y: auto;
}

.icon-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.75em;
  border: 2px solid var(--border-color);
  border-radius: 0.4em;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
}

.icon-item:hover {
  border-color: blue;
  background: var(--standout-bg-color);
  transform: translateY(-2px);
}

.icon-item.selected {
  border-color: blue;
  background: #e3f2fd;
}

.icon-display {
  font-size: 2em;
  margin-bottom: 0.25em;
  min-height: 1.5em;
  display: flex;
  align-items: center;
  justify-content: center;
}

.iconify-icon {
  font-size: 2em;
  margin-bottom: 0.25em;
  color: #333;
}

.icon-label {
  font-size: 0.75em;
  text-align: center;
  word-break: break-word;
  color: #666;
}

.icon-picker-help {
  padding: 2em;
  text-align: center;
  color: #666;
}

.icon-picker-help code {
  background: #f5f5f5;
  padding: 0.2em 0.4em;
  border-radius: 0.2em;
  font-family: monospace;
}

.icon-picker-help ul {
  text-align: left;
  display: inline-block;
  margin: 1em 0;
}

.icon-picker-loading {
  padding: 2em;
  text-align: center;
  color: #666;
}

.custom-icon-input {
  display: flex;
  flex-direction: column;
  gap: 1em;
}

.custom-textarea {
  width: 100%;
  padding: 0.5em;
  border: 1px solid var(--border-color);
  border-radius: 0.4em;
  font-family: monospace;
  font-size: 0.9em;
}

.custom-preview {
  padding: 1em;
  background: var(--standout-bg-color);
  border: 1px solid var(--border-color);
  border-radius: 0.4em;
}

.preview-display {
  font-size: 2em;
  margin-top: 0.5em;
  min-height: 2em;
  display: flex;
  align-items: center;
  justify-content: center;
}

.use-custom-button {
  padding: 0.75em 1.5em;
  background: blue;
  color: white;
  border: none;
  border-radius: 0.4em;
  cursor: pointer;
  font-size: 1em;
}

.use-custom-button:hover:not(:disabled) {
  background: #0056b3;
}

.use-custom-button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.icon-picker-footer {
  padding: 1em;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.selected-icon-display {
  display: flex;
  align-items: center;
  gap: 0.5em;
}

.selected-value {
  font-family: monospace;
  background: #f5f5f5;
  padding: 0.25em 0.5em;
  border-radius: 0.2em;
}

.icon-picker-actions {
  display: flex;
  gap: 0.5em;
}

.cancel-button,
.confirm-button {
  padding: 0.5em 1em;
  border: none;
  border-radius: 0.4em;
  cursor: pointer;
  font-size: 0.9em;
}

.cancel-button {
  background: #f0f0f0;
  color: #333;
}

.cancel-button:hover {
  background: #e0e0e0;
}

.confirm-button {
  background: blue;
  color: white;
}

.confirm-button:hover:not(:disabled) {
  background: #0056b3;
}

.confirm-button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.help-text {
  font-size: 0.8em;
  color: #666;
  display: block;
  margin-top: 0.25em;
}
</style>

