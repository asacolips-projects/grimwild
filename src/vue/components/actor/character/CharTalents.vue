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
				class="item talent flexrow"
				:data-item-id="item._id"
				data-drag="true"
				draggable="true"
				data-document-class="Item"
			>
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
					<div>{{ item.name }}</div>
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
			</li>
		</ol>
	</section>
</template>

<script setup>
const props = defineProps(['actor', 'context']);
</script>