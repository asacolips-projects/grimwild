<template>
	<li :class="`item talent ${itemType === 'arcana' ? 'arcana ' : ''}flexcol ${context.activeItems?.[item.id] ? 'active' : ''} stroke stroke-bottom`"
		:data-item-id="item.id"
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
				<div data-action="toggleItem" :data-item-id="item.id">{{ item.name }}</div>
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
					:title="game.i18n.localize('DOCUMENT.Edit', {type: itemType})"
					data-action="viewDoc"
				><i class="fas fa-edit"></i></a>
				<a class="item-control item-delete"
					v-if="context.editable"
					:title="game.i18n.localize('DOCUMENT.Delete', {type: itemType})"
					data-action="deleteDoc"
				><i class="fas fa-trash"></i></a>
			</div>
		</div>
		<!-- Description, visible when toggled on. -->
		<div v-if="item.system.description" class="item-description-wrapper">
			<div class="item-description flexcol">
				<slot name="description"></slot>
			</div>
		</div>
	</li>
</template>

<script setup>
defineProps(["item", "context", "itemType"]);
</script>
