<template>
  <router-view />
</template>

<script setup>
import { useAuth } from "./composables/useAuth.js";
import { useTheme } from "./composables/useTheme.js";

// Initialize auth listener on app mount
useAuth();
// Initialize theme management
useTheme();
</script>
