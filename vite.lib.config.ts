import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { versionDefine } from './scripts/packageVersion.ts'

const NPM_EXTERNALS = [/^react($|\/)/, /^react-dom($|\/)/, /^date-holidays($|\/)/]

export default defineConfig(({ mode }) => {
  const isElementBundle = mode === 'element'

  return {
    plugins: [react()],
    publicDir: false,
    define: { 'process.env.NODE_ENV': JSON.stringify('production'), ...versionDefine },
    build: {
      outDir: isElementBundle ? 'dist-lib/cdn' : 'dist-lib/npm',
      emptyOutDir: true,
      sourcemap: true,
      lib: isElementBundle
        ? { entry: 'src/lib/element-auto.ts', formats: ['es'], fileName: () => 'calendar-widget.js' }
        : { entry: { index: 'src/lib/index.ts' }, formats: ['es'] },
      rollupOptions: {
        external: isElementBundle ? [] : NPM_EXTERNALS,
        output: { minify: isElementBundle },
      },
    },
  }
})
