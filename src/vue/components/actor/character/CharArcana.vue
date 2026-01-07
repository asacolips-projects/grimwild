<template>
	<section class="grid grid-3col">
		<ol class="items-list grid-span-3">
			<!-- Header row -->
			<li class="flexrow items-header stroke stroke-bottom">
				<div class="item-name">Arcana Name</div>
				<div class="item-controls">
					<template v-if="context.editable">
						<button class="item-control item-create"
							title="Create item"
							data-action="createDoc"
							data-document-class="Item"
							data-type="arcana"
							type="button"
						>
							<i class="fas fa-plus"></i><span>Add</span>
						</button>
					</template>
					<button class="item-control item-compendium" type="button" data-action="openPack" data-pack="grimwild.arcana"><i class="fas fa-atlas"></i>Compendium</button>
				</div>
			</li>
			<!-- Arcana rows -->
			<li v-for="(item, id) in context.itemTypes.arcana" :key="id"
				:class="`item talent arcana flexcol ${context.activeItems?.[item._id] ? 'active' : ''} stroke stroke-bottom`"
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
					<!-- Trackers -->
					<div class="item-trackers flexrow">
						<!-- Tracker -->
						<template v-for="(tracker, trackerKey) in item.system.trackers" :key="trackerKey">
							<div class="tracker flexrow">
								<!-- Tracker label -->
								<button v-if="tracker.type === 'pool'"
									class="tracker-roll"
									data-action="rollPool"
									:data-item-id="item.id"
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
											:data-item-id="item.id"
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
													:data-item-id="item.id"
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
												:data-item-id="item.id"
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
					<div class="item-controls">
						<a class="item-control item-edit"
							:title="game.i18n.format('DOCUMENT.Edit', {type: 'arcana'})"
							data-action="viewDoc"
						><i class="fas fa-edit"></i></a>
						<a class="item-control item-delete"
							v-if="context.editable"
							:title="game.i18n.format('DOCUMENT.Delete', {type: 'arcana'})"
							data-action="deleteDoc"
						><i class="fas fa-trash"></i></a>
					</div>
				</div>
				<!-- Description, visible when toggled on. -->
				<div v-if="item.system.description" class="item-description-wrapper">
					<div class="item-description flexcol">
						<em>{{ getTier(item.system.tier) }}</em>
						<div class="item-touchstones" v-if="item.system.touchstones"><strong>Touchstones:</strong> <em>{{ item.system.touchstones }}</em></div>
						<div class="item-limitations" v-if="item.system.limitations">
							<strong>Limitations:</strong>
							<div class="item-limitations-description" v-html="context.editors[`items.${item.id}.system.limitations`].enriched"></div>
						</div>
						<hr/>
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

function getTier(tier) {
	switch (tier) {
		case 'minor':
			return 'Minor arcana';
		case 'major':
			return 'Major arcana';
		case 'mythic':
			return 'Mythic arcana';

		default:
			return 'Minor arcana';
	}
}
</script>