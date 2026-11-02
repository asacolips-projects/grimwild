<template>
	<section :class="`section section--tabs section--tabs-${group} flexshrink`">
		<button v-if="hamburger" :class="`sheet-tabs-toggle sheet-tabs-toggle--${group}`" @click="toggleMenu">
			<i class="fas fa-bars"></i><span class="visually-hidden"> Toggle Navigation</span>
		</button>
		<nav :class="[`sheet-tabs tabs tabs--${group} stroke stroke-bottom`, { active: menuOpen }]" :data-group="group">
			<template v-if="noSpan">
				<a v-for="(tab, tabKey) in tabs" :key="`tab-${group}-${tabKey}`" @click="changeTab(tabKey)" :class="getTabClass(tab, tabKey)" :data-tab="tabKey">
					<i v-if="tab.icon" :class="`fas ${tab.icon}`"></i>
					<span v-if="!tab.hideLabel">{{tab.label}}</span>
				</a>
			</template>
			<template v-else>
				<span v-for="(tab, tabKey) in tabs" :key="`tab-${group}-${tabKey}`">
					<a @click="changeTab(tabKey)" :class="getTabClass(tab, tabKey)" :data-tab="tabKey" v-if="!tab.hidden">
						<i v-if="tab.icon" :class="`fas ${tab.icon}`"></i>
						<span v-if="!tab.hideLabel">{{tab.label}}</span>
					</a>
				</span>
			</template>
		</nav>
	</section>
</template>

<script>
import { toRaw } from "vue";
export default {
	name: "Tabs",
	props: ["group", "tabs", "hamburger", "no-span"],
	data() {
		return {
			currentTab: "details",
			menuOpen: false
		};
	},
	methods: {
		changeTab(tabKey) {
			// If a tab key was provided, update the default tab.
			if (typeof tabKey === "string") {
				this.currentTab = tabKey;
			}

			// Update the tab displays.
			for (let tab of Object.values(this.tabs)) {
				tab.active = false;
			}

			// Update the active tab display.
			if (this.tabs[this.currentTab]) {
				this.tabs[this.currentTab].active = true;
			}

			// Close the mobile menu if open.
			this.menuOpen = false;
		},
		toggleMenu() {
			this.menuOpen = !this.menuOpen;
		},
		// Close the mobile menu when clicking anywhere outside of the tabs section.
		onDocumentClick(event) {
			if (!event.target.closest(".section--tabs")) {
				this.menuOpen = false;
			}
		},
		getTabClass(tab, index) {
			return `tab-link tab-link--${index}${tab.active ? " active": ""}`;
		}
	},
	async mounted() {
		// Attempt to get the current tab from the first active tab.
		const rawTabs = toRaw(this.tabs);
		this.currentTab = Object.values(rawTabs).find((t) => t.active)?.key ?? "details";
		// If the tab is hidden, default to details.
		if (this.tabs[this.currentTab]?.hidden) {
			this.currentTab = "details";
		}
		this.changeTab(this.currentTab);
		// Close the mobile menu when clicking anywhere else on the page.
		document.addEventListener("click", this.onDocumentClick);
	},
	unmounted() {
		document.removeEventListener("click", this.onDocumentClick);
	}
};
</script>
