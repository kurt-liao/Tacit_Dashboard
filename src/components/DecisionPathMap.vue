<script setup>
import { computed } from "vue";

const props = defineProps({
  sessions: {
    type: Array,
    default: () => [],
  },
});

// ── Aggregate path sequences across all sessions ─────────────────
const pathData = computed(() => {
  if (!props.sessions.length) return null;

  // Use the most recent session with pathSequence data
  const sessionsWithPath = props.sessions
    .filter((s) => s.pathSequence && s.pathSequence.length > 0)
    .sort((a, b) => {
      const aTime = a.createdAt?.toDate
        ? a.createdAt.toDate()
        : new Date(a.endedAt || 0);
      const bTime = b.createdAt?.toDate
        ? b.createdAt.toDate()
        : new Date(b.endedAt || 0);
      return bTime - aTime;
    });

  if (!sessionsWithPath.length) return null;

  const latestSequence = sessionsWithPath[0].pathSequence;

  // Analyze hesitation points (page appear >= 2x in 6-move window)
  const hesitationPoints = new Set();
  const loops = [];

  for (let i = 0; i < latestSequence.length - 3; i++) {
    const window = latestSequence.slice(i, i + 6);
    const seen = {};
    window.forEach((p) => {
      seen[p] = (seen[p] || 0) + 1;
    });
    Object.entries(seen).forEach(([page, count]) => {
      if (count >= 2) hesitationPoints.add(Number(page));
    });
  }

  // Find A↔B loops
  for (let i = 0; i < latestSequence.length - 2; i++) {
    if (
      latestSequence[i] === latestSequence[i + 2] &&
      latestSequence[i] !== latestSequence[i + 1]
    ) {
      const loop = `P${latestSequence[i]}↔P${latestSequence[i + 1]}`;
      if (!loops.includes(loop)) loops.push(loop);
    }
  }

  // Page visit frequency
  const pageFreq = {};
  latestSequence.forEach((p) => {
    pageFreq[p] = (pageFreq[p] || 0) + 1;
  });

  // Compact display: collapse consecutive duplicates
  const compactPath = [];
  latestSequence.forEach((p, i) => {
    if (
      compactPath.length === 0 ||
      compactPath[compactPath.length - 1].page !== p
    ) {
      compactPath.push({ page: p, count: 1 });
    } else {
      compactPath[compactPath.length - 1].count++;
    }
  });

  return {
    sequence: latestSequence,
    compactPath,
    hesitationPoints: Array.from(hesitationPoints),
    loops,
    pageFreq,
    totalMoves: latestSequence.length,
  };
});
</script>

<template>
  <div
    class="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800/50 rounded-2xl p-6 transition-colors duration-300 shadow-sm dark:shadow-none"
  >
    <!-- Header -->
    <div class="flex items-center justify-between mb-5">
      <div>
        <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
          Decision Path Map
        </h3>
        <p class="text-xs text-gray-500 mt-0.5">決策導航圖 · Page Journey</p>
      </div>
      <span
        v-if="pathData?.loops.length"
        class="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20"
      >
        ⚠️ 決策猶豫點偵測
      </span>
    </div>

    <!-- Empty state -->
    <div
      v-if="!pathData"
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
            d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z"
          />
        </svg>
      </div>
      <p class="text-sm text-gray-500">尚無路徑數據</p>
      <p class="text-xs text-gray-600 mt-1">客戶開始閱讀後即可分析</p>
    </div>

    <div v-else>
      <!-- Path Visualization (scrollable node chain) -->
      <div class="mb-5">
        <p
          class="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wider"
        >
          瀏覽軌跡
        </p>
        <div
          class="flex items-center gap-0 overflow-x-auto pb-2 scrollbar-hide"
        >
          <template v-for="(step, idx) in pathData.compactPath" :key="idx">
            <!-- Arrow connector -->
            <div v-if="idx > 0" class="shrink-0 px-0.5">
              <svg
                class="w-4 h-4 text-gray-300 dark:text-gray-700"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  d="M9 5l7 7-7 7"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
            <!-- Page node -->
            <div class="shrink-0 flex flex-col items-center gap-1">
              <div
                class="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all"
                :class="
                  pathData.hesitationPoints.includes(step.page)
                    ? 'bg-amber-500/20 border border-amber-500/40 text-amber-600 dark:text-amber-300'
                    : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                "
              >
                P{{ step.page }}
              </div>
              <!-- Repeat count badge -->
              <span
                v-if="step.count > 1"
                class="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-1.5 rounded-full border border-amber-500/20"
              >
                ×{{ step.count }}
              </span>
            </div>
          </template>
        </div>
      </div>

      <!-- Hesitation Loops -->
      <div v-if="pathData.loops.length" class="mb-5">
        <p
          class="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider"
        >
          ⚠️ 決策猶豫環
        </p>
        <div class="flex flex-wrap gap-2">
          <div
            v-for="loop in pathData.loops"
            :key="loop"
            class="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-xl"
          >
            <div
              class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"
            ></div>
            <span class="text-xs font-mono font-semibold text-amber-300">{{
              loop
            }}</span>
            <span class="text-xs text-amber-500">反覆跳轉</span>
          </div>
        </div>
      </div>

      <!-- Page Frequency Heatmap -->
      <div>
        <p
          class="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider"
        >
          頁面熱度
        </p>
        <div class="space-y-1.5">
          <div
            v-for="[page, freq] in Object.entries(pathData.pageFreq)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)"
            :key="page"
            class="flex items-center gap-3"
          >
            <span class="text-xs font-mono text-gray-500 w-6 shrink-0"
              >P{{ page }}</span
            >
            <div
              class="flex-1 bg-gray-100 dark:bg-gray-800/60 rounded-full h-2 overflow-hidden"
            >
              <div
                class="h-full rounded-full transition-all duration-700"
                :class="
                  pathData.hesitationPoints.includes(Number(page))
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                    : 'bg-gradient-to-r from-brand-500 to-purple-500'
                "
                :style="`width: ${(freq / Math.max(...Object.values(pathData.pageFreq))) * 100}%`"
              ></div>
            </div>
            <span
              class="text-xs font-mono text-gray-400 w-4 text-right shrink-0"
              >{{ freq }}x</span
            >
          </div>
        </div>
      </div>

      <!-- Summary stats -->
      <div
        class="mt-4 grid grid-cols-3 gap-2 pt-4 border-t border-gray-100 dark:border-gray-800/50"
      >
        <div class="text-center">
          <p
            class="text-base font-bold text-gray-900 dark:text-white font-mono"
          >
            {{ pathData.totalMoves }}
          </p>
          <p class="text-[10px] text-gray-500">總頁面跳轉</p>
        </div>
        <div class="text-center">
          <p class="text-base font-bold text-amber-400 font-mono">
            {{ pathData.hesitationPoints.length }}
          </p>
          <p class="text-[10px] text-gray-500">猶豫頁面</p>
        </div>
        <div class="text-center">
          <p class="text-base font-bold text-rose-400 font-mono">
            {{ pathData.loops.length }}
          </p>
          <p class="text-[10px] text-gray-500">決策環</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
