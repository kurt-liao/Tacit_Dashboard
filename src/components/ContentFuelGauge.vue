<script setup>
import { computed } from "vue";

const props = defineProps({
  sessions: {
    type: Array,
    default: () => [],
  },
});

// ── Aggregate page-level dwell times across sessions ─────────────
const fuelData = computed(() => {
  if (!props.sessions.length) return null;

  const pageAggregates = {};

  props.sessions.forEach((s) => {
    if (!s.pageStats) return;
    Object.entries(s.pageStats).forEach(([page, data]) => {
      const pg = Number(page);
      if (!pageAggregates[pg]) {
        pageAggregates[pg] = { totalDwellMs: 0, totalViews: 0 };
      }
      pageAggregates[pg].totalDwellMs += data.totalDwellMs || 0;
      pageAggregates[pg].totalViews += data.viewCount || 0;
    });
  });

  if (!Object.keys(pageAggregates).length) return null;

  const maxDwellMs = Math.max(
    ...Object.values(pageAggregates).map((p) => p.totalDwellMs),
  );

  const pageBreakdown = Object.entries(pageAggregates)
    .map(([page, data]) => ({
      page: Number(page),
      avgDwellSecs: Math.round(data.totalDwellMs / 1000),
      totalViews: data.totalViews,
      relativeScore: maxDwellMs > 0 ? data.totalDwellMs / maxDwellMs : 0,
    }))
    .sort((a, b) => b.avgDwellSecs - a.avgDwellSecs);

  const highEngagement = pageBreakdown.filter((p) => p.avgDwellSecs >= 10);
  const quickScans = pageBreakdown.filter(
    (p) => p.avgDwellSecs > 0 && p.avgDwellSecs < 5,
  );

  // Total content ROI score (0–100)
  const totalDwellSecs = pageBreakdown.reduce((s, p) => s + p.avgDwellSecs, 0);
  const roiScore = Math.min(Math.round((totalDwellSecs / 300) * 100), 100);

  return {
    pageBreakdown,
    highEngagement,
    quickScans,
    roiScore,
    totalDwellSecs,
  };
});

function formatDwell(secs) {
  if (secs < 60) return `${secs}s`;
  return `${Math.floor(secs / 60)}m ${secs % 60}s`;
}

function getLevelClass(relativeScore) {
  if (relativeScore >= 0.8) return "from-rose-500 to-orange-500";
  if (relativeScore >= 0.5) return "from-amber-500 to-yellow-500";
  if (relativeScore >= 0.25) return "from-brand-500 to-purple-500";
  return "from-gray-600 to-gray-700";
}

function getLevelLabel(relativeScore) {
  if (relativeScore >= 0.8) return "🔥";
  if (relativeScore >= 0.5) return "🟠";
  if (relativeScore >= 0.25) return "🟡";
  return "❄️";
}
</script>

