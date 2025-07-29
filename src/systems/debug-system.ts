import { Effect } from "effect";
import type * as PIXI from "pixi.js";
import { Viewport } from "../app/viewport.ts";
import { PositionConversion } from "../services/position-conversion.ts";

import type { System } from "../types.ts";

export const DebugSystem = Effect.gen(function* () {
	const viewport = yield* Viewport;
	const positionConversion = yield* PositionConversion;

	const debugContainer = document.createElement("div");
	debugContainer.style.cssText = `
		position: fixed;
		top: 0;
		left: 0;
		pointer-events: none;
		z-index: 10000;
		width: 100%;
		height: 100%;
		`;
	`
	`;

	const positionContainer = document.createElement("div");
	positionContainer.style.cssText = `
	position: absolute;
		top: 0;
		left: 0;
		background: rgba(0, 0, 0, 0.5);
		color: white;
		padding: 10px;
		font-size: 12px;
	`;
	debugContainer.appendChild(positionContainer);

	const fpsContainer = document.createElement("div");
	fpsContainer.style.cssText = `
		position: absolute;
		top: 0;
		right: 0;
		background: rgba(0, 0, 0, 0.5);
		color: white;
		padding: 10px;
		font-size: 12px;
		`;

	debugContainer.appendChild(fpsContainer);

	// console.log(entityManager, config);

	const mount = () =>
		Effect.sync(() => {
			document.body.appendChild(debugContainer);

			viewport.on("pointermove", (event) => {
				const screenPosition = event.screen;
				const viewportPosition = viewport.toLocal(event.global);
				const gridPosition = positionConversion.worldToGrid(viewportPosition);
				positionContainer.innerText = `
			Screen: ${Math.floor(screenPosition.x)}, ${Math.floor(screenPosition.y)}
Viewport: ${Math.floor(viewportPosition.x)}, ${Math.floor(viewportPosition.y)}
Grid: ${gridPosition.x}, ${gridPosition.y}`;
			});
		});

	const update = (ticker: PIXI.Ticker) =>
		Effect.sync(() => {
			fpsContainer.innerText = `FPS: ${Math.round(ticker.FPS)}`;
		});
	return { update, mount } as const satisfies System;
});
