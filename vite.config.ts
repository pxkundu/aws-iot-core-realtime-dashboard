import { resolve } from "path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import eslint from "vite-plugin-eslint";
import Inspect from "vite-plugin-inspect";
import svgr from "vite-plugin-svgr";

export default defineConfig(({ command }) => {
	const isDev = command === "serve";
	
	return {
		plugins: [
			react(),
			svgr(),
			eslint({
				fix: true,
				failOnError: false
			}),
			...(isDev ? [] : [dts({ insertTypesEntry: true })]),
			Inspect({
				build: false,
				outputDir: ".vite-inspect"
			})
		],
		define: {
			global: "window",
			__vite_process_env_NODE_ENV: JSON.stringify(process.env.NODE_ENV)
		},
		resolve: {
			alias: {
				"@demo/assets": resolve(__dirname, "./src/assets"),
				"@demo/core": resolve(__dirname, "./src/core"),
				"@demo/atomicui": resolve(__dirname, "./src/atomicui"),
				"@demo/hooks": resolve(__dirname, "./src/hooks"),
				"@demo/services": resolve(__dirname, "./src/services"),
				"@demo/stores": resolve(__dirname, "./src/stores"),
				"@demo/types": resolve(__dirname, "./src/types"),
				"@demo/theme": resolve(__dirname, "./src/theme"),
				"@demo/utils": resolve(__dirname, "./src/utils"),
				"@demo/locales": resolve(__dirname, "./src/locales"),
				axios: "axios/dist/axios.js",
				"./runtimeConfig": "./runtimeConfig.browser"
			}
		},
		...(isDev ? {
			server: {
				port: 3000
			}
		} : {
			build: {
				outDir: "./dist",
				sourcemap: false,
				minify: true,
				rollupOptions: {
					output: {
						assetFileNames: (assetInfo) => {
							const info = assetInfo.name.split('.');
							const ext = info[info.length - 1];
							if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
								return `assets/images/[name]-[hash][extname]`;
							}
							if (/css/i.test(ext)) {
								return `assets/css/[name]-[hash][extname]`;
							}
							return `assets/[name]-[hash][extname]`;
						},
						chunkFileNames: 'assets/js/[name]-[hash].js',
						entryFileNames: 'assets/js/[name]-[hash].js',
					}
				}
			}
		})
	};
});
