import { Effect } from "effect";
import * as PIXI from "pixi.js";
import { Config } from "../app/config.ts";
import { EntityManager } from "../app/entity-manager.ts";
import { Components } from "../components.ts";
import type { PositionLiteral } from "../types.ts";

export class WaterEntity extends Effect.Service<WaterEntity>()(
	"entities/Water",
	{
		effect: Effect.gen(function* () {
			const config = yield* Config;
			const entityManager = yield* EntityManager;
			// const tilemap = yield* Tilemap;
			// const positionConversion = yield* PositionConversion

			const create = (position: PositionLiteral) => {
				// const gridPosition = positionConversion.worldToGrid(position)
				// tilemap.setWeightAt(gridPosition.x, gridPosition.y, 10);

				return entityManager.createEntity([
					Components.Input({
						isPlayerControlled: false,
						moveUp: "",
						moveDown: "",
						moveLeft: "",
						moveRight: "",
						action1: "",
					}),
					Components.Walkable({
						isWalkable: true,
						weight: 2.7,
					}),
					Components.Ground({ isWalkable: true }),
					Components.Health({
						maxHealth: 100,
						currentHealth: 100,
					}),
					Components.Position(position),
					Components.Graphics({
						graphic: new PIXI.Graphics({ label: "water" })
							.rect(0, 0, config.CELL_SIZE, config.CELL_SIZE)
							.fill("blue"),
					}),
				]);
			};

			return { create } as const;
		}),
		accessors: true,
	},
) {}
