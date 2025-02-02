<template>
	<section class="grid grid-3col">
		<ol class="items-list grid-span-3">
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
							<i class="fas fa-plus"></i>{{ game.i18n.format(`DOCUMENT.New`, {type: 'talent'}) }}
						</a>
					</template>
				</div>
			</li>
			<li v-for="(item, id) in context.itemTypes.talent" :key="id"
				:class="`item talent flexcol ${context.activeItems?.[item._id] ? 'active' : ''}`"
				:data-item-id="item._id"
				data-drag="true"
				draggable="true"
				data-document-class="Item"
			>
				<div class="item-summary flexrow">
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
					<div class="item-resources">
						<template v-for="(resources, resourceType) in item.system.resources" :key="resourceType">
							<template v-if="resources.length > 0">
								<div class="item-resource flexrow">
									<div v-for="(resource, resourceKey) in resources" :key="resource" class="resource flexrow">
										<strong v-if="resource.label">{{ resource.label }}</strong>
										<div class="resource-value">
											<template v-if="resourceType === 'pools'">
												[{{ resource.value.diceNum }}d]
											</template>
											<template v-if="resourceType === 'points'">
												<div v-if="resource.showSteps" class="resource-steps flexrow">
													<template v-for="(num, i) in resource.max" :key="i">
														<input type="checkbox" :checked="resource.value >= num" readonly />
													</template>
												</div>
												<div v-else class="resource-value">{{ resource.value }} / {{ resource.max }}</div>
											</template>
											<template v-if="resourceType === 'toggles'">
												<input type="checkbox" :checked="resource.value" readonly />
											</template>
										</div>
									</div>
								</div>
							</template>
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
				<div v-if="item.system.description" class="item-description-wrapper">
					<div class="item-description flexcol">
						<div class="item-description" v-html="item.system.description"></div>
						<div v-if="item.system.notes.description" class="item-notes">
							<strong v-if="item.system.notes.label">{{ item.system.notes.label }}</strong>
							<div class="item-notes-description" v-html="item.system.notes.description"></div>
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