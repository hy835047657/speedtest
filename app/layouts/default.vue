<template>
  <div class="app-layout">
    <!-- Main Content Area -->
    <main class="main-content">
      <slot />
    </main>
    
    <!-- Footer removed -->
  </div>
</template>

<script setup lang="ts">
useHead({
  titleTemplate: '%s - Nuxt Hybrid Rendering Example',
  meta: [
    { name: 'description', content: 'Nuxt.js hybrid rendering example project showcasing SSG, ISR, and SSR rendering modes' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ]
})
</script>

<style scoped>
/* App Layout */
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Main Content Area */
.main-content {
  flex: 1;
  padding: 0;
}

/* Responsive Design */
@media (max-width: 768px) {
  .main-content {
    padding: 0;
  }
}
</style>
