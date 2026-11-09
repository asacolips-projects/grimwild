<template>
  <fieldset>
    <legend>{{ game.i18n.localize('GRIMWILD.UI.details') }}</legend>
    <div class="form-group stacked">
      <div class="form-group">
        <label>{{ context.systemFields.tier.label }}</label>
        <select name="system.tier" v-model="context.system.tier">
          <option v-for="(choice, choiceKey) in context.systemFields.tier.choices" :key="choiceKey" :value="choiceKey">{{ choice }}</option>
        </select>
      </div>
      <div class="form-group">
        <label>{{ context.systemFields.touchstones.label }}</label>
        <input type="text" name="system.touchstones" v-model="context.system.touchstones" />
      </div>
      <div class="form-group">
        <label>{{ context.systemFields.activation.label }}</label>
        <input type="text" name="system.activation" v-model="context.system.activation" />
      </div>
      <!-- Sensories -->
      <div class="form-group">
        <label><i class="fas fa-fan"></i> {{ game.i18n.localize('GRIMWILD.Item.Arcana.Descriptors') }}</label>
        <input type="text" name="system.sensories.descriptors" v-model="context.system.sensories.descriptors" />
      </div>
      <div class="form-group">
        <label><i class="fas fa-hand-paper"></i> {{ game.i18n.localize('GRIMWILD.Item.Arcana.Actions') }}</label>
        <input type="text" name="system.sensories.actions" v-model="context.system.sensories.actions" />
      </div>
      <div class="form-group stacked">
        <label>{{ context.systemFields.limitations.label }}</label>
        <Prosemirror :editable="context.editable" :field="context.editors['system.limitations']"/>
      </div>
    </div>
  </fieldset>
  <!-- Palette -->
  <fieldset>
    <legend>{{ context.systemFields.palette.label }}</legend>
    <div class="form-group stacked">
      <div v-for="(colorEntry, colorKey) in context.system.palette" :key="colorKey" class="form-group">
        <div class="form-group">
          <input type="text"
            :name="`system.palette.${colorKey}.name`"
            v-model="colorEntry.name"
            :placeholder="game.i18n.localize('GRIMWILD.Item.Arcana.PaletteName')"
          />
        </div>
        <div class="form-group">
          <ColorPicker :picker="context.customElements?.[`system.palette.${colorKey}.color`]" :editable="context.editable"/>
        </div>
      </div>
    </div>
  </fieldset>
</template>

<script setup>
import {
	Prosemirror,
	ColorPicker
} from "@/components";

const props = defineProps(["context"]);
</script>
