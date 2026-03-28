import { ref, watchEffect } from "vue";

// Global state for theme (initial load from localStorage or dark by default)
const isDark = ref(localStorage.getItem("qulox-theme") !== "light");

export function useTheme() {
  /**
   * Sync the '.dark' class on <html> and persist to localStorage
   */
  watchEffect(() => {
    if (isDark.value) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("qulox-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("qulox-theme", "light");
    }
  });

  const toggleTheme = () => {
    isDark.value = !isDark.value;
  };

  return {
    isDark,
    toggleTheme,
  };
}
