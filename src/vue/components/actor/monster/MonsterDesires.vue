<template>
	<fieldset>
		<legend>Desires</legend>
		<div class="form-group stacked">
			<div class="form-group">
				<label>Wants</label>
				<input type="text" name="system.desires.0.value" v-model="context.system.desires[0].value"/>
			</div>
			<div class="form-group">
				<label>Doesn't want</label>
				<input type="text" name="system.desires.1.value" v-model="context.system.desires[1].value"/>
			</div>
		</div>
	</fieldset>
</template>

<script setup>
import { inject } from "vue";
// import { RollPoolInput } from "@/components";
const props = defineProps(["context"]);
// const actor = inject("rawDocument");
</script>