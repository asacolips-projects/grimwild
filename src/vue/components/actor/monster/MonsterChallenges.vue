<template>
	<section class="items challenges flexcol">
		<!-- Header row -->
		<div class="flexrow items-header">
			<div class="item-name">Challenges</div>
			<div class="item-controls">
				<template v-if="context.editable">
					<button class="item-control link-toggle"
						:class="{ active: linkMode }"
						type="button"
						:title="loc('LinkModeTitle')"
						@click="linkMode = !linkMode"
					>
						<i class="fas fa-link"></i><span>{{ loc('LinkMode') }}</span>
					</button>
					<button class="item-control item-create"
						title="Create item"
						data-action="createDoc"
						data-document-class="Item"
						data-type="challenge"
						type="button"
					>
						<i class="fas fa-plus"></i><span>Add</span>
					</button>
				</template>
			</div>
		</div>

		<!-- Columns view with anchor-based linking -->
		<ChallengeLinkOverlay :context="context" :link-mode="linkMode" @exit="linkMode = false">
			<ol class="items-list grid-span-3">
				<!-- Challenge rows -->
				<li v-for="item in context.itemTypes.challenge" :key="item.id"
					:class="`item challenge flexcol ${context.activeItems?.[item.id] ? 'active' : ''}`"
					:data-item-id="item.id"
					:data-drag="linkMode ? null : true"
					:draggable="linkMode ? null : true"
					data-document-class="Item"
				>
					<!-- Summary, always visible -->
					<div class="item-summary flexcol">
						<div class="item-name flexrow">
							<!-- Pool -->
							<div class="challenge-pool">
								<RollPoolInput
									button-action="roll"
									button-roll-type="item"
									input-action="updateChallengePool"
									:item-id="item.id"
									:pool="item.system.pool"
									:no-input="true"
									min="0"
								/>
							</div>
							<!-- Name -->
							<div class="challenge-name">{{ item.name }}</div>
						</div>
						<div class="suspense-controls flexrow">
							<!-- Suspense -->
							<div class="suspense form-group stacked">
								<div class="form-inputs">
									<input type="checkbox"
										data-action-change="updateItemField"
										data-field="system.suspense.steps"
										data-key="0"
										:data-item-id="item.id"
										:checked="item.system.suspense.steps[0]"
									/>
									<input type="checkbox"
										data-action-change="updateItemField"
										data-field="system.suspense.steps"
										data-key="1"
										:data-item-id="item.id"
										:checked="item.system.suspense.steps[1]"
									/>
								</div>
							</div>
							<div class="item-controls">
								<a class="item-control item-edit"
									:title="game.i18n.localize('DOCUMENT.Edit', {type: 'talent'})"
									data-action="viewDoc"
								><i class="fas fa-edit"></i></a>
								<a class="item-control item-delete"
									v-if="context.editable"
									:title="game.i18n.localize('DOCUMENT.Delete', {type: 'talent'})"
									data-action="deleteDoc"
								><i class="fas fa-trash"></i></a>
							</div>
						</div>
					</div>

					<!-- Description, visible when toggled on. -->
					<div class="challenge-fields-wrapper">
						<div class="item-description flexcol">
							<div v-if="item.system.description.length" class="item-description-content" v-html="context.editors[`items.${item.id}.system.description`].enriched"></div>
							<!-- Traits -->
							<ul v-if="item.system.traits.length > 0" class="item-traits">
								<li v-for="(trait, traitKey) in item.system.traits" :key="traitKey" class="item-trait">{{ trait }}</li>
							</ul>
							<!-- Moves -->
							<template v-if="item.system.moves.length > 0">
								<hr/>
								<ul class="item-moves">
									<li v-for="(move, moveKey) in item.system.moves" :key="moveKey" class="item-move">{{ move }}</li>
								</ul>
							</template>
							<!-- Failure states -->
							<template v-if="item.system.failure.length > 0">
								<hr/>
								<ul class="item-failure">
									<li v-for="(fail, failKey) in item.system.failure" :key="failKey" class="item-fail form-group">
										<RollPoolInput v-if="fail.pool.diceNum > 0"
											button-action="rollPool"
											button-roll-type="item"
											field="failure"
											:field-key="failKey"
											:no-input="true"
											:item-id="item.id"
											:pool="fail.pool"
											min="0"
										/>
										<span>{{ fail.value }}</span>
									</li>
								</ul>
							</template>
						</div>
					</div>

				</li>
			</ol>
		</ChallengeLinkOverlay>
	</section>
</template>

<script setup>
import { computed, ref, toRaw, watch } from "vue";
import { ChallengeLinkOverlay, RollPoolInput } from "@/components";

const props = defineProps(["actor", "context"]);

const linkMode = ref(false);

const loc = (key) => game.i18n.localize(`GRIMWILD.Actor.Monster.ChallengeMap.${key}`);

/**
 * The actor's challenge items as raw Foundry documents (see the overlay:
 * reactive proxies break document method calls).
 */
const challenges = computed(() => (props.context.itemTypes?.challenge ?? []).map((item) => toRaw(item)));

/**
 * Challenge links are anchored to a specific layout, so an explicit user
 * rearrangement invalidates them. A change in the item id sequence with an
 * unchanged set is a reorder: wipe every link with a notice. A changed set is
 * an add/delete: only prune links that point at removed challenges.
 */
watch(() => challenges.value.map((item) => item.id).join("|"), async (sequence, previous) => {
	if (!previous || !props.context.editable) return;
	const idsNow = sequence.split("|");
	const idsBefore = previous.split("|");
	const sameSet = (idsNow.length === idsBefore.length) && idsBefore.every((id) => idsNow.includes(id));
	if (sameSet) {
		if (sequence !== previous) await wipeLinks();
	}
	else await pruneLinks(idsNow);
});

/**
 * Clear every challenge's links.
 * @returns {Promise<void>} Resolves once all updates are written
 */
async function wipeLinks() {
	let cleared = false;
	for (const item of challenges.value) {
		if ((item.system.links?.length ?? 0) > 0) {
			await item.update({ "system.links": [] });
			cleared = true;
		}
	}
	if (cleared) ui.notifications.warn(loc("LinksCleared"));
}

/**
 * Remove links that point at challenges which no longer exist.
 * @param {string[]} validIds Ids of the current challenges
 * @returns {Promise<void>} Resolves once all updates are written
 */
async function pruneLinks(validIds) {
	const ids = new Set(validIds);
	for (const item of challenges.value) {
		const links = item.system.links ?? [];
		const kept = links.filter((link) => ids.has(link.target));
		if (kept.length !== links.length) await item.update({ "system.links": kept });
	}
}
</script>
