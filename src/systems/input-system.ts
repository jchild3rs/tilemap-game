import { Chunk, Effect, Stream, type StreamEmit } from "effect";
import type * as PIXI from "pixi.js";
import type { FederatedPointerEvent } from "pixi.js";
import { Config } from "../app/config.ts";
import { EntityManager } from "../app/entity-manager.ts";
import { Tilemap } from "../app/tilemap.ts";
import { Viewport } from "../app/viewport.ts";
import { ChangeGameSpeedLevel } from "../commands/change-game-speed-level.ts";
import { Draft } from "../commands/draft.ts";
import { MoveViewport } from "../commands/move-viewport.ts";
import { SelectAll } from "../commands/select-all.ts";
import { TogglePausePlay } from "../commands/toggle-pause-play.ts";
import { Pathfinding } from "../services/pathfinding-service.ts";
import { PositionConversion } from "../services/position-conversion.ts";
import {
	type Command,
	MovementDirection,
	type PositionLiteral,
	type System,
} from "../types.ts";

/**
 * Input + Command system responsible for reacting to user input
 */
export const InputSystem = Effect.gen(function* () {
	const entityManager = yield* EntityManager;
	const viewport = yield* Viewport;
	const tilemap = yield* Tilemap;
	const config = yield* Config;
	const keyJustPressed: Record<string, boolean> = {};
	const keys: Record<string, boolean> = {};
	const viewportSpeed = 200;
	const mouseHoverPosition: PositionLiteral = { x: 0, y: 0 };
	const pathfinding = yield* Pathfinding;

	const handleKeyCombinations = (): boolean => {
		if (keys.meta && keys.a) {
			// selectAllEntities();
		}
		// Examples of handling key combinations
		if (keys.meta && keys["+"]) {
			return true;
		}

		if (keys.meta && keys["-"]) {
			return true;
		}
		// if (keys["control"] && keys["a"]) {
		// 	// Ctrl+A: Select all entities
		// 	selectAllEntities();
		//
		// 	// Prevent browser's "select all" behavior
		// 	keys["a"] = false;
		// }
		//
		// if (keys["control"] && keys["s"]) {
		// 	// Ctrl+S: Save game state or similar
		// 	// saveGameState();
		//
		// 	// Prevent browser's save dialog
		// 	keys["s"] = false;
		// }
		return false;
	};

	// Setup keydown event
	window.addEventListener("keydown", (event: KeyboardEvent) => {
		// Prevent default behavior for certain keys to avoid browser actions
		if (
			[
				"Space",
				"ArrowUp",
				"ArrowDown",
				"ArrowLeft",
				"ArrowRight",
				"w",
				"a",
				"s",
				"d",
				"1",
				"2",
				"3",
			].includes(event.key)
		) {
			event.preventDefault();
		}

		// Track if this is a new key press
		const key = event.key.toLowerCase();
		if (!keys[key]) {
			keyJustPressed[key] = true;
		}

		// Store key state (using lowercase for consistency)
		keys[event.key.toLowerCase()] = true;

		// Track modifier keys
		if (event.ctrlKey) keys.control = true;
		if (event.shiftKey) keys.shift = true;
		if (event.altKey) keys.alt = true;

		// Handle key combinations
		const preventDefault = handleKeyCombinations();
		if (preventDefault) {
			event.preventDefault();
		}
	});

	// Setup keyup event
	window.addEventListener("keyup", (event: KeyboardEvent) => {
		// Clear key state
		keys[event.key.toLowerCase()] = false;

		// Update modifier key states
		if (event.key === "Control") keys.control = false;
		if (event.key === "Shift") keys.shift = false;
		if (event.key === "Alt") keys.alt = false;
	});

	// Handle focus issues - clear all keys when window loses focus
	window.addEventListener("blur", () => {
		// Reset all key states when window loses focus
		for (const key in keys) {
			keys[key] = false;
		}
	});

	const positionConversion = yield* PositionConversion;

	viewport.on("globalpointermove", (event) => {
		const worldPosition = viewport.toWorld(event.x, event.y);
		const gridPosition = positionConversion.worldToGrid(worldPosition);
		mouseHoverPosition.x = gridPosition.x;
		mouseHoverPosition.y = gridPosition.y;
	});

	const updateMovementEntitiesPath = (
		worldPosition: PositionLiteral,
		isShiftHeld: boolean,
	) =>
		Effect.gen(function* () {
			const gridTargetPosition = {
				x: Math.floor(worldPosition.x / config.CELL_SIZE),
				y: Math.floor(worldPosition.y / config.CELL_SIZE),
			};

			const isValidTarget =
				gridTargetPosition.x >= 0 && gridTargetPosition.y >= 0;

			if (!isValidTarget) {
				console.log("Invalid target position");
				return;
			}

			const allPositionEntities =
				yield* entityManager.getAllEntitiesWithComponents(["Position"]);

			const entities = yield* entityManager.getAllEntitiesWithComponents([
				"Movement",
				"Position",
				"Input",
				"Selectable",
			]);

			const positionEntities = allPositionEntities.map((e) => {
				return e.getComponent("Position");
			});
			// console.log({ positionEntities });
			const targetIsInCurrentPositions = positionEntities.some((entity) => {
				const gridPos = positionConversion.worldToGrid(entity);
				// console.log(
				// 	gridPos.x,
				// 	gridPos.y,
				// 	gridTargetPosition.x,
				// 	gridTargetPosition.y,
				// );
				return (
					gridPos.x === gridTargetPosition.x &&
					gridPos.y === gridTargetPosition.y
				);
			});
			console.log({ targetIsInCurrentPositions });

			if (targetIsInCurrentPositions) {
				alert("TODO: context menu on the thing you clicked");
				return;
			}

			const selectedEntities = entities.filter((e) => {
				const entity = e.getComponent("Input");
				const selectable = e.getComponent("Selectable");
				return entity.isPlayerControlled && selectable.isSelected;
			});

			const selectedPositions = selectedEntities.map((entity) =>
				entity.getComponent("Position"),
			);

			const formationPositions = pathfinding.generateFormationPositions(
				selectedEntities.length,
				gridTargetPosition,
			);

			const assignments = pathfinding.assignOptimalFormationPositions(
				positionConversion,
				selectedPositions,
				formationPositions,
			);

			let assignmentsIndex = 0;
			for (const entity of selectedEntities) {
				const movement = entity.getComponent("Movement");
				// const position = entity.getComponent("Position");
				const assignment = assignments[assignmentsIndex];
				if (!assignment) {
					assignmentsIndex = 0;
					continue;
				}
				assignmentsIndex++;
				const position = assignment.position;

				// Get the current exact position
				const exactPosition = {
					x: position.x,
					y: position.y,
				};

				// Calculate the grid position to use for pathfinding
				const startGridX = Math.round(exactPosition.x / config.CELL_SIZE);
				const startGridY = Math.round(exactPosition.y / config.CELL_SIZE);

				// Calculate start point for the new path
				let pathStartX = startGridX;
				let pathStartY = startGridY;

				// If shift key is held and we're adding a waypoint, start from the end of the current/last path
				if (isShiftHeld && movement.path.length > 0) {
					// Get the last path in the queue
					const lastPathIndex = movement.path.length - 1;
					const lastPath = movement.path[lastPathIndex];

					if (lastPath.length > 0) {
						// Start from the last point of the last path
						const [lastX, lastY] = lastPath[lastPath.length - 1];
						pathStartX = lastX;
						pathStartY = lastY;
					}
				}

				// Find path from current position (or last waypoint) to target
				const newPath = tilemap.findPath(
					{ x: pathStartX, y: pathStartY },
					assignment.target,
				);

				// Skip if no path found
				if (newPath.length === 0) {
					console.log("No path found");
					continue;
				}

				// Handle special case for first segment of new path for direct movement
				if (!isShiftHeld && newPath.length > 1) {
					// If we're replacing the current path (not adding a waypoint)
					// Check if first point would cause backward movement
					const [firstGridX, firstGridY] = newPath[0];
					const firstWorldX = firstGridX * config.CELL_SIZE;
					const firstWorldY = firstGridY * config.CELL_SIZE;

					// Calculate distance to first point
					const toFirstDistanceSq =
						(firstWorldX - exactPosition.x) ** 2 +
						(firstWorldY - exactPosition.y) ** 2;

					// If we're already very close to the first point, skip it
					if (toFirstDistanceSq < (config.CELL_SIZE / 4) ** 2) {
						newPath.shift(); // Remove the first point as we're already close to it
					}
				}

				// Handle shift key for adding waypoints
				if (isShiftHeld) {
					if (movement.path.length === 0) {
						// If there's no existing path, just set it
						movement.path = [newPath];
						movement.currentPathIndex = 0;
						// } else if (movement.currentPathIndex < movement.path[0].length) {
						// 	// Currently moving - need to queue the new path
						// 	// movement.path[movement.currentStepIndex] =
						// 	// 	movement.path[movement.currentStepIndex].concat(newPath);
						// 	const foo = movement.path[movement.currentStepIndex]
						// 	foo.push(newPath);
						// } else {
						// 	// Not currently moving or at the end of a segment - add directly
						// 	movement.path.push(newPath);
						// }
					} else {
						// add
						const lastPath = movement.path[movement.path.length - 1];
						lastPath.push(newPath[0]);
						movement.path.push(newPath.slice(1));
						// console.log([...movement.path])
					}
				} else {
					// Replace existing path
					if (
						movement.path.length > 0 &&
						movement.currentPathIndex < movement.path[0].length
					) {
						// Entity is currently moving - set as pending
						movement.pendingPath = [newPath];
					} else {
						// Entity is not moving - apply immediately
						movement.path = [newPath];
						movement.currentPathIndex = 0;
					}
				}
			}
		});

	window.addEventListener("contextmenu", (event) => {
		event.preventDefault();
	});

	// viewport.on('rightclick', () => {
	// 	Effect.runFork(updateMovementEntitiesPath)
	// })
	yield* Stream.async(
		(emit: StreamEmit.Emit<never, never, FederatedPointerEvent, void>) => {
			viewport.on("rightclick", (event) => {
				void emit(Effect.succeed(Chunk.of(event)));
			});
		},
	).pipe(
		Stream.tap((event) =>
			updateMovementEntitiesPath(
				viewport.toWorld(event.screen),
				event.shiftKey,
			),
		),
		Stream.runDrain,
		Effect.forkDaemon,
	);

	//
	// // Track mouse position for actions that might need it
	// window.addEventListener("mousemove", (event: MouseEvent) => {
	// 	mousePosition = {
	// 		x: event.clientX,
	// 		y: event.clientY
	// 	};
	// 	mouseGridPosition = foo.worldToGrid(mousePosition)
	//
	// 	console.log(mouseGridPosition)
	// });

	// const selectAllSelectableEntities = (): void => {
	// 	console.log("selectAllEntities()");
	// 	const selectableEntities = entityManager.getEntitiesWithComponents(["Selectable",]);
	//
	// 	selectableEntities.forEach((entity) => {
	// 		const selectable = entity.getComponent("Selectable");
	// 		selectable.isSelected = true;
	// 	});
	// }

	const setupTouchListeners = (): void => {
		// Virtual joystick for viewport movement on touch devices
		let touchStartPos = { x: 0, y: 0 };
		let isTouching = false;

		window.addEventListener("touchstart", (event: TouchEvent) => {
			if (event.touches.length === 1) {
				isTouching = true;
				touchStartPos = {
					x: event.touches[0].clientX,
					y: event.touches[0].clientY,
				};
			}
		});

		window.addEventListener("touchmove", (event: TouchEvent) => {
			if (isTouching && event.touches.length === 1) {
				const touchX = event.touches[0].clientX;
				const touchY = event.touches[0].clientY;

				// Calculate direction vector (like a virtual joystick)
				const dx = (touchX - touchStartPos.x) / 50; // Sensitivity factor
				const dy = (touchY - touchStartPos.y) / 50;

				// Emulate WASD keys based on touch direction
				keys.w = dy < -0.5;
				keys.s = dy > 0.5;
				keys.a = dx < -0.5;
				keys.d = dx > 0.5;
			}
		});

		window.addEventListener("touchend", () => {
			isTouching = false;

			// Reset direction keys
			keys.w = false;
			keys.s = false;
			keys.a = false;
			keys.d = false;
		});
	};

	if ("ontouchstart" in window) {
		setupTouchListeners();
	}

	const commands: Record<string, Command> = {};

	commands.w = MoveViewport(viewport, 0, -1, viewportSpeed);
	commands.s = MoveViewport(viewport, 0, 1, viewportSpeed);
	commands.a = MoveViewport(viewport, -1, 0, viewportSpeed);
	commands.d = MoveViewport(viewport, 1, 0, viewportSpeed);
	commands["1"] = ChangeGameSpeedLevel(0.5);
	commands["2"] = ChangeGameSpeedLevel(1);
	commands["3"] = ChangeGameSpeedLevel(2);
	commands[" "] = TogglePausePlay();
	commands.r = Draft(entityManager);
	commands.j = SelectAll(entityManager);

	const getDirectionFromVector = (
		dx: number,
		dy: number,
	): MovementDirection => {
		if (dx > 0 && dy > 0) return MovementDirection.UpRight;
		if (dx > 0 && dy < 0) return MovementDirection.DownRight;
		if (dx < 0 && dy > 0) return MovementDirection.UpLeft;
		if (dx < 0 && dy < 0) return MovementDirection.DownLeft;
		if (dx > 0) return MovementDirection.Right;
		if (dx < 0) return MovementDirection.Left;
		if (dy > 0) return MovementDirection.Down;
		if (dy < 0) return MovementDirection.Up;

		return MovementDirection.Up;
	};

	const handleEntityInput = Effect.gen(function* () {
		// console.log('wut')
		const controlledEntities =
			yield* entityManager.getAllEntitiesWithComponents([
				"Input",
				"Position",
				"Movement",
			]);

		for (const entity of controlledEntities) {
			const input = entity.getComponent("Input");
			const movement = entity.getComponent("Movement");

			// Skip entities that aren't player-controlled
			if (!input.isPlayerControlled) continue;

			// Calculate direction based on pressed keys
			let dx = 0;
			let dy = 0;

			if (keys[input.moveUp]) dy -= 1;
			if (keys[input.moveDown]) dy += 1;
			if (keys[input.moveLeft]) dx -= 1;
			if (keys[input.moveRight]) dx += 1;

			// Normalize diagonal movement
			if (dx !== 0 && dy !== 0) {
				const length = Math.sqrt(dx * dx + dy * dy);
				dx /= length;
				dy /= length;
			}

			// Apply movement
			if (dx !== 0 || dy !== 0) {
				// Set entity movement direction
				movement.direction = getDirectionFromVector(dx, dy);
				movement.isMoving = true;
			} else {
				movement.isMoving = false;
			}

			// Handle action buttons
			if (keys[input.action1]) {
				// Trigger action (could dispatch an event or directly call a method)
				// triggerEntityAction(entity, "primary");
				// Reset to prevent repeated actions
				keys[input.action1] = false;
			}
		}
	});

	const update = (ticker: PIXI.Ticker) =>
		Effect.gen(function* () {
			yield* handleEntityInput;

			for (const [key, commandFactory] of Object.entries(commands)) {
				if (keys[key]) {
					// Handle single keys
					if (key === " " || key === "r") {
						if (keyJustPressed[key]) {
							yield* commandFactory.execute(ticker);
							keyJustPressed[key] = false; // Reset until key is released
						}
					} else {
						// For other commands, execute every frame while key is pressed
						yield* commandFactory.execute(ticker);
					}
				}
			}

			// Reset the keyJustPressed flags for keys that are no longer pressed
			for (const key in keyJustPressed) {
				if (!keys[key]) {
					keyJustPressed[key] = false;
				}
			}
		});

	return { update } as const satisfies System;
});
