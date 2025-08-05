import { Effect } from "effect";
import * as PIXI from "pixi.js";
import { Config } from "../app/config.ts";
import { EntityManager } from "../app/entity-manager.ts";

import type { System } from "../types.ts";

export const UISystem = Effect.gen(function* () {
	const entityManager = yield* EntityManager;
	const config = yield* Config;

	// const toolbarContainer = document.createElement("div");
	// toolbarContainer.style.cssText = `
	// 	position: fixed;
	// 	top: 0;
	// 	left: 0;
	// 	z-index: 10000;
	// 	width: 100%;
	// 	height: 100%;
	// 	background: black;
	// 	height: 2rem;
	// 	`;
	//
	// const timeSpeedControls = document.createElement("div");
	// timeSpeedControls.style.cssText = ``;
	//
	// const pauseButton = document.createElement("button");
	// pauseButton.innerText = "Pause";
	// pauseButton.addEventListener("click", () => {
	// 	console.log("pause");
	// });
	// timeSpeedControls.appendChild(pauseButton);
	//
	// const playButton = document.createElement("button");
	// playButton.innerText = "Play";
	// let prev: number;
	// playButton.addEventListener("click", () => {
	// 	console.log("hmm");
	// });
	// timeSpeedControls.appendChild(playButton);
	//
	// const speedLevel2Button = document.createElement("button");
	// speedLevel2Button.innerText = "Speed 2";
	// speedLevel2Button.addEventListener("click", () => {});
	// timeSpeedControls.appendChild(speedLevel2Button);
	//
	// const speedLevel3Button = document.createElement("button");
	// speedLevel3Button.innerText = "Speed 3";
	// speedLevel3Button.addEventListener("click", () => {});
	// timeSpeedControls.appendChild(speedLevel3Button);
	//
	// toolbarContainer.appendChild(timeSpeedControls);

	// console.log(entityManager, config);

	const mount = () =>
		Effect.sync(() => {
			// document.body.appendChild(toolbarContainer);
		});

	const update = (_ticker: PIXI.Ticker) =>
		Effect.gen(function* () {
			const entities = yield* entityManager.getAllEntitiesWithComponents([
				"Person",
				"Position",
				"Graphics",
				"Health",
			]);

			for (const entity of entities) {
				const person = entity.getComponent("Person");
				const graphics = entity.getComponent("Graphics");
				const health = entity.getComponent("Health");

				const graphic = graphics.graphic.getChildByLabel("name") as
					| PIXI.Text
					| undefined;
				if (!graphic) {
					const text = new PIXI.Text({
						text: person.firstName,
						style: {
							fill: "#ffffff",
							fontSize: config.CELL_SIZE / 6,
						},
						label: "name",
						anchor: 0.5,
					});
					text.position.set(config.CELL_SIZE / 2, config.CELL_SIZE);
					graphics.graphic.addChild(text);
				} else {
				}

				if (graphic && health.currentHealth === 0) {
					graphic.visible = false;
				}
			}
		});
	return { update, mount } as const satisfies System;
});
