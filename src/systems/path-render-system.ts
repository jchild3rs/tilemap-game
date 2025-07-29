// in this system we want to:
// - handle drawing path lines based on the movement.path component
// - handle drawing waypoints based on the last position of each path
import { Effect } from "effect";
import * as PIXI from "pixi.js";
import { Config } from "../app/config.ts";
import { EntityManager } from "../app/entity-manager.ts";
import { Viewport } from "../app/viewport.ts";
import type { System } from "../types.ts";

export const PathRenderSystem = Effect.gen(function* () {
	const entityManager = yield* EntityManager;
	const viewport = yield* Viewport;
	const config = yield* Config;

	const pathGraphic = viewport.addChild(
		new PIXI.Graphics({
			label: "path line",
		}),
	);
	const targetContainer = viewport.addChild(
		new PIXI.Container({
			label: "path target",
		}),
	);

	const targetGraphic = targetContainer.addChild(
		new PIXI.Graphics({
			label: "path waypoint",
		}),
	);

	const waypointContainer = viewport.addChild(
		new PIXI.Container({
			label: "path waypoints",
		}),
	);

	const update = (_ticker: PIXI.Ticker) =>
		Effect.gen(function* () {
			const entities = yield* entityManager.getAllEntitiesWithComponents([
				"Movement",
				"Position",
				"Graphics",
			]);

			for (const entity of entities) {
				const movement = entity.getComponent("Movement");
				const position = entity.getComponent("Position");

				if (movement.path.length > 0) {
					const paths = movement.path.flat();
					const targetGridPosition = paths[paths.length - 1];

					// targetGraphic.width = config.CELL_SIZE;
					// targetGraphic.height = config.CELL_SIZE;
					// targetGraphic.position.set(
					// 	targetGridPosition[0] * config.CELL_SIZE + config.CELL_SIZE / 2,
					// 	targetGridPosition[1] * config.CELL_SIZE + config.CELL_SIZE / 2,
					// );
					// targetGraphic.circle(0, 0, 5).stroke({
					// 	color: 0xffffff,
					// 	width: 1,
					// 	alpha: 0.5,
					// });

					pathGraphic.clear();

					// Move to the current position on the path
					pathGraphic.moveTo(
						position.x + config.CELL_SIZE / 2,
						position.y + config.CELL_SIZE / 2,
					);

					// Draw lines only for the remaining steps
					for (let i = movement.currentPathIndex; i < paths.length; i++) {
						const [gridX, gridY] = paths[i];
						const worldX = gridX * config.CELL_SIZE + config.CELL_SIZE / 2;
						const worldY = gridY * config.CELL_SIZE + config.CELL_SIZE / 2;
						pathGraphic.lineTo(worldX, worldY);
					}

					pathGraphic.stroke({
						color: 0xffffff,
						width: 3,
						alpha: 1,
						pixelLine: true,
					});
					// holder.forEach(waypoint => {
					// 	waypointContainer.removeChild(waypoint)
					// })

					// console.log("moving");
				}

				const hasReachedTarget =
					movement.path.length > 0 &&
					movement.currentPathIndex >= movement.path[0].length;

				if (hasReachedTarget) {
					// console.log("stopped", waypointContainer);
					pathGraphic.clear();
					targetGraphic.clear();
					waypointContainer.removeChildren();
				}
			}
		});

	return { update } as const satisfies System;
});
