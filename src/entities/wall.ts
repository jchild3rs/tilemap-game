import { Effect } from "effect";
import * as PIXI from "pixi.js";
import { Config } from "../app/config.ts";
import { EntityManager } from "../app/entity-manager.ts";
import { Components } from "../components.ts";
import type { PositionLiteral } from "../types.ts";

export class WallEntity extends Effect.Service<WallEntity>()("entities/Wall", {
	effect: Effect.gen(function* () {
		const config = yield* Config;
		const entityManager = yield* EntityManager;
		// const tilemap = yield* Tilemap;
		// const positionConversion = yield* PositionConversion

		const create = (position: PositionLiteral) => {
			// const gridPosition = positionConversion.worldToGrid(position)
			// tilemap.setWalkableAt(gridPosition.x, gridPosition.y, false);
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
					isWalkable: false,
					weight: 1,
				}),
				// Components.Selectable({
				// 	isSelected: false,
				// 	isDrafted: false,
				// }),
				Components.Objects(),
				Components.Health({
					maxHealth: 100,
					currentHealth: 100,
				}),
				Components.Position(position),
				Components.Graphics({
					graphic: new PIXI.Graphics({ label: "wall" })
						.rect(0, 0, config.CELL_SIZE, config.CELL_SIZE)
						.fill("#704929"),
				}),
			]);
		};
		return { create } as const;
	}),
	accessors: true,
}) {}
