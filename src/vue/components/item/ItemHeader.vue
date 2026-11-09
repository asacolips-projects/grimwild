<template>
	<header class="sheet-header">
		<div class="header-fields grid grid-4col">
			<!-- Avatar -->
			<div class="grimwild-avatar">
				<img
					class="profile-img"
					:src="context.item.img"
					data-edit="img"
					data-action="onEditImage"
					:title="context.item.name"
					height="100"
					width="100"
				/>
			</div>
			<!-- Header right fields -->
			<div class="header-sub-fields grid-span-3">
				<!-- Name -->
				<div class="name form-group stacked">
					<label>{{ game.i18n.localize('Name') }}</label>
					<input type="text" name="name" v-model="context.item.name" :placeholder="game.i18n.localize('Name')"/>
				</div>
				<!-- Tier (ARCANA ONLY) -->
				<div v-if="context.item.type === 'arcana'" class="item-tier form-group">
					<span class="item-tier-badge">{{ context.system.tier }}</span>
				</div>
				<!-- Challenge Pool (CHALLENGES ONLY) -->
				<div v-if="context.item.type === 'challenge'" class="form-group">
					<!-- Pool -->
					<div class="form-group stacked">
						<label>{{ context.systemFields.pool.label }}</label>
						<RollPoolInput
							button-action="rollPool"
							field="pool"
							:pool="context.system.pool"
							min="0"
						/>
					</div>
					<!-- Suspense -->
					<div class="suspense form-group stacked">
						<label>{{ context.systemFields.suspense.label }}</label>
						<div class="form-inputs">
							<input type="checkbox"
								name="system.suspense.steps.0"
								v-model="context.system.suspense.steps[0]"
							/>
							<input type="checkbox"
								name="system.suspense.steps.1"
								v-model="context.system.suspense.steps[1]"
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	</header>
</template>

<script setup>
import { RollPoolInput } from "@/components";
const props = defineProps(["context"]);
</script>
