import path from 'path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteStaticCopy } from 'vite-plugin-static-copy'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    viteStaticCopy({
      targets: [
        {
          src: 'src/assets/*',
          dest: 'assets/'
        },
        {
          src: 'src/module/*',
          dest: 'module'
        },
        {
          src: [
            'src/lib/*',
            'node_modules/vue/dist/vue.esm-browser.js',
          ],
          dest: 'lib'
        },
        {
          src: 'src/packs/*',
          dest: 'packs'
        },
        {
          src: 'build/*',
          dest: ''
        },
        {
          src: 'src/templates/*',
          dest: 'templates',
        }
      ]
    })
  ],
  resolve: {
    alias: {
      '@/': `${path.resolve(__dirname, 'src/vue')}/`,
      '@src/': `${path.resolve(__dirname, 'src')}/`,
      '@dist/': `${path.resolve(__dirname, 'dist')}/`,
    }
  },
  css: {},
  build: {
    sourcemap: true,
    outDir: './dist',
    lib: {
      entry: path.resolve(__dirname, 'src/vue/index.mjs'),
      name: 'vueComponents',
      fileName: 'components.vue.es.js',
    },
    rollupOptions: {
      external: [
        'vue',
        '../vue/components.vue.es.js',
      ],
      input: {
        vueApp: 'src/vue/index.mjs',
        // systemApp: 'src/module/grimwild.mjs',
      },
      output: [
        {
          // dir: 'dist',
          // Provide global variables to use in the UMD build
          // Add external deps here
          globals: {
            vue: 'Vue',
          },
          // Map the external dependency to a local copy of Vue 3 esm.
          paths: {
            vue: `../lib/vue.esm-browser.js`
          },
          assetFileNames: (assetInfo) => {
            if (assetInfo.name == 'style.css')
              return `styles.vue.css`;
            return assetInfo.name;
          },
          entryFileNames: (entry) => {
            return entry.name == 'vueApp' ? 'vue/components.vue.es.js' : 'module/grimwild.mjs';
          }
        },
      ],
    },
  }
});
