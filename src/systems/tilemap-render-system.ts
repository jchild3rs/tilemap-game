import { Effect } from "effect";
import * as PIXI from "pixi.js";
import { Config } from "../app/config.ts";
import { EntityManager } from "../app/entity-manager.ts";
import { Tilemap } from "../app/tilemap.ts";
import { Viewport } from "../app/viewport.ts";
import { PositionConversion } from "../services/position-conversion.ts";
import type { System } from "../types.ts";

export const TilemapRenderSystem = Effect.gen(function* () {
	const viewport = yield* Viewport;
	const config = yield* Config;

	const mount = () =>
		Effect.sync(() => {
			const container = viewport.addChild(
				new PIXI.Container({ label: "Tilemap" }),
			);

			for (let row = 0; row < config.WORLD_SIZE; row++) {
				for (let col = 0; col < config.WORLD_SIZE; col++) {
					const tileGraphic = container.addChild(
						new PIXI.Graphics({
							label: `Tile ${row},${col}`,
							eventMode: "none",
						})
							.rect(0, 0, config.CELL_SIZE, config.CELL_SIZE)
							.stroke({
								width: 1,
								color: 0xffffff,
								alpha: 0.1,
								pixelLine: true,
								alignment: 1,
							}),
					);

					tileGraphic.position.set(
						col * config.CELL_SIZE,
						row * config.CELL_SIZE,
					);
				}
			}
		});

	const update = (_ticker: PIXI.Ticker) => Effect.succeed(undefined);

	return { update, mount } as const satisfies System;
});

export const WalkableSystem = Effect.gen(function* () {
	const entityManager = yield* EntityManager;
	const tilemap = yield* Tilemap;
	const positionConversion = yield* PositionConversion;

	const mount = () =>
		Effect.gen(function* () {
			const walkableEntities =
				yield* entityManager.getAllEntitiesWithComponents([
					"Walkable",
					"Position",
				]);

			for (const entity of walkableEntities) {
				const walkable = entity.getComponent("Walkable");
				const position = positionConversion.worldToGrid(
					entity.getComponent("Position"),
				);

				tilemap.setWalkableAt(position.x, position.y, walkable.isWalkable);
				tilemap.setWeightAt(position.x, position.y, walkable.weight);
			}
		});

	return {
		update: (_) => Effect.succeed(undefined),
		mount,
	} as const satisfies System;
});
