<template>
  <section class="auth-editor">
    <div class="editor-header">
      <h2>Auth Settings</h2>
      <router-link to="/config-navigator" class="back-button">← Back to Config Navigator</router-link>
    </div>
    
    <form @submit.prevent="saveSettings">
      <fieldset>
        <legend>Local Users Authentication</legend>
        
        <FormField
          id="authLocalEnabled"
          label="Enable Local Users"
          key-name="authLocalLocalUsers.enabled"
          description="Enable username/password authentication with local users"
          docs-url="https://docs.olivetin.app/auth-local-users.html"
          docs-title="Local Users Authentication"
          type="checkbox"
          v-model="localConfig.authLocalLocalUsers.enabled"
        />
        
        <template v-if="localConfig.authLocalLocalUsers.enabled">
          <FormField
            id="localUsername"
            label="Username"
            key-name="authLocalLocalUsers.username"
            description="Username for local authentication"
            docs-url="https://docs.olivetin.app/auth-local-users.html"
            docs-title="Local Users Authentication"
            type="text"
            placeholder="eg: admin"
            v-model="localConfig.authLocalLocalUsers.username"
          />
          
          <FormField
            id="localPassword"
            label="Password"
            key-name="authLocalLocalUsers.password"
            description="Password for local authentication"
            docs-url="https://docs.olivetin.app/auth-local-users.html"
            docs-title="Local Users Authentication"
            type="password"
            placeholder="Enter password"
            v-model="localConfig.authLocalLocalUsers.password"
          />
        </template>
      </fieldset>
      
      <fieldset>
        <legend>JWT Authentication</legend>
        
        <FormField
          id="authJwtEnabled"
          label="Enable JWT"
          key-name="authJwt.enabled"
          description="Enable JWT token-based authentication"
          docs-url="https://docs.olivetin.app/auth-jwt.html"
          docs-title="JWT Authentication"
          type="checkbox"
          v-model="localConfig.authJwt.enabled"
        />
        
        <template v-if="localConfig.authJwt.enabled">
          <FormField
            id="jwtSecret"
            label="JWT Secret"
            key-name="authJwt.secret"
            description="Secret key for validating JWT tokens"
            docs-url="https://docs.olivetin.app/auth-jwt.html"
            docs-title="JWT Authentication"
            type="text"
            placeholder="eg: your-jwt-secret"
            v-model="localConfig.authJwt.secret"
          />
          
          <FormField
            id="jwtIssuer"
            label="JWT Issuer"
            key-name="authJwt.issuer"
            description="Expected issuer of JWT tokens (optional)"
            docs-url="https://docs.olivetin.app/auth-jwt.html"
            docs-title="JWT Authentication"
            type="text"
            placeholder="eg: https://your-issuer.com"
            v-model="localConfig.authJwt.issuer"
          />
          
          <FormField
            id="jwtAudience"
            label="JWT Audience"
            key-name="authJwt.audience"
            description="Expected audience of JWT tokens (optional)"
            docs-url="https://docs.olivetin.app/auth-jwt.html"
            docs-title="JWT Authentication"
            type="text"
            placeholder="eg: your-audience"
            v-model="localConfig.authJwt.audience"
          />
        </template>
      </fieldset>
      
      <fieldset>
        <legend>HTTP Header Authentication</legend>
        
        <FormField
          id="authHttpHeaderEnabled"
          label="Enable HTTP Header"
          key-name="authHttpHeader.enabled"
          description="Trust authentication from HTTP headers (e.g., from reverse proxy)"
          docs-url="https://docs.olivetin.app/auth-http-header.html"
          docs-title="HTTP Header Authentication"
          type="checkbox"
          v-model="localConfig.authHttpHeader.enabled"
        />
        
        <template v-if="localConfig.authHttpHeader.enabled">
          <FormField
            id="httpHeaderName"
            label="Header Name"
            key-name="authHttpHeader.headerName"
            description="Name of the HTTP header containing the username (e.g., X-Forwarded-User)"
            docs-url="https://docs.olivetin.app/auth-http-header.html"
            docs-title="HTTP Header Authentication"
            type="text"
            placeholder="eg: X-Forwarded-User"
            v-model="localConfig.authHttpHeader.headerName"
          />
        </template>
      </fieldset>
      
      <fieldset>
        <legend>OAuth2 Authentication</legend>
        
        <FormField
          id="authOAuth2Enabled"
          label="Enable OAuth2"
          key-name="authOAuth2Providers.enabled"
          description="Enable OAuth2 provider authentication"
          docs-url="https://docs.olivetin.app/auth-oauth2.html"
          docs-title="OAuth2 Authentication"
          type="checkbox"
          v-model="localConfig.authOAuth2Providers.enabled"
        />
        
        <template v-if="localConfig.authOAuth2Providers.enabled">
          <FormField
            id="oauth2ClientId"
            label="Client ID"
            key-name="authOAuth2Providers.clientId"
            description="OAuth2 client ID"
            docs-url="https://docs.olivetin.app/auth-oauth2.html"
            docs-title="OAuth2 Authentication"
            type="text"
            placeholder="eg: your-client-id"
            v-model="localConfig.authOAuth2Providers.clientId"
          />
          
          <FormField
            id="oauth2ClientSecret"
            label="Client Secret"
            key-name="authOAuth2Providers.clientSecret"
            description="OAuth2 client secret"
            docs-url="https://docs.olivetin.app/auth-oauth2.html"
            docs-title="OAuth2 Authentication"
            type="password"
            placeholder="eg: your-client-secret"
            v-model="localConfig.authOAuth2Providers.clientSecret"
          />
          
          <FormField
            id="oauth2AuthUrl"
            label="Authorization URL"
            key-name="authOAuth2Providers.authUrl"
            description="OAuth2 authorization endpoint URL"
            docs-url="https://docs.olivetin.app/auth-oauth2.html"
            docs-title="OAuth2 Authentication"
            type="text"
            placeholder="eg: https://provider.com/oauth2/authorize"
            v-model="localConfig.authOAuth2Providers.authUrl"
          />
          
          <FormField
            id="oauth2TokenUrl"
            label="Token URL"
            key-name="authOAuth2Providers.tokenUrl"
            description="OAuth2 token endpoint URL"
            docs-url="https://docs.olivetin.app/auth-oauth2.html"
            docs-title="OAuth2 Authentication"
            type="text"
            placeholder="eg: https://provider.com/oauth2/token"
            v-model="localConfig.authOAuth2Providers.tokenUrl"
          />
          
          <FormField
            id="oauth2RedirectUrl"
            label="Redirect URL"
            key-name="authOAuth2Providers.redirectUrl"
            description="OAuth2 redirect/callback URL"
            docs-url="https://docs.olivetin.app/auth-oauth2.html"
            docs-title="OAuth2 Authentication"
            type="text"
            placeholder="eg: https://your-olivetin.com/auth/callback"
            v-model="localConfig.authOAuth2Providers.redirectUrl"
          />
        </template>
      </fieldset>
      
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
import FormField from './FormField.vue'

