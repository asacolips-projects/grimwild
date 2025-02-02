<template>
	<section class="grid grid-3col">
		<ol class="items-list grid-span-3">
			<!-- Header row -->
			<li class="item flexrow items-header">
				<div class="item-name">{{ game.i18n.localize('Name') }}</div>
				<div class="item-controls">
					<template v-if="context.editable">
						<a class="item-control item-create"
							title="Create item"
							data-action="createDoc"
							data-document-class="Item"
							data-type="talent"
						>
							<i class="fas fa-plus"></i><span>Add</span>
						</a>
					</template>
				</div>
			</li>
			<!-- Talent rows -->
			<li v-for="(item, id) in context.itemTypes.talent" :key="id"
				:class="`item talent flexcol ${context.activeItems?.[item._id] ? 'active' : ''}`"
				:data-item-id="item._id"
				data-drag="true"
				draggable="true"
				data-document-class="Item"
			>
				<!-- Summary, always visible -->
				<div class="item-summary flexrow">
					<!-- Name and image -->
					<div class="item-name">
						<div class="item-image">
							<a class="rollable" data-roll-type="item" data-action="roll">
								<img :src="item.img"
									:title="item.name"
									width="24"
									height="24"
								/>
							</a>
						</div>
						<div data-action="toggleItem" :data-item-id="item._id">{{ item.name }}</div>
					</div>
					<!-- Resources -->
					<div class="item-resources flexrow">
						<!-- Resource -->
						<template v-for="(resource, resourceKey) in item.system.resources" :key="resourceKey">
							<div class="resource flexrow">
								<!-- Resource label -->
								<strong v-if="resource.label">{{ resource.label }}</strong>
								<!-- Resource value. -->
								<div class="resource-value">
									<!-- Pools -->
									<template v-if="resource.type === 'pool'">
										[{{ resource.pool.diceNum }}d]
									</template>
									<!-- Points -->
									<template v-if="resource.type === 'points'">
										<!-- Checkbox points -->
										<div v-if="resource.points.showSteps" class="resource-steps flexrow">
											<template v-for="(num, i) in resource.points.max" :key="i">
												<input type="checkbox" :checked="resource.points.value >= num" readonly />
											</template>
										</div>
										<!-- Numeric points -->
										<div v-else class="resource-value-numeric">{{ resource.points.value }} / {{ resource.points.max }}</div>
									</template>
								</div>
							</div>
						</template>
					</div>
					<div class="item-controls">
						<a class="item-control item-edit"
							:title="game.i18n.format('DOCUMENT.Edit', {type: 'talent'})"
							data-action="viewDoc"
						><i class="fas fa-edit"></i></a>
						<a class="item-control item-delete"
							v-if="context.editable"
							:title="game.i18n.format('DOCUMENT.Delete', {type: 'talent'})"
							data-action="deleteDoc"
						><i class="fas fa-trash"></i></a>
					</div>
				</div>
				<!-- Description, visible when toggled on. -->
				<div v-if="item.system.description" class="item-description-wrapper">
					<div class="item-description flexcol">
						<div class="item-description" v-html="context.editors[`items.${item.id}.system.description`].enriched"></div>
						<div v-if="item.system.notes.description" class="item-notes">
							<strong v-if="item.system.notes.label">{{ item.system.notes.label }}</strong>
							<div class="item-notes-description" v-html="context.editors[`items.${item.id}.system.notes.description`].enriched"></div>
						</div>
					</div>
				</div>
			</li>
		</ol>
	</section>
</template>

<script setup>
const props = defineProps(['actor', 'context']);
</script>