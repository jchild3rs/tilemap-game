import { Effect } from "effect";
import type * as PIXI from "pixi.js";
import { Config } from "../app/config.ts";
import { EntityManager } from "../app/entity-manager.ts";
import { Tilemap } from "../app/tilemap.ts";
import { PositionConversion } from "../services/position-conversion.ts";
import { MovementDirection, type System } from "../types.ts";

export const MovementSystem = Effect.gen(function* () {
	const entityManager = yield* EntityManager;
	const config = yield* Config;
	const tilemap = yield* Tilemap;
	const conversion = yield* PositionConversion;

	const update = (ticker: PIXI.Ticker) =>
		Effect.gen(function* () {
			const entities = yield* entityManager.getAllEntitiesWithComponents([
				"Movement",
				"Position",
			]);

			for (const entity of entities) {
				const movement = entity.getComponent("Movement");
				const position = entity.getComponent("Position");
				const health = entity.getComponent("Health");
				const input = entity.getComponent("Input");

				if (health) {
					if (health.currentHealth === 0) {
						movement.isMoving = false;
						movement.path = [];
						movement.currentPathIndex = 0;
						continue;
					}
				}

				if (
					input.isPlayerControlled &&
					movement.isWandering &&
					movement.path.length === 0
				) {
					const pos = tilemap.getRandomWalkablePosition();
					movement.path = [
						tilemap.findPath(conversion.worldToGrid(position), pos),
					];
					movement.pendingPath = [];
					movement.currentPathIndex = 0;
					continue;
				}

				if (movement.path.length === 0) {
					movement.isMoving = false;
					continue;
				}

				movement.isMoving = true;

				const currentPath = movement.path[0];

				if (movement.currentPathIndex < currentPath.length) {
					const [nextGridX, nextGridY] = currentPath[movement.currentPathIndex];
					const nextWorldPosition = {
						x: nextGridX * config.CELL_SIZE,
						y: nextGridY * config.CELL_SIZE,
					};

					// Calculate direction and distance to next point
					const dx = nextWorldPosition.x - position.x;
					const dy = nextWorldPosition.y - position.y;
					const distance = Math.sqrt(dx * dx + dy * dy);
					movement.direction = getDirection(dx, dy);

					// If there's a pending path and we need to switch to it
					if (movement.pendingPath && movement.pendingPath.length > 0) {
						// Switch to the new path without moving to the grid cell first
						movement.path = movement.pendingPath;
						movement.currentPathIndex = 0;
						movement.pendingPath = [];

						// Skip the rest of this update - we'll start moving along the new path in the next frame
						continue;
					}

					// Normal movement code - only move if we need to move
					if (distance > 0.1) {
						const cost = tilemap.getCostAt(nextGridX, nextGridY);

						let speed =
							movement.speed *
							ticker.speed *
							128 *
							(movement.isWandering ? 0.25 : 1);

						if (cost > 1) {
							speed = speed * cost * 0.1;
						}
						const moveDistance = Math.min(speed, distance);

						const directionX = dx / distance;
						const directionY = dy / distance;

						// Apply movement
						position.x += directionX * moveDistance;
						position.y += directionY * moveDistance;

						// Check if we've reached or nearly reached the target point
						if (moveDistance >= distance - 0.1) {
							// Move to next point in path
							movement.currentPathIndex++;
						}
					} else {
						// We're already at the target position, move to next point
						movement.currentPathIndex++;
					}
				} else if (movement.currentPathIndex >= currentPath.length) {
					// We've completed the current path segment
					movement.path.shift();
					movement.currentPathIndex = 0;
				}
			}
		});

	return { update } as const satisfies System;
});

function getDirection(deltaX: number, deltaY: number) {
	if (Math.abs(deltaX) < 0.1 && Math.abs(deltaY) < 0.1) {
		return MovementDirection.Down;
	}

	const angle = Math.atan2(deltaY, deltaX);
	const degree = (angle * 180) / Math.PI;

	if (degree >= -22.5 && degree < 22.5) {
		return MovementDirection.Right;
	} else if (degree >= 22.5 && degree < 67.5) {
		return MovementDirection.DownRight;
	} else if (degree >= 67.5 && degree < 112.5) {
		return MovementDirection.Down;
	} else if (degree >= 112.5 && degree < 157.5) {
		return MovementDirection.DownLeft;
	} else if (degree >= 157.5 || degree < -157.5) {
		return MovementDirection.Left;
	} else if (degree >= -157.5 && degree < -112.5) {
		return MovementDirection.UpLeft;
	} else if (degree >= -112.5 && degree < -67.5) {
		return MovementDirection.Up;
	} else if (degree >= -67.5 && degree < -22.5) {
		return MovementDirection.UpRight;
	}

	return MovementDirection.Right;
}
