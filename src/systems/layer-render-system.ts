import { Effect } from "effect";
import type * as PIXI from "pixi.js";
import { Container } from "pixi.js";
import { Config } from "../app/config.ts";
import { EntityManager } from "../app/entity-manager.ts";
import { Viewport } from "../app/viewport.ts";
import type { System } from "../types.ts";

/**
 * Responsible for rendering graphics into named layers on the stage.
 */
export const LayerRenderSystem = Effect.gen(function* () {
	const entityManager = yield* EntityManager;
	const viewport = yield* Viewport;
	const config = yield* Config;

	const groundLayer = viewport.addChild(new Container({ label: "Ground" }));
	const objectLayer = viewport.addChild(new Container({ label: "Objects" }));

	const renderGround = Effect.gen(function* () {
		const worldPositionedEntities =
			yield* entityManager.getAllEntitiesWithComponents([
				"Ground",
				"Position",
				"Graphics",
			]);

		for (const entity of worldPositionedEntities) {
			const position = entity.getComponent("Position");
			const graphics = entity.getComponent("Graphics");

			// Update graphic position based on position component
			graphics.graphic.x = position.x;
			graphics.graphic.y = position.y;

			// Ensure the graphic is in the correct layer
			if (graphics.graphic.parent !== groundLayer) {
				groundLayer.addChild(graphics.graphic);
			}
		}

		const gridPositionedEntities =
			yield* entityManager.getAllEntitiesWithComponents([
				"Ground",
				"GridPosition",
				"Graphics",
			]);

		for (const entity of gridPositionedEntities) {
			const position = entity.getComponent("GridPosition");
			const graphics = entity.getComponent("Graphics");

			// Update graphic position based on position component
			graphics.graphic.x = position.cellX * config.CELL_SIZE;
			graphics.graphic.y = position.cellY * config.CELL_SIZE;

			// Ensure the graphic is in the correct layer
			if (graphics.graphic.parent !== groundLayer) {
				groundLayer.addChild(graphics.graphic);
			}
		}
	});

	const renderGameObjects = Effect.gen(function* () {
		const worldPositionedEntities =
			yield* entityManager.getAllEntitiesWithComponents([
				"Objects",
				"Position",
				"Graphics",
			]);

		for (const entity of worldPositionedEntities) {
			const position = entity.getComponent("Position");
			const graphics = entity.getComponent("Graphics");

			// Update graphic position based on position component
			graphics.graphic.x = position.x;
			graphics.graphic.y = position.y;

			// Ensure the graphic is in the correct layer
			if (graphics.graphic.parent !== objectLayer) {
				objectLayer.addChild(graphics.graphic);
			}
		}

		const gridPositionedEntities =
			yield* entityManager.getAllEntitiesWithComponents([
				"Objects",
				"GridPosition",
				"Graphics",
			]);

		for (const entity of gridPositionedEntities) {
			const position = entity.getComponent("GridPosition");
			const graphics = entity.getComponent("Graphics");

			// Update graphic position based on position component
			graphics.graphic.x = position.cellX * config.CELL_SIZE;
			graphics.graphic.y = position.cellY * config.CELL_SIZE;

			// Ensure the graphic is in the correct layer
			if (graphics.graphic.parent !== groundLayer) {
				groundLayer.addChild(graphics.graphic);
			}
		}
	});

	const update = (_ticker: PIXI.Ticker) =>
		Effect.gen(function* () {
			yield* renderGround;
			yield* renderGameObjects;
		});

	return { update } as const satisfies System;
});