export default {
  name: 'AuthEditor',
  components: {
    FormField
  },
  setup() {
    const localConfig = ref({
      authLocalLocalUsers: {
        enabled: false,
        username: '',
        password: ''
      },
      authJwt: {
        enabled: false,
        secret: '',
        issuer: '',
        audience: ''
      },
      authHttpHeader: {
        enabled: false,
        headerName: ''
      },
      authOAuth2Providers: {
        enabled: false,
        clientId: '',
        clientSecret: '',
        authUrl: '',
        tokenUrl: '',
        redirectUrl: ''
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
                  if (data.config.authLocalLocalUsers) {
                    localConfig.value.authLocalLocalUsers = {
                      enabled: data.config.authLocalLocalUsers.enabled || false,
                      username: data.config.authLocalLocalUsers.username || '',
                      password: data.config.authLocalLocalUsers.password || ''
                    }
                  }
                  if (data.config.authJwt) {
                    localConfig.value.authJwt = {
                      enabled: data.config.authJwt.enabled || false,
                      secret: data.config.authJwt.secret || '',
                      issuer: data.config.authJwt.issuer || '',
                      audience: data.config.authJwt.audience || ''
                    }
                  }
                  if (data.config.authHttpHeader) {
                    localConfig.value.authHttpHeader = {
                      enabled: data.config.authHttpHeader.enabled || false,
                      headerName: data.config.authHttpHeader.headerName || ''
                    }
                  }
                  if (data.config.authOAuth2Providers) {
                    localConfig.value.authOAuth2Providers = {
                      enabled: data.config.authOAuth2Providers.enabled || false,
                      clientId: data.config.authOAuth2Providers.clientId || '',
                      clientSecret: data.config.authOAuth2Providers.clientSecret || '',
                      authUrl: data.config.authOAuth2Providers.authUrl || '',
                      tokenUrl: data.config.authOAuth2Providers.tokenUrl || '',
                      redirectUrl: data.config.authOAuth2Providers.redirectUrl || ''
                    }
                  }
                  return
                }
              } catch (err) {
                console.warn('Failed to load from YAML:', err)
              }
            }
            // Fallback: try to load from stored config object
            if (latestFile.config) {
              if (latestFile.config.authLocalLocalUsers) {
                localConfig.value.authLocalLocalUsers = {
                  enabled: latestFile.config.authLocalLocalUsers.enabled || false,
                  username: latestFile.config.authLocalLocalUsers.username || '',
                  password: latestFile.config.authLocalLocalUsers.password || ''
                }
              }
              if (latestFile.config.authJwt) {
                localConfig.value.authJwt = {
                  enabled: latestFile.config.authJwt.enabled || false,
                  secret: latestFile.config.authJwt.secret || '',
                  issuer: latestFile.config.authJwt.issuer || '',
                  audience: latestFile.config.authJwt.audience || ''
                }
              }
              if (latestFile.config.authHttpHeader) {
                localConfig.value.authHttpHeader = {
                  enabled: latestFile.config.authHttpHeader.enabled || false,
                  headerName: latestFile.config.authHttpHeader.headerName || ''
                }
              }
              if (latestFile.config.authOAuth2Providers) {
                localConfig.value.authOAuth2Providers = {
                  enabled: latestFile.config.authOAuth2Providers.enabled || false,
                  clientId: latestFile.config.authOAuth2Providers.clientId || '',
                  clientSecret: latestFile.config.authOAuth2Providers.clientSecret || '',
                  authUrl: latestFile.config.authOAuth2Providers.authUrl || '',
                  tokenUrl: latestFile.config.authOAuth2Providers.tokenUrl || '',
                  redirectUrl: latestFile.config.authOAuth2Providers.redirectUrl || ''
                }
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
              ...localConfig.value,
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
              ...localConfig.value,
              actions: [], 
              entities: [], 
              dashboards: [] 
            }
          } else {
            // Only save auth configs if they are enabled or have values
            if (localConfig.value.authLocalLocalUsers.enabled || localConfig.value.authLocalLocalUsers.username || localConfig.value.authLocalLocalUsers.password) {
              targetFile.config.authLocalLocalUsers = {
                enabled: localConfig.value.authLocalLocalUsers.enabled,
                username: localConfig.value.authLocalLocalUsers.username
              }
              if (localConfig.value.authLocalLocalUsers.password) {
                targetFile.config.authLocalLocalUsers.password = localConfig.value.authLocalLocalUsers.password
              }
            }
            
            if (localConfig.value.authJwt.enabled || localConfig.value.authJwt.secret) {
              targetFile.config.authJwt = {
                enabled: localConfig.value.authJwt.enabled,
                secret: localConfig.value.authJwt.secret
              }
              if (localConfig.value.authJwt.issuer) {
                targetFile.config.authJwt.issuer = localConfig.value.authJwt.issuer
              }
              if (localConfig.value.authJwt.audience) {
                targetFile.config.authJwt.audience = localConfig.value.authJwt.audience
              }
            }
            
            if (localConfig.value.authHttpHeader.enabled || localConfig.value.authHttpHeader.headerName) {
              targetFile.config.authHttpHeader = {
                enabled: localConfig.value.authHttpHeader.enabled,
                headerName: localConfig.value.authHttpHeader.headerName
              }
            }
            
            if (localConfig.value.authOAuth2Providers.enabled || localConfig.value.authOAuth2Providers.clientId) {
              targetFile.config.authOAuth2Providers = {
                enabled: localConfig.value.authOAuth2Providers.enabled,
                clientId: localConfig.value.authOAuth2Providers.clientId
              }
              if (localConfig.value.authOAuth2Providers.clientSecret) {
                targetFile.config.authOAuth2Providers.clientSecret = localConfig.value.authOAuth2Providers.clientSecret
              }
              if (localConfig.value.authOAuth2Providers.authUrl) {
                targetFile.config.authOAuth2Providers.authUrl = localConfig.value.authOAuth2Providers.authUrl
              }
              if (localConfig.value.authOAuth2Providers.tokenUrl) {
                targetFile.config.authOAuth2Providers.tokenUrl = localConfig.value.authOAuth2Providers.tokenUrl
              }
              if (localConfig.value.authOAuth2Providers.redirectUrl) {
                targetFile.config.authOAuth2Providers.redirectUrl = localConfig.value.authOAuth2Providers.redirectUrl
              }
            }
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
        authLocalLocalUsers: {
          enabled: false,
          username: '',
          password: ''
        },
        authJwt: {
          enabled: false,
          secret: '',
          issuer: '',
          audience: ''
        },
        authHttpHeader: {
          enabled: false,
          headerName: ''
        },
        authOAuth2Providers: {
          enabled: false,
          clientId: '',
          clientSecret: '',
          authUrl: '',
          tokenUrl: '',
          redirectUrl: ''
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
.auth-editor {
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
}
</style>

