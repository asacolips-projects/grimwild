<template>
	<li :class="`item talent ${itemType} flexcol ${context.activeItems?.[item.id] ? 'active' : ''} stroke stroke-bottom`"
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
				<!-- Slot size (GEAR + ARCANA ONLY) -->
				<span v-if="context.encumbranceEnabled && item.system.slotSize !== undefined" class="item-slots">{{ slotLabel(item.system.slotSize) }}</span>
			</div>
			<!-- Trackers -->
			<TrackersRow :item-id="item.id" :trackers="item.system.trackers"/>
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
import { slotLabel } from "@/format.mjs";
import { TrackersRow } from "@/components";

defineProps(["item", "context", "itemType"]);
</script>
