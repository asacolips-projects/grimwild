<template>
  <div class="item-trackers flexrow">
    <!-- Tracker -->
    <template v-for="(tracker, trackerKey) in trackers" :key="trackerKey">
      <div class="tracker flexrow">
        <!-- Tracker label -->
        <button v-if="tracker.type === 'pool'"
          class="tracker-roll"
          data-action="rollPool"
          :data-item-id="itemId"
          :data-key="trackerKey"
        ><i class="fas fa-dice-d6"></i><strong v-if="tracker.label">{{ tracker.label }}</strong></button>
        <template v-else>
          <strong v-if="tracker.label">{{ tracker.label }}</strong>
        </template>
        <!-- Tracker value. -->
        <div class="tracker-value">
          <!-- Pools -->
          <div v-if="tracker.type === 'pool'" class="tracker-value-pool">
            <input type="number"
              data-action-change="updateItemTracker"
              :data-item-id="itemId"
              :data-tracker-key="trackerKey"
              :value="tracker.pool.diceNum"
              min="0"
              :max="tracker.pool.max > 0 ? tracker.pool.max : null"
            /><span class="pool-suffix">d</span>
          </div>
          <!-- Points -->
          <template v-if="tracker.type === 'points'">
            <!-- Checkbox points -->
            <div v-if="tracker.points.showSteps" class="tracker-steps flexrow">
              <template v-for="(num, i) in tracker.points.max" :key="i">
                <input type="checkbox"
                  data-action="updateItemTracker"
                  :data-item-id="itemId"
                  :data-tracker-key="trackerKey"
                  :data-tracker-step-key="i"
                  :data-value="num"
                  :data-tracker-value="tracker.points.value"
                  :checked="tracker.points.value >= num"
                />
              </template>
            </div>
            <!-- Numeric points -->
            <div v-else class="tracker-value-numeric">
              <input type="number"
                data-action-change="updateItemTracker"
                :data-item-id="itemId"
                :data-tracker-key="trackerKey"
                :value="tracker.points.value"
                min="0"
                :max="tracker.points.max"
              /> / {{ tracker.points.max }}
            </div>
          </template>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
// Trackers are passed as the array (not the owning item document) so that the
// fresh identity each document update produces forces this row to re-render.
defineProps(["itemId", "trackers"]);
</script>
