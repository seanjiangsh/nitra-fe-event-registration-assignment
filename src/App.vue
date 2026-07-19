<script setup>
// The whole app uses Inter (Figma). Quasar ships Roboto by default; loading the
// Inter *variable* font here supports the design's non-standard weights (485 /
// 570 / 610 / 630). The global override below wins over Quasar's `body` rule by
// ID specificity (the proper config spots — quasar.config / src/css — are the
// provided files we leave untouched).
import '@fontsource-variable/inter'
</script>

<template>
  <router-view />
</template>

<style>
#q-app {
  font-family: 'Inter Variable', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
</style>
