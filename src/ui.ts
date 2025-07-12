import { effect } from "@preact/signals-core";
import type { GameState } from "./state.ts";

export class GameUI {
	private debugElement: HTMLElement = null!;
	// private selectionElement: HTMLElement = null!;
	// private speedElement: HTMLElement = null!;

	constructor(private gameState: GameState) {
		this.createUI();
		this.setupReactivity();
	}

	private createUI() {
		const uiContainer = document.createElement("div");
		uiContainer.className = "game-ui";
		uiContainer.style.cssText = `
			position: fixed;
			top: 0;
			left: 0;
			pointer-events: none;
			color: white;
			font-family: monospace;
			font-size: 14px;
			z-index: 1000;
		`;

		// Debug panel
		this.debugElement = document.createElement("div");
		this.debugElement.className = "debug-panel";
		this.debugElement.style.cssText = `
			position: fixed;
			bottom: 20px;
			left: 20px;
			background: rgba(0, 0, 0, 0.7);
			padding: 10px;
			border-radius: 4px;
			white-space: pre-line;
		`;

		console.log(this.gameState.debugInfo.value);
		this.debugElement.textContent = this.gameState.debugInfo.value;

		uiContainer.appendChild(this.debugElement);
		// uiContainer.appendChild(this.selectionElement);
		// uiContainer.appendChild(this.speedElement);
		document.body.appendChild(uiContainer);
	}

	private setupReactivity() {
		// Auto-update debug info when signals change
		effect(() => {
			this.debugElement.textContent = this.gameState.debugInfo.value;
		});

		// // Auto-update selection info
		// effect(() => {
		// 	const count = this.gameState.selectedCount.value;
		// 	const total = this.gameState.pawns.value.length;
		// 	this.selectionElement.textContent = `Selected: ${count}/${total} pawns`;
		// 	console.debug(`Selected: ${count}/${total} pawns`)
		// });
		//
		// // Auto-update speed info
		// effect(() => {
		// 	const speed = this.gameState.gameSpeed.value;
		// 	const paused = this.gameState.isPaused.value;
		// 	// this.speedElement.textContent = `Speed: ${speed.toFixed(1)}x${paused ? ' (PAUSED)' : ''}`;
		// });

		// Log when selection changes (for debugging)
		effect(() => {
			const selected = this.gameState.selectedPawns.value;
			console.debug(`Selection changed: ${selected.length} pawns selected`);
		});
	}
}
