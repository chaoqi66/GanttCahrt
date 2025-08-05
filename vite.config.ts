import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import fs from 'fs'


export default async ({mode, command}) => {
  const scssResources = []
  fs.readdirSync('src/assets/styles/resources').forEach((dirname) => {
      if (fs.statSync(`src/assets/styles/resources/${dirname}`).isFile()) {
          scssResources.push(`@use "src/assets/styles/resources/${dirname}" as *;`)
      }
  })
  return defineConfig({
    plugins: [vue()],
    resolve: {
      alias: {
          '@': path.resolve(__dirname, 'src'),
      },
      css: {
        preprocessorOptions: {
            scss: {
                additionalData: scssResources.join(''),
            },
        },
      },
    },
  })
}
