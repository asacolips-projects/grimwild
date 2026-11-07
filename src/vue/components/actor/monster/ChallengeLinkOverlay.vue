<template>
	<div ref="wrapEl" class="challenge-link-wrap" @pointerdown="onWrapPointerDown" @pointermove="onWrapPointerMove">
		<!-- Lines render BELOW the slotted cards (z-index 0 vs 1) so a route
		     that has to cross a card passes underneath it. -->
		<svg class="link-lines">
			<defs>
				<marker :id="`${uid}-arrow`" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="11" markerHeight="11" markerUnits="userSpaceOnUse" orient="auto-start-reverse">
					<path d="M0,0 L10,5 L0,10 z" class="link-arrow-fill"/>
				</marker>
				<marker :id="`${uid}-arrow-sel`" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="11" markerHeight="11" markerUnits="userSpaceOnUse" orient="auto-start-reverse">
					<path d="M0,0 L10,5 L0,10 z" class="link-arrow-fill-selected"/>
				</marker>
			</defs>
			<g v-for="edge in edges" :key="edge.key" class="edge" :class="[`style-${edge.style}`, { selected: edge.selected }]" @click.stop="openPopover(edge, $event)">
				<path class="hit" :d="edge.d"/>
				<path class="line" :d="edge.d" :marker-end="edge.markerEnd" :marker-start="edge.markerStart"/>
			</g>
		</svg>

		<slot></slot>

		<!-- Anchors + rubber band live ABOVE the cards and only exist in link mode. -->
		<svg v-if="linkMode" class="link-anchors">
			<path v-if="rubberD" class="rubber" :d="rubberD"/>
			<circle v-for="dot in dots" :key="dot.key"
				class="link-dot"
				:class="{ used: dot.used, pending: dot.isPending }"
				:cx="dot.x" :cy="dot.y" r="5"
				@click.stop="onAnchorClick(dot)"
			/>
		</svg>

		<div v-if="popoverLink" class="link-popover" :style="{ left: `${popover.x}px`, top: `${popover.y}px` }"
			@pointerdown.stop @input.stop @change.stop @keydown.enter.prevent
		>
			<div class="seg">
				<button v-for="s in STYLE_CHOICES" :key="s.value" type="button"
					:class="{ active: popoverLink.style === s.value }" :title="s.title"
					@click="editLink((link) => { link.style = s.value; })"
				>{{ s.glyph }}</button>
			</div>
			<div class="seg">
				<button v-for="a in ARROW_CHOICES" :key="a.value" type="button"
					:class="{ active: popoverLink.arrow === a.value }" :title="a.title"
					@click="editLink((link) => { link.arrow = a.value; })"
				>{{ a.glyph }}</button>
			</div>
			<button type="button" class="link-delete" :title="loc('LinkDelete')" @click="deleteLink"><i class="fas fa-trash"></i></button>
		</div>
	</div>
</template>

<script setup>
import { computed, inject, nextTick, onBeforeUnmount, onMounted, reactive, ref, toRaw, watch } from "vue";
import { ANCHORS, anchorPoint, autoAnchors, routeLink, squigglePath } from "./challenge-link-routing.mjs";

const props = defineProps(["context", "linkMode"]);
const emit = defineEmits(["exit"]);
const actor = inject("rawDocument");

const uid = Math.random().toString(36)
	.slice(2, 8);

const STYLE_CHOICES = [
	{ value: "solid", glyph: "──", title: "Solid" },
	{ value: "dashed", glyph: "╌ ╌", title: "Dashed" },
	{ value: "dotted", glyph: "· ·", title: "Dotted" },
	{ value: "squiggle", glyph: "⌇", title: "Squiggle" }
];
const ARROW_CHOICES = [
	{ value: "none", glyph: "—", title: "No Arrow" },
	{ value: "fwd", glyph: "→", title: "Forward" },
	{ value: "rev", glyph: "←", title: "Reverse" },
	{ value: "both", glyph: "↔", title: "Both" }
];

