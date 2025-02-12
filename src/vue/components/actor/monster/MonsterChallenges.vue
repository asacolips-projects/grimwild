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
							data-type="challenge"
						>
							<i class="fas fa-plus"></i><span>Add</span>
						</a>
					</template>
				</div>
			</li>
			<!-- Challenge rows -->
			<li v-for="(item, id) in context.itemTypes.challenge" :key="id"
				:class="`item challenge flexcol ${context.activeItems?.[item._id] ? 'active' : ''}`"
				:data-item-id="item._id"
				data-drag="true"
				draggable="true"
				data-document-class="Item"
			>
				<!-- Summary, always visible -->
				<div class="item-summary flexrow">
					<div class="item-name flexrow">
						<a class="rollable" data-roll-type="item" data-action="roll">
							<div class="item-image">
								<img :src="item.img"
									:title="item.name"
									width="24"
									height="24"
								/>
							</div>
						</a>
						<div class="challenge-pool">
							<RollPoolInput
								button-action="roll"
								button-roll-type="item"
								input-action="updateChallengePool"
								:item-id="item.id"
								:pool="item.system.roll"
								min="0"
							/>
						</div>
						<div data-action="toggleItem" :data-item-id="item._id">{{ item.name }}</div>
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
					</div>
				</div>

			</li>
		</ol>
	</section>
</template>

<script setup>
import { RollPoolInput } from "@/components";
const props = defineProps(["actor", "context"]);
</script>