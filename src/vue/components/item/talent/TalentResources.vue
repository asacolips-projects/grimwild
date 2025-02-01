<template>
	<fieldset class="resources">
		<legend>{{ context.systemFields.resources.label }}</legend>
		<!-- RESOUCE POOLS -->
		<div class="resource-type resource-pools form-group">
			<label class="resource-type-label">{{ game.i18n.localize('GRIMWILD.Resources.pools')}}</label>
			<a class="resource-control resource-create"
				title="Add pool"
				data-action="createResource"
				data-resource-type="pools"
			><i class="fas fa-plus"></i></a>
			<!-- Pool values -->
			<div class="resource-values form-group stacked">
				<div v-for="(pool, poolKey) in context.system.resources.pools" :key="poolKey" class="form-group pools-group">
					<!-- Label -->
					<div class="resource-label form-group stacked">
						<label>Label</label>
						<input type="text" :name="`system.resources.pools.${poolKey}.label`" v-model="pool.label"/>
					</div>
					<!-- Value -->
					<div class="resource-value form-group stacked">
						<label>Value</label>
						<input type="number" :name="`system.resources.pools.${poolKey}.value.diceNum`" v-model="pool.value.diceNum"/>
					</div>
					<!-- Delete control -->
					<a class="resource-control resource-delete"
						title="Delete pool"
						data-action="deleteResource"
						data-resource-type="pools"
						:data-key="poolKey"
					><i class="fas fa-trash"></i></a>
				</div>
			</div>
		</div>
		<!-- RESOURCE POINTS -->
		<div class="resource-type resource-points form-group">
			<label class="resource-type-label">{{ game.i18n.localize('GRIMWILD.Resources.points')}}</label>
			<a class="resource-control resource-create"
				title="Add points"
				data-action="createResource"
				data-resource-type="points"
			><i class="fas fa-plus"></i></a>
			<!-- Point values -->
			<div class="resource-values form-group stacked">
				<div v-for="(point, pointKey) in context.system.resources.points" :key="pointKey" class="form-group points-group">
					<!-- Label -->
					<div class="resource-label form-group stacked">
						<label>Label</label>
						<input type="text" :name="`system.resources.points.${pointKey}.label`" v-model="point.label"/>
					</div>
					<!-- Value -->
					<div class="resource-value form-group stacked">
						<label>Value</label>
						<input type="number" :name="`system.resources.points.${pointKey}.value`" v-model="point.value"/>
					</div>
					<!-- Max -->
					<div class="resource-value resource-max form-group stacked">
						<label>Max</label>
						<input type="number" :name="`system.resources.points.${pointKey}.max`" v-model="point.max"/>
					</div>
					<!-- Steps -->
					<div class="resource-steps form-group stacked">
						<label>Display</label>
						<select :name="`system.resources.points.${pointKey}.showSteps`" v-model="point.showSteps">
							<option value="false">Number</option>
							<option value="true">Checkboxes</option>
						</select>
					</div>
					<!-- Delete control -->
					<a class="resource-control resource-delete"
						title="Delete point"
						data-action="deleteResource"
						data-resource-type="points"
						:data-key="pointKey"
					><i class="fas fa-trash"></i></a>
				</div>
			</div>
		</div>
		<!-- RESOURCE TOGGLES -->
		<div class="resource-type resource-toggles form-group">
			<label class="resource-type-label">{{ game.i18n.localize('GRIMWILD.Resources.toggles')}}</label>
			<a class="resource-control resource-create"
				title="Add toggles"
				data-action="createResource"
				data-resource-type="toggles"
			><i class="fas fa-plus"></i></a>
			<!-- Pool values -->
			<div class="resource-values form-group stacked">
				<div v-for="(toggle, toggleKey) in context.system.resources.toggles" :key="toggleKey" class="form-group toggles-group">
					<!-- Label -->
					<div class="resource-label form-group stacked">
						<label>Label</label>
						<input type="text" :name="`system.resources.toggles.${toggleKey}.label`" v-model="toggle.label"/>
					</div>
					<!-- Value -->
					<div class="resource-value form-group stacked">
						<label>Active</label>
						<input type="checkbox" :name="`system.resources.toggles.${toggleKey}.value`" v-model="toggle.value" />
					</div>
					<!-- Delete control -->
					<a class="resource-control resource-delete"
						title="Delete toggle"
						data-action="deleteResource"
						data-resource-type="toggles"
						:data-key="toggleKey"
					><i class="fas fa-trash"></i></a>
				</div>
			</div>
		</div>
		<!-- RESOURCE TEXT -->
		<div class="resource-type resource-text form-group">
			<label class="resource-type-label">{{ game.i18n.localize('GRIMWILD.Resources.text')}}</label>
			<a class="resource-control resource-create"
				title="Add text"
				data-action="createResource"
				data-resource-type="text"
			><i class="fas fa-plus"></i></a>
			<!-- text values -->
			<div class="resource-values form-group stacked">
				<div v-for="(textEntry, textKey) in context.system.resources.text" :key="textKey" class="form-group texts-group">
					<!-- Label -->
					<div class="resource-label form-group stacked">
						<label>Label</label>
						<input type="text" :name="`system.resources.text.${textKey}.label`" v-model="textEntry.label"/>
					</div>
					<!-- Value -->
					<div class="resource-text form-group stacked">
						<label>Value</label>
						<input type="number" :name="`system.resources.text.${textKey}.value`" v-model="textEntry.value"/>
					</div>
					<!-- Delete control -->
					<a class="resource-control resource-delete"
						title="Delete text"
						data-action="deleteResource"
						data-resource-type="text"
						:data-key="textKey"
					><i class="fas fa-trash"></i></a>
				</div>
			</div>
		</div>
	</fieldset>
</template>

<script setup>
import { inject } from 'vue';
const props = defineProps(['context']);
const item = inject('rawDocument');
</script>