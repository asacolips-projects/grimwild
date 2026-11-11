<template>
  <div :class="`tab tab-${tab.key} ${['arcana', 'talents', 'gear'].includes(tab.key) ? 'tab-items' : ''} ${tab.active ? 'active' : ''} ${classes ? classes : ''}`" :data-group="group" :data-tab="tab.key">
    <slot></slot>
  </div>
</template>

<script>
export default {
	name: "Tab",
	props: ["tab", "group", "classes"]
};
</script>