<template>
  <div class="bg-gray-900/60 border border-gray-800/50 rounded-2xl p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-5">
      <div>
        <h3 class="text-sm font-semibold text-white">Content Fuel Gauge</h3>
        <p class="text-xs text-gray-500 mt-0.5">
          內容燃油表 · Page Engagement ROI
        </p>
      </div>
      <div v-if="fuelData" class="flex items-center gap-2">
        <div class="text-right">
          <p class="text-xs text-gray-500">ROI Score</p>
          <p class="text-sm font-bold text-white font-mono">
            {{ fuelData.roiScore }}/100
          </p>
        </div>
        <!-- Mini gauge -->
        <div class="relative w-10 h-10">
          <svg viewBox="0 0 36 36" class="w-10 h-10 -rotate-90">
            <circle
              cx="18"
              cy="18"
              r="15.9"
              fill="none"
              stroke="#1f2937"
              stroke-width="3"
            />
            <circle
              cx="18"
              cy="18"
              r="15.9"
              fill="none"
              :stroke="
                fuelData.roiScore >= 70
                  ? '#f97316'
                  : fuelData.roiScore >= 40
                    ? '#eab308'
                    : '#3b82f6'
              "
              stroke-width="3"
              stroke-linecap="round"
              :stroke-dasharray="`${fuelData.roiScore} ${100 - fuelData.roiScore}`"
              style="transition: all 1s ease"
            />
          </svg>
          <span
            class="absolute inset-0 flex items-center justify-center text-[9px] font-mono font-bold text-white"
            style="transform: none"
          >
            {{ fuelData.roiScore }}
          </span>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div
      v-if="!fuelData"
      class="flex flex-col items-center justify-center py-10 text-center"
    >
      <div
        class="w-10 h-10 rounded-xl bg-gray-800/50 border border-gray-700/50 flex items-center justify-center mb-3"
      >
        <svg
          class="w-5 h-5 text-gray-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="1.5"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75z"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625z"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
          />
        </svg>
      </div>
      <p class="text-sm text-gray-500">尚無閱讀數據</p>
    </div>

    <div v-else>
      <!-- High Engagement Summary -->
      <div class="grid grid-cols-2 gap-3 mb-5">
        <div class="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-base">🔥</span>
            <span class="text-xs font-semibold text-rose-400">高參與頁面</span>
          </div>
          <p class="text-xl font-bold text-white font-mono">
            {{ fuelData.highEngagement.length }}
          </p>
          <p class="text-[10px] text-gray-500">停留 ≥ 10s</p>
        </div>
        <div class="bg-gray-800/40 border border-gray-700/30 rounded-xl p-3">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-base">⚡</span>
            <span class="text-xs font-semibold text-gray-400">快速掃描</span>
          </div>
          <p class="text-xl font-bold text-white font-mono">
            {{ fuelData.quickScans.length }}
          </p>
          <p class="text-[10px] text-gray-500">停留 &lt; 5s</p>
        </div>
      </div>

      <!-- Page-by-Page Fuel Bars -->
      <div>
        <p
          class="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wider"
        >
          頁面燃油分佈
        </p>
        <div class="space-y-2 max-h-52 overflow-y-auto pr-1 scrollbar-thin">
          <div
            v-for="page in fuelData.pageBreakdown"
            :key="page.page"
            class="flex items-center gap-3 group"
          >
            <div class="flex items-center gap-1.5 w-14 shrink-0">
              <span class="text-xs">{{
                getLevelLabel(page.relativeScore)
              }}</span>
              <span class="text-xs font-mono text-gray-400"
                >P{{ page.page }}</span
              >
            </div>
            <div
              class="flex-1 bg-gray-800/60 rounded-full h-2.5 overflow-hidden"
            >
              <div
                class="h-full rounded-full bg-gradient-to-r transition-all duration-700"
                :class="getLevelClass(page.relativeScore)"
                :style="`width: ${page.relativeScore * 100}%`"
              ></div>
            </div>
            <div class="w-16 text-right shrink-0">
              <span class="text-xs font-mono text-gray-400">{{
                formatDwell(page.avgDwellSecs)
              }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Insight -->
      <div
        v-if="fuelData.highEngagement.length"
        class="mt-4 bg-brand-500/5 border border-brand-500/20 rounded-xl px-3 py-2"
      >
        <p class="text-xs text-brand-400">
          💡 <strong>AI 洞察：</strong> 客戶最感興趣的是第
          {{ fuelData.highEngagement[0].page }} 頁 （停留
          {{ formatDwell(fuelData.highEngagement[0].avgDwellSecs) }}）。
          建議以此頁內容作為跟進切入點。
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scrollbar-thin {
  scrollbar-width: thin;
  scrollbar-color: rgba(75, 85, 99, 0.3) transparent;
}
.scrollbar-thin::-webkit-scrollbar {
  width: 4px;
}
.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  background: rgba(75, 85, 99, 0.3);
  border-radius: 9999px;
}
</style>
