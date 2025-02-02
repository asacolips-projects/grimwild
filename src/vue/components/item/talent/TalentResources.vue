<template>
	<fieldset class="resources">
		<legend>{{ context.systemFields.resources.label }}</legend>
		<div class="resource form-group stacked">
			<!-- Resources -->
			<div class="resource-values form-group stacked">
				<!-- Resource -->
				<div v-for="(resource, resourceKey) in context.system.resources" :key="resourceKey" class="form-group stacked resources-group">
					<!-- Type -->
					<div class="resource-type form-group stacked">
						<label>Type</label>
						<select :name="`system.resources.${resourceKey}.type`" v-model="resource.type">
							<option value="pool">Pool</option>
							<option value="points">Points</option>
						</select>
					</div>
					<!-- Options -->
					<div class="resource-options form-group">
						<!-- Label -->
						<div class="resource-label form-group stacked">
							<label>Label</label>
							<input type="text" :name="`system.resources.${resourceKey}.label`" v-model="resource.label"/>
						</div>
						<!-- Pool -->
						<div v-if="resource.type === 'pool'" class="resource-value form-group stacked">
							<label>Value</label>
							<input type="number" :name="`system.resources.${resourceKey}.pool.diceNum`" v-model="resource.pool.diceNum"/>
						</div>
						<!-- Value -->
						<div v-if="resource.type === 'points'" class="resource-value form-group stacked">
							<label>Value</label>
							<input type="number" :name="`system.resources.${resourceKey}.points.value`" v-model="resource.points.value"/>
						</div>
						<!-- Max -->
						<div v-if="resource.type === 'points'" class="resource-value resource-max form-group stacked">
							<label>Max</label>
							<input type="number" :name="`system.resources.${resourceKey}.points.max`" v-model="resource.points.max"/>
						</div>
						<!-- Steps -->
						<div v-if="resource.type === 'points'" class="resource-steps form-group stacked">
							<label>Display</label>
							<select :name="`system.resources.${resourceKey}.points.showSteps`" v-model="resource.points.showSteps">
								<option value="false">Number</option>
								<option value="true">Checkboxes</option>
							</select>
						</div>
						<!-- Delete control -->
						<a class="resource-control resource-delete"
							title="Delete pool"
							data-action="deleteResource"
							:data-key="resourceKey"
						><i class="fas fa-trash"></i></a>
					</div>
				</div>
			</div>
			<!-- Create resource button -->
			<button class="resource-control resource-create"
				type="button"
				title="Add pool"
				data-action="createResource"
			><i class="fas fa-plus"></i>Add resource</button>
		</div>
	</fieldset>
</template>

<script setup>
import { inject } from 'vue';
const props = defineProps(['context']);
const item = inject('rawDocument');
</script>