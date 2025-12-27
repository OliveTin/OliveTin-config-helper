<template>
  <div class="config-navigator">
    <div class="config-navigator-header">
      <h2>Config Navigator</h2>
      <p>Manage your OliveTin configuration</p>
    </div>
    
    <div class="navigation-grid">
      <router-link to="/settings" class="nav-card">
        <div class="nav-card-icon">⚙️</div>
        <h3>Common Settings</h3>
        <p>Configure listen address, log level, and other general settings</p>
      </router-link>

      <router-link to="/actions" class="nav-card">
        <div class="nav-card-icon">🎯</div>
        <h3>Actions Editor</h3>
        <p>Create and manage actions for your OliveTin configuration</p>
      </router-link>
      
      <router-link to="/auth" class="nav-card">
        <div class="nav-card-icon">🔐</div>
        <h3>Auth Editor</h3>
        <p>Configure authentication settings, username, and password</p>
      </router-link>
      
      <router-link to="/troubleshooting" class="nav-card">
        <div class="nav-card-icon">🔧</div>
        <h3>Troubleshooting Editor</h3>
        <p>Manage insecure options for debugging and troubleshooting</p>
      </router-link>
      
    </div>
    
    <div class="back-link">
      <router-link to="/" class="back-button">← Back to Home</router-link>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ConfigNavigator'
}
</script>

<style scoped>
.config-navigator {
  max-width: 1200px;
  margin: 0 auto;
}

.config-navigator-header {
  text-align: center;
  margin-bottom: 3em;
}

.navigation-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2em;
  margin-bottom: 2em;
}

.nav-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3em 2em;
  text-decoration: none;
  color: inherit;
  transition: transform 0.3s ease;
  background-color: #fff;
  border-radius: 0.4em;
  border: 1px solid var(--border-color);
  box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.2);
    background-color: var(--standout-bg-color);
    color: var(--text-color);
    border-color: blue;
  }
}

.nav-card:hover {
  transform: translateY(-4px);
}

.nav-card-icon {
  font-size: 4em;
  margin-bottom: 1em;
}

.back-link {
  text-align: center;
  margin-top: 2em;
}
</style>

