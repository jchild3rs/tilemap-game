// in this system we want to:
// - handle drawing path lines based on the movement.path component
// - handle drawing waypoints based on the last position of each path
import { Effect } from "effect";
import * as PIXI from "pixi.js";
import { Config } from "../app/config.ts";
import { EntityManager } from "../app/entity-manager.ts";
import type { System } from "../types.ts";

export const PathRenderSystem = Effect.gen(function* () {
	const entityManager = yield* EntityManager;
	const config = yield* Config;

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
				const graphics = entity.getComponent("Graphics");
				const allPaths = movement.path.flat();
				const hasPath = movement.path.length > 0;

				const pathLabel = `path line${entity.id}`;
				const existingPathLineGraphic =
					graphics.graphic.parent.getChildByLabel(pathLabel);

				const pathLineGraphic = (existingPathLineGraphic ||
					new PIXI.Graphics({ label: pathLabel })) as PIXI.Graphics;
				pathLineGraphic.visible = hasPath;

				if (!existingPathLineGraphic) {
					graphics.graphic.parent.addChild(pathLineGraphic);
				}

				const pathTargetLabel = `path target${entity.id}`;
				const existingPathTargetGraphic =
					graphics.graphic.parent.getChildByLabel(pathTargetLabel);
				const pathTargetContainer =
					existingPathTargetGraphic ||
					new PIXI.Container({ label: pathTargetLabel });

				if (!existingPathTargetGraphic) {
					graphics.graphic.parent.addChild(pathTargetContainer);
				}

				if (hasPath) {
					pathLineGraphic.clear();
					pathLineGraphic.moveTo(
						position.x + config.CELL_SIZE / 2,
						position.y + config.CELL_SIZE / 2,
					);

					for (let i = movement.currentPathIndex; i < allPaths.length; i++) {
						const [gridX, gridY] = allPaths[i];
						const worldX = gridX * config.CELL_SIZE + config.CELL_SIZE / 2;
						const worldY = gridY * config.CELL_SIZE + config.CELL_SIZE / 2;
						pathLineGraphic.lineTo(worldX, worldY);
					}

					pathLineGraphic.stroke({
						color: 0xffffff,
						width: 2,
						alpha: 0.25,
					});
				}

				const hasReachedTarget =
					movement.path.length > 0 &&
					movement.currentPathIndex >= movement.path[0].length;

				if (hasReachedTarget) {
					pathTargetContainer.removeChildren();
					pathLineGraphic.clear();
				}
			}
		});

	return { update } as const satisfies System;
});
