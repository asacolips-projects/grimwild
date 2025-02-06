<template>
	<fieldset class="trackers">
		<legend>{{ context.systemFields.trackers.label }}</legend>
		<div class="tracker form-group stacked">
			<!-- Trackers -->
			<div class="tracker-values form-group stacked">
				<!-- Tracker -->
				<div v-for="(tracker, trackerKey) in context.system.trackers" :key="trackerKey" class="form-group stacked trackers-group">
					<!-- Type -->
					<div class="tracker-type form-group stacked">
						<label>Type</label>
						<select :name="`system.trackers.${trackerKey}.type`" v-model="tracker.type">
							<option value="pool">Pool</option>
							<option value="points">Points</option>
						</select>
					</div>
					<!-- Options -->
					<div class="tracker-options form-group">
						<!-- Label -->
						<div class="tracker-label form-group stacked">
							<label>Label</label>
							<input type="text" :name="`system.trackers.${trackerKey}.label`" v-model="tracker.label"/>
						</div>
						<!-- Pool -->
						<div v-if="tracker.type === 'pool'" class="tracker-value form-group stacked">
							<label>Value</label>
							<input type="number" :name="`system.trackers.${trackerKey}.pool.diceNum`" v-model="tracker.pool.diceNum"/>
						</div>
						<!-- Value -->
						<div v-if="tracker.type === 'points'" class="tracker-value form-group stacked">
							<label>Value</label>
							<input type="number"
								:name="`system.trackers.${trackerKey}.points.value`"
								min="0"
								:max="tracker.points.max"
								v-model="tracker.points.value"/>
						</div>
						<!-- Max -->
						<div v-if="tracker.type === 'points'" class="tracker-value tracker-max form-group stacked">
							<label>Max</label>
							<input type="number"
								:name="`system.trackers.${trackerKey}.points.max`"
								min="1"
								v-model="tracker.points.max"/>
						</div>
						<!-- Steps -->
						<div v-if="tracker.type === 'points'" class="tracker-steps form-group stacked">
							<label>Display</label>
							<select :name="`system.trackers.${trackerKey}.points.showSteps`" v-model="tracker.points.showSteps">
								<option value="false">Number</option>
								<option value="true">Checkboxes</option>
							</select>
						</div>
						<!-- Delete control -->
						<a class="tracker-control tracker-delete"
							title="Delete pool"
							data-action="deleteTracker"
							:data-key="trackerKey"
						><i class="fas fa-trash"></i></a>
					</div>
				</div>
			</div>
			<!-- Create tracker button -->
			<button class="tracker-control tracker-create"
				type="button"
				title="Add pool"
				data-action="createTracker"
			><i class="fas fa-plus"></i>Add tracker</button>
		</div>
	</fieldset>
</template>

<script setup>
import { inject } from 'vue';
const props = defineProps(['context']);
const item = inject('rawDocument');
</script>