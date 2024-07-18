const { createApp }  = grimwild.applications.api;

export default function VueRenderingMixin(BaseApplication) {

    class VueApplication extends BaseApplication {
      vueApp = null;
      vueRoot = null;
      vueComponents = {};

      async _renderFrame(options) {
        const element = super._renderFrame(options);
        const target = this.hasFrame ? element.querySelector('.window-content') : element;
        this.vueRoot = createApp({
          data() {
            return {
              context: context,
            }
          },
          components: this.vueComponents,
          methods: {
            updateContext(newContext) {
              for (let key of Object.keys(this.context)) {
                this.context[key] = newContext[key];
              }
            }
          }
        }).mount(target);

        return element;
      }

      async _renderHTML(context, options) {
        this.vueRoot.updateContext(context);
      }
    }

    return VueApplication;

}