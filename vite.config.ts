import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
// import runtimeErrorOverlay from "vite-plugin-runtime-error-modal";
import { visualizer } from 'rollup-plugin-visualizer';
import { compression } from 'vite-plugin-compression2';

export default defineConfig({
  plugins: [
    react({
      // Optimize JSX runtime
      jsxRuntime: 'automatic',
      babel: {
        plugins: [
          // Optimize styled-components
          ["babel-plugin-styled-components", { displayName: false, pure: true }]
        ]
      }
    }),
    compression({
      algorithms: ['brotli'],
      exclude: [/\.(br)$/, /\.(gz)$/, /\.(png|jpe?g|gif|webp)$/i],
      deleteOriginalAssets: false,
    }),
    // Add build visualization in production
    process.env.NODE_ENV === 'production' && visualizer({
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    // Enhanced build performance
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false,
    // Improved code splitting and chunk optimization
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks for better caching
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'react-vendor';
            if (id.includes('@radix-ui')) return 'ui-vendor';
            if (id.includes('@tanstack/react-query')) return 'query-vendor';
            if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('zod')) 
              return 'form-vendor';
            if (id.includes('lucide-react')) return 'icons-vendor';
            return 'vendor'; // other dependencies
          }
          // Feature-based code splitting
          if (id.includes('/components/tabs/')) return 'features';
          if (id.includes('/components/ui/')) return 'ui';
        },
        // Optimize chunk file names and add content hash
        chunkFileNames: 'assets/[name].[hash].js',
        entryFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
      },
    },
    // Increase chunk size limit
    chunkSizeWarningLimit: 1500,
    // Enable asset optimization
    assetsInlineLimit: 4096, // 4kb
    cssCodeSplit: true,
    cssMinify: true,
    // Enable module preload
    modulePreload: {
      polyfill: true,
    },
  },
    server: {
      host: true,
      port: process.env.PORT ? parseInt(process.env.PORT) : 5173,
      strictPort: true,
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
      hmr: {
        port: process.env.PORT ? parseInt(process.env.PORT) : 24678,
        clientPort: process.env.PORT ? parseInt(process.env.PORT) : 24678
      },
      proxy: {
        '/api': {
          target: process.env.API_URL || 'http://localhost:5000',
          changeOrigin: true,
          secure: true,
        },
        '/ws': {
          target: process.env.WS_URL || 'ws://localhost:5000',
          ws: true,
          changeOrigin: true,
        }
      },
    },
  // Enhanced dependency optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@tanstack/react-query',
      'react-hook-form',
      'zod',
      'clsx',
      'tailwind-merge',
      'wouter',
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
    ],
    exclude: ['vite-plugin-cartographer'],
    esbuildOptions: {
      target: 'esnext',
    },
  },
  // Enhanced esbuild optimizations
  esbuild: {
    target: 'esnext',
    platform: 'browser',
    format: 'esm',
    treeShaking: true,
    // Remove console.log and debugger in production
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
    // Minification options
    minifyIdentifiers: true,
    minifySyntax: true,
    minifyWhitespace: true,
  },
});