const loc = (key) => game.i18n.localize(`GRIMWILD.Actor.Monster.ChallengeMap.${key}`);

/* -------------------------------------------------------------- */
/* State                                                           */
/* -------------------------------------------------------------- */

// Raw Foundry documents — the reactive context wraps embedded items in
// proxies, and document methods called through such a proxy break Foundry's
// embedded-collection identity checks.
const challenges = computed(() => (props.context.itemTypes?.challenge ?? []).map((item) => toRaw(item)));

const rects = reactive({}); // itemId -> {x, y, w, h}, wrapper-relative
const pending = reactive({ itemId: null, anchor: null, cursor: { x: 0, y: 0 } });
const popover = reactive({ ownerId: null, linkIndex: -1, x: 0, y: 0 });

const wrapEl = ref(null);

let wrapObserver = null;
let cardObserver = null;
let writeQueue = Promise.resolve();
const observedCards = new WeakSet();

const popoverLink = computed(() => {
	if (!popover.ownerId) return null;
	return actor.items.get(popover.ownerId)?.system.links?.[popover.linkIndex] ?? null;
});

/**
 * Anchors already hosting a link endpoint, as "itemId:anchorId" keys. Only
 * explicit anchors reserve their spot; auto-assigned fallbacks do not.
 */
const usedAnchors = computed(() => {
	const used = new Set();
	for (const item of challenges.value) {
		for (const link of item.system.links ?? []) {
			if (link.fromAnchor) used.add(`${item.id}:${link.fromAnchor}`);
			// The target anchor lives on the target card, not the source.
			if (link.toAnchor) used.add(`${link.target}:${link.toAnchor}`);
		}
	}
	return used;
});

/**
 * All rendered links, routed against the live card rects.
 */
const edges = computed(() => {
	const result = [];
	const byId = new Map(challenges.value.map((item) => [item.id, item]));
	for (const item of challenges.value) {
		const links = item.system.links ?? [];
		for (const [linkIndex, link] of links.entries()) {
			const target = byId.get(link.target);
			if (!target) continue; // dangling link to a deleted challenge
			const rectA = rects[item.id];
			const rectB = rects[target.id];
			if (!rectA || !rectB) continue;
			const [idA, idB] = (link.fromAnchor && link.toAnchor)
				? [link.fromAnchor, link.toAnchor]
				: autoAnchors(rectA, rectB);
			const { d: routedD, points } = routeLink(rectA, idA, rectB, idB);
			const d = link.style === "squiggle" ? squigglePath(points) : routedD;
			const selected = (popover.ownerId === item.id) && (popover.linkIndex === linkIndex);
			result.push({
				key: `${item.id}:${linkIndex}`,
				ownerId: item.id,
				linkIndex,
				style: link.style,
				selected,
				d,
				markerEnd: ["fwd", "both"].includes(link.arrow) ? `url(#${uid}-arrow${selected ? "-sel" : ""})` : null,
				markerStart: ["rev", "both"].includes(link.arrow) ? `url(#${uid}-arrow${selected ? "-sel" : ""})` : null
			});
		}
	}
	return result;
});

/**
 * Anchor dots for link mode, one per anchor of every measured card.
 */
const dots = computed(() => {
	if (!props.linkMode) return [];
	const list = [];
	for (const item of challenges.value) {
		const rect = rects[item.id];
		if (!rect) continue;
		for (const id of Object.keys(ANCHORS)) {
			const point = anchorPoint(rect, id);
			list.push({
				key: `${item.id}:${id}`,
				itemId: item.id,
				anchor: id,
				x: point.x,
				y: point.y,
				used: usedAnchors.value.has(`${item.id}:${id}`),
				isPending: (pending.itemId === item.id) && (pending.anchor === id)
			});
		}
	}
	return list;
});

const rubberD = computed(() => {
	if (!pending.itemId) return "";
	const from = anchorPoint(rects[pending.itemId], pending.anchor);
	if (!from) return "";
	return `M ${from.x} ${from.y} L ${pending.cursor.x} ${pending.cursor.y}`;
});

