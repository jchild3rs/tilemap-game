import { defineConfig } from "vite";

export default defineConfig({
	resolve: {
		alias: {
			pathfinding: "./vendor/pathfinding/src/Pathfinding.js",
		},
	},
});
