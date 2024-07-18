import VueRenderingMixin from "./_vue-application-mixin.mjs";
const { DocumentSheetVue } = grimwild.applications.api;

const { api, sheets } = foundry.applications;
const { DOCUMENT_OWNERSHIP_LEVELS } = CONST;

export class GrimwildActorSheetVue extends VueRenderingMixin(sheets.ActorSheetV2) {
  vueComponents = {
    'document-sheet': DocumentSheetVue
  }
}