import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/js/main.tsx'],
            refresh: true,
        }),
        react(),
    ],
    server: {
        host: '0.0.0.0',
        port: 5173,
        // Local-only (agent box): serve assets + HMR through the HTTPS
        // gateway at blocks.agent.smoothbrained.lan — do not commit.
        origin: 'https://blocks.agent.smoothbrained.lan',
        hmr: {
            host: 'blocks.agent.smoothbrained.lan',
            clientPort: 443,
            protocol: 'wss',
            path: '/vite-hmr',
        },
        watch: {
            ignored: ['**/storage/framework/views/**'],
        },
    },
});
