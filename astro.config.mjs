// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
	integrations: [mdx()],
	markdown: {
		shikiConfig: {
			themes: {
				light: 'github-light',
				dark: 'github-dark',
			},
			langs: [
				'solidity',
				'rust',
				'typescript',
				'javascript',
				'tsx',
				'jsx',
				'bash',
				'json',
			],
			defaultColor: 'light',
		},
	},
	vite: {
		plugins: [tailwindcss()],
	},
});
