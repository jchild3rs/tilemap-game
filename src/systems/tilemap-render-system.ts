import { Effect } from "effect";
import * as PIXI from "pixi.js";
import { Config } from "../app/config.ts";
import { Tilemap } from "../app/tilemap.ts";
import { Viewport } from "../app/viewport.ts";
import type { System } from "../types.ts";

export const TilemapRenderSystem = Effect.gen(function* () {
	const viewport = yield* Viewport;
	const tilemap = yield* Tilemap;
	const config = yield* Config;

	const mount = () =>
		Effect.sync(() => {
			const container = viewport.addChild(
				new PIXI.Container({ label: "Tilemap" }),
			);

			for (let row = 0; row < tilemap.grid.height; row++) {
				for (let col = 0; col < tilemap.grid.width; col++) {
					const tileGraphic = container.addChild(
						new PIXI.Graphics({
							label: `Tile ${row},${col}`,
							eventMode: "none",
							alpha: 0.1,
						})
							.rect(0, 0, config.CELL_SIZE, config.CELL_SIZE)
							.stroke({
								width: 1,
								color: 0xffffff,
								// alpha: 1,
								pixelLine: true,
								alignment: 1,
							}),
					);
					if (tilemap.isWalkableAt(col, row)) {
						tileGraphic.fill(0x00ff00);
					} else {
						tileGraphic.fill(0xff0000);
					}

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