/* -------------------------------------------------------------- */
/* Measurement                                                     */
/* -------------------------------------------------------------- */

/**
 * Re-scan the slotted cards and store wrapper-relative rects. Wrapper and
 * card rects are read in the same frame, so scrolling never skews them.
 */
function measure() {
	const wrap = wrapEl.value;
	if (!wrap) return;
	const wrapRect = wrap.getBoundingClientRect();
	for (const el of wrap.querySelectorAll(".challenge")) {
		if (!observedCards.has(el)) {
			cardObserver?.observe(el);
			observedCards.add(el);
		}
		const r = el.getBoundingClientRect();
		rects[el.dataset.itemId] = { x: r.x - wrapRect.x, y: r.y - wrapRect.y, w: r.width, h: r.height };
	}
}

/* -------------------------------------------------------------- */
/* Link creation                                                   */
/* -------------------------------------------------------------- */

/**
 * Handle an anchor dot click: start a pending link, cancel a pending one, or
 * complete the link when the second anchor lands on a different challenge.
 * @param {{itemId: string, anchor: string, used: boolean}} dot The clicked dot
 */
async function onAnchorClick(dot) {
	if (dot.used) return;
	if (!pending.itemId) {
		pending.itemId = dot.itemId;
		pending.anchor = dot.anchor;
		return;
	}
	if ((pending.itemId === dot.itemId) && (pending.anchor === dot.anchor)) {
		clearPending();
		return;
	}
	if (pending.itemId === dot.itemId) {
		ui.notifications.info(loc("LinkToSelf"));
		return;
	}
	const fromItem = challenges.value.find((item) => item.id === pending.itemId);
	const toItem = challenges.value.find((item) => item.id === dot.itemId);
	const fromAnchor = pending.anchor;
	const toAnchor = dot.anchor;
	clearPending();
	if (fromItem && toItem) await createLink(fromItem, fromAnchor, toItem, toAnchor);
}

/**
 * Create a link between two anchors, stored on the source item. One
 * connection per anchor; duplicate pairs in either direction are rejected.
 * @param {Item} fromItem    The source challenge
 * @param {string} fromAnchor Anchor id on the source card
 * @param {Item} toItem      The target challenge
 * @param {string} toAnchor   Anchor id on the target card
 * @returns {Promise<boolean>} Whether a new link was created
 */
async function createLink(fromItem, fromAnchor, toItem, toAnchor) {
	const used = usedAnchors.value;
	if (used.has(`${fromItem.id}:${fromAnchor}`) || used.has(`${toItem.id}:${toAnchor}`)) {
		ui.notifications.info(loc("AnchorInUse"));
		return false;
	}
	const links = foundry.utils.getProperty(fromItem.toObject(), "system.links");
	const pairExists = links.some((l) => l.target === toItem.id)
		|| foundry.utils.getProperty(toItem.toObject(), "system.links").some((l) => l.target === fromItem.id);
	if (pairExists) {
		ui.notifications.info(loc("LinkExists"));
		return false;
	}
	links.push({ target: toItem.id, fromAnchor, toAnchor, style: "solid", arrow: "none", label: "" });
	await fromItem.update({ "system.links": links });
	ui.notifications.info(loc("LinkCreated"));
	return true;
}

/**
 * Drop any pending anchor selection.
 */
function clearPending() {
	pending.itemId = null;
	pending.anchor = null;
	pending.cursor = { x: 0, y: 0 };
}

/* -------------------------------------------------------------- */
/* Link editing popover                                            */
/* -------------------------------------------------------------- */

/**
 * Open the link editor beside the clicked edge.
 * @param {{ownerId: string, linkIndex: number}} edge The clicked edge
 * @param {MouseEvent} event                          The click on the edge group
 */
