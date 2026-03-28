<script setup>
import { useTheme } from "../composables/useTheme";

const { isDark, toggleTheme } = useTheme();
</script>

<template>
  <button
    @click="toggleTheme"
    class="relative inline-flex items-center justify-center p-2 rounded-xl transition-all duration-300 group bg-gray-100 hover:bg-gray-200 text-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-400 dark:hover:text-white border border-gray-200 dark:border-gray-700/50 shadow-sm"
    aria-label="Toggle Theme"
  >
    <!-- Sun Icon (visible in Dark Mode) -->
    <svg
      v-if="isDark"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="w-5 h-5 transition-transform duration-500 rotate-0 group-hover:rotate-12"
    >
      <circle cx="12" cy="12" r="4" />
      <path
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"
      />
    </svg>

    <!-- Moon Icon (visible in Light Mode) -->
    <svg
      v-else
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="w-5 h-5 transition-transform duration-500 -rotate-12 group-hover:rotate-0"
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>

    <span class="sr-only">Switch to {{ isDark ? "Light" : "Dark" }} mode</span>
  </button>
</template>
