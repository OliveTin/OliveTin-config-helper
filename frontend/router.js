import { createRouter, createWebHistory } from 'vue-router'
import HomeView from './components/HomeView.vue'
import ConfigNavigator from './components/ConfigNavigator.vue'
import CommonSettingsEditor from './components/CommonSettingsEditor.vue'
import ActionsEditorPage from './components/ActionsEditorPage.vue'
import ActionEditor from './components/ActionEditor.vue'
import AuthEditor from './components/AuthEditor.vue'
import TroubleshootingEditor from './components/TroubleshootingEditor.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomeView
  },
  {
    path: '/config-navigator',
    name: 'ConfigNavigator',
    component: ConfigNavigator
  },
  {
    path: '/settings',
    name: 'Settings',
    component: CommonSettingsEditor
  },
  {
    path: '/auth',
    name: 'Auth',
    component: AuthEditor
  },
  {
    path: '/troubleshooting',
    name: 'Troubleshooting',
    component: TroubleshootingEditor
  },
  {
    path: '/actions',
    name: 'Actions',
    component: ActionsEditorPage
  },
  {
    path: '/actions/new',
    name: 'NewAction',
    component: ActionEditor
  },
  {
    path: '/actions/edit/:index',
    name: 'EditAction',
    component: ActionEditor,
    props: true
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router