function openPopover(edge, event) {
	if (!props.context.editable) return;
	const wrap = wrapEl.value?.getBoundingClientRect();
	const box = event.currentTarget.getBoundingClientRect();
	popover.ownerId = edge.ownerId;
	popover.linkIndex = edge.linkIndex;
	if (wrap) {
		popover.x = Math.max(8, Math.min((box.x - wrap.x) + (box.width / 2) - 170, wrap.width - 350));
		popover.y = Math.max(8, Math.min((box.y - wrap.y) + (box.height / 2) + 16, wrap.height - 60));
	}
}

/**
 * Dismiss the link editor.
 */
function closePopover() {
	popover.ownerId = null;
	popover.linkIndex = -1;
}

/**
 * Mutate the selected link on its owning item and persist the array. Writes
 * are serialized through a queue and each one re-reads the item at execution
 * time, so rapid edits (style clicks while a label write is pending) can't
 * clobber each other with stale array snapshots.
 * @param {Function} mutator Receives the plain link object and the links array
 * @returns {Promise<void>} Resolves once the update is written
 */
function editLink(mutator) {
	writeQueue = writeQueue.then(async () => {
		const item = actor.items.get(popover.ownerId);
		if (!item) return closePopover();
		const links = foundry.utils.getProperty(item.toObject(), "system.links");
		const link = links[popover.linkIndex];
		if (!link) return closePopover();
		mutator(link, links);
		await item.update({ "system.links": links });
	});
	return writeQueue;
}

/**
 * Remove the selected link from its owning item.
 * @returns {Promise<void>} Resolves once the update is written
 */
function deleteLink() {
	return editLink((link, links) => {
		const index = links.indexOf(link);
		if (index >= 0) links.splice(index, 1);
	}).then(() => closePopover());
}

/* -------------------------------------------------------------- */
/* Wrapper interaction                                             */
/* -------------------------------------------------------------- */

/**
 * Clicks anywhere except an anchor dot or the popover cancel a pending link
 * (and dismiss the popover unless it lives on an edge, which handles itself).
 * @param {PointerEvent} event The pointer press on the wrapper
 */
function onWrapPointerDown(event) {
	if (event.target.closest(".link-dot") || event.target.closest(".link-popover") || event.target.closest(".edge")) return;
	clearPending();
	closePopover();
}

/**
 * Track the cursor while an anchor is pending, for the rubber band.
 * @param {PointerEvent} event The pointer move on the wrapper
 */
function onWrapPointerMove(event) {
	if (!pending.itemId) return;
	const wrap = wrapEl.value?.getBoundingClientRect();
	if (!wrap) return;
	pending.cursor = { x: event.clientX - wrap.x, y: event.clientY - wrap.y };
}

/**
 * Escape is owned by link mode while it is active: cancel the pending
 * anchor, or exit link mode — without Foundry's global Escape handler also
 * closing the sheet window. Outside link mode, Esc just dismisses the
 * popover if one is open.
 * @param {KeyboardEvent} event The keydown event
 */
function onKeydown(event) {
	if (event.key !== "Escape") return;
	if (pending.itemId) {
		clearPending();
		event.stopPropagation();
		return;
	}
	if (props.linkMode) {
		closePopover();
		emit("exit");
		event.stopPropagation();
		return;
	}
	if (popover.ownerId) {
		closePopover();
		event.stopPropagation();
	}
}

/* -------------------------------------------------------------- */
/* Lifecycle                                                       */
/* -------------------------------------------------------------- */

watch(() => challenges.value.map((item) => item.id).join("|"), () => nextTick(measure));
watch(() => props.linkMode, (on) => {
	if (on) nextTick(measure);
	else clearPending();
});

onMounted(() => {
	wrapObserver = new ResizeObserver(measure);
	wrapObserver.observe(wrapEl.value);
	cardObserver = new ResizeObserver(measure);
	document.addEventListener("keydown", onKeydown);
	measure();
});

onBeforeUnmount(() => {
	wrapObserver?.disconnect();
	cardObserver?.disconnect();
	document.removeEventListener("keydown", onKeydown);
});
</script>
