import { Effect } from "effect";
import * as PIXI from "pixi.js";
import { Config } from "./app/config.ts";
import { EntityManager } from "./app/entity-manager.ts";
import { Components } from "./components.ts";
import { MovementDirection } from "./types.ts";

export const makeWall = (x: number, y: number) =>
	Effect.gen(function* () {
		const config = yield* Config;
		const entityManager = yield* EntityManager;

		return yield* entityManager.createEntity([
			Components.Input({
				isPlayerControlled: false,
				moveUp: "",
				moveDown: "",
				moveLeft: "",
				moveRight: "",
				action1: "",
			}),
			Components.Walkable({ isWalkable: false }),
			Components.Selectable({
				isSelected: false,
				isDrafted: false,
			}),
			Components.Objects(),
			Components.Health({
				maxHealth: 100,
				currentHealth: 100,
			}),
			Components.Position({ x, y }),
			Components.Graphics({
				graphic: new PIXI.Graphics({ label: "wall" })
					.rect(0, 0, config.CELL_SIZE, config.CELL_SIZE)
					.fill("blue"),
			}),
		]);
	});

export const makePawn = (x: number, y: number) =>
	Effect.gen(function* () {
		const config = yield* Config;
		const entityManager = yield* EntityManager;

		return yield* entityManager.createEntity([
			Components.Input({
				isPlayerControlled: false,
				moveUp: "",
				moveDown: "",
				moveLeft: "",
				moveRight: "",
				action1: "",
			}),
			// Components.Walkable({ isWalkable: false }),
			Components.Highlightable(),
			Components.Selectable({
				isSelected: false,
				isDrafted: false,
			}),
			Components.Draftable({ isDrafted: false }),
			Components.Objects(),
			Components.Health({
				maxHealth: 100,
				currentHealth: 100,
			}),
			Components.Position({ x, y }),
			Components.Movement({
				speed: config.pawn.baseMovementSpeed,
				path: [],
				currentPathIndex: 0,
				direction: MovementDirection.Down,
				isMoving: false,
				isWandering: true,
				pendingPath: [],
				currentStepIndex: 0,
			}),
			Components.Graphics({
				graphic: new PIXI.Graphics({ label: "pawn" })
					.circle(
						config.CELL_SIZE / 2,
						config.CELL_SIZE / 2,
						config.CELL_SIZE / 2,
					)
					.stroke({
						color: 0xffffff,
						width: 1,
						alpha: 0.5,
					}),
				// graphic: new PIXI.Graphics({ label: "pawn" })
				// 	.rect(0, 0, config.CELL_SIZE, config.CELL_SIZE)
				// 	.fill("red"),
			}),
		]);
	});
