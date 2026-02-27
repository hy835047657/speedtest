import { defineNuxtPlugin } from '#app'
import cloudbase from '@cloudbase/js-sdk'

export default defineNuxtPlugin((nuxtApp) => {
  const app = cloudbase.init({
    env: 'ai-native-4g9hewa34cdcb7c1'
  })

  nuxtApp.provide('cloudbase', app)
})
