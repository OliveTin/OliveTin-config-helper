<template>
  <label :for="id">
    {{ label }}:<span v-if="required" class="required"> *</span>
    <span class="key-info">
      <code class="key-name">{{ keyName }}</code>
      <a v-if="docsUrl" target="_blank" class="docs-button" :title="docsTitle" :href="docsUrl">📖</a>
    </span>
    <span class="description">{{ description }}</span>
  </label>
  <input
    v-if="inputType === 'input'"
    :id="id"
    :name="name || id"
    :type="type"
    :placeholder="placeholder"
    :value="type === 'checkbox' ? undefined : modelValue"
    :checked="type === 'checkbox' ? modelValue : undefined"
    :required="required"
    :min="min"
    @input="handleInput"
    @change="handleChange"
  ></input>
  <textarea
    v-else-if="inputType === 'textarea'"
    :id="id"
    :name="name || id"
    :placeholder="placeholder"
    :rows="rows"
    :value="modelValue"
    :required="required"
    @input="handleInput"
  ></textarea>
  <select
    v-else-if="inputType === 'select'"
    :id="id"
    :name="name || id"
    :value="modelValue"
    @change="handleChange"
  >
    <option v-for="option in options" :key="option.value" :value="option.value">{{ option.label }}</option>
  </select>
</template>

<script>
export default {
  name: 'FormField',
  props: {
    id: {
      type: String,
      required: true
    },
    label: {
      type: String,
      required: true
    },
    keyName: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    docsUrl: {
      type: String,
      default: ''
    },
    docsTitle: {
      type: String,
      default: ''
    },
    type: {
      type: String,
      default: 'text'
    },
    inputType: {
      type: String,
      default: 'input',
      validator: (value) => ['input', 'textarea', 'select'].includes(value)
    },
    placeholder: {
      type: String,
      default: ''
    },
    name: {
      type: String,
      default: ''
    },
    modelValue: {
      type: [String, Boolean, Number],
      default: ''
    },
    required: {
      type: Boolean,
      default: false
    },
    rows: {
      type: Number,
      default: 3
    },
    min: {
      type: Number,
      default: undefined
    },
    options: {
      type: Array,
      default: () => []
    }
  },
  emits: ['update:modelValue'],
  methods: {
    handleInput(event) {
      if (this.type === 'checkbox') {
        this.$emit('update:modelValue', event.target.checked)
      } else if (this.type === 'number') {
        const value = event.target.value === '' ? 0 : Number(event.target.value)
        this.$emit('update:modelValue', isNaN(value) ? 0 : value)
      } else {
        this.$emit('update:modelValue', event.target.value)
      }
    },
    handleChange(event) {
      if (this.type === 'checkbox') {
        this.$emit('update:modelValue', event.target.checked)
      } else if (this.type === 'number') {
        const value = event.target.value === '' ? 0 : Number(event.target.value)
        this.$emit('update:modelValue', isNaN(value) ? 0 : value)
      } else if (this.inputType === 'select') {
        this.$emit('update:modelValue', event.target.value)
      } else {
        this.$emit('update:modelValue', event.target.value)
      }
    }
  }
}
</script>

