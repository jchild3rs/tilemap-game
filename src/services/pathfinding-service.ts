import { Context, Effect, Layer } from "effect";
import { Config } from "../app/config.ts";
import { Tilemap } from "../app/tilemap.ts";
import type { PositionLiteral } from "../types.ts";
import { clamp } from "../utils.ts";
import type { PositionConversion } from "./position-conversion.ts";

export class Pathfinding extends Context.Tag("Pathfinding")<
	Pathfinding,
	{
		isValidFormationPosition(
			position: PositionLiteral,
			existingPawnDestinations?: Set<string>,
		): boolean;

		generateSpiralPositions(
			center: PositionLiteral,
			distance: number,
		): PositionLiteral[];

		isPositionDistanced(
			pos: PositionLiteral,
			existingPositions: PositionLiteral[],
			minDistance: number,
		): boolean;

		fillRemainingPositions(
			positions: PositionLiteral[],
			targetCount: number,
			center: PositionLiteral,
		): void;

		generateFormationPositions(
			count: number,
			center: PositionLiteral,
		): PositionLiteral[];

		assignOptimalFormationPositions(
			positionConversion: typeof PositionConversion.Service,
			selectedPositions: PositionLiteral[],
			formationPositions: PositionLiteral[],
		): Array<{
			position: PositionLiteral;
			target: PositionLiteral;
		}>;
	}
>() {}

export const PathfindingLive = Layer.effect(
	Pathfinding,
	Effect.gen(function* () {
		const tilemap = yield* Tilemap;
		const config = yield* Config;

		const isValidFormationPosition = (
			position: PositionLiteral,
			existingPawnDestinations: Set<string> = new Set(),
		): boolean => {
			// Check if position is already a target for another pawn
			const posKey = `${position.x},${position.y}`;
			if (existingPawnDestinations.has(posKey)) {
				return false;
			}

			// Basic walkable check
			if (!tilemap.isWalkableAt(position.x, position.y)) {
				return false;
			}

			// Check surrounding tiles to ensure there's adequate space
			let blockedNeighbors = 0;

			for (let dx = -1; dx <= 1; dx++) {
				for (let dy = -1; dy <= 1; dy++) {
					if (dx === 0 && dy === 0) continue;

					const nx = position.x + dx;
					const ny = position.y + dy;

					// Count unwalkable neighboring tiles
					if (
						nx < 0 ||
						nx >= config.worldSize.width ||
						ny < 0 ||
						ny >= config.worldSize.height ||
						!tilemap.isWalkableAt(nx, ny)
					) {
						blockedNeighbors++;
					}
				}
			}

			// If too many neighbors are blocked, this position is too constrained
			return blockedNeighbors <= 6;
		};

		// const generateLakePositions = (
		// 	center: PositionLiteral,
		// ) => {
		// 	const positions: PositionLiteral[] = [];
		//
		// }

		const generateSpiralPositions = (
			center: PositionLiteral,
			distance: number,
		): PositionLiteral[] => {
			const positions: PositionLiteral[] = [];
			const steps = Math.max(8 * distance, 20); // More steps for smoother spiral

			for (let i = 0; i < steps; i++) {
				// Parametric spiral equation
				const angle = (i / steps) * Math.PI * 2;
				const d = (i / steps) * distance;

				const x = Math.round(center.x + d * Math.cos(angle));
				const y = Math.round(center.y + d * Math.sin(angle));

				const pos = {
					x: clamp(0, config.worldSize.width - 1, x),
					y: clamp(0, config.worldSize.height - 1, y),
				};

				// Add if not already in the list
				if (!positions.some((p) => p.x === pos.x && p.y === pos.y)) {
					positions.push(pos);
				}
			}

			return positions;
		};

		const isPositionDistanced = (
			pos: PositionLiteral,
			existingPositions: PositionLiteral[],
			minDistance: number,
		): boolean => {
			for (const existing of existingPositions) {
				const dx = pos.x - existing.x;
				const dy = pos.y - existing.y;
				const distance = Math.sqrt(dx * dx + dy * dy);

				if (distance < minDistance) {
					return false;
				}
			}
			return true;
		};

		// Fill remaining positions with pathfinding if needed
		const fillRemainingPositions = (
			positions: PositionLiteral[],
			targetCount: number,
			center: PositionLiteral,
		): void => {
			// If we still need more positions, find them using pathfinding
			while (positions.length < targetCount) {
				// Start with the center and expand outward
				const searchGrid = tilemap.grid;

				// Mark existing positions as unwalkable to find new ones
				positions.forEach((pos) => {
					if (searchGrid.isWalkableAt(pos.x, pos.y)) {
						searchGrid.setWalkableAt(pos.x, pos.y, false);
					}
				});

				// Use a simple BFS to find the next valid position
				const queue: PositionLiteral[] = [center];
				const visited = new Set<string>();

				let foundPos: PositionLiteral | null = null;

				while (queue.length > 0 && !foundPos) {
					const current = queue.shift()!;
					const key = `${current.x},${current.y}`;

					if (visited.has(key)) continue;
					visited.add(key);

					// If this position is valid, use it
					if (
						searchGrid.isWalkableAt(current.x, current.y) &&
						isValidFormationPosition(current)
					) {
						foundPos = current;
						break;
					}

					// Add neighbors to queue
					for (let dx = -1; dx <= 1; dx++) {
						for (let dy = -1; dy <= 1; dy++) {
							if (dx === 0 && dy === 0) continue;

							const nx = current.x + dx;
							const ny = current.y + dy;

							if (
								nx >= 0 &&
								nx < config.worldSize.width &&
								ny >= 0 &&
								ny < config.worldSize.height
							) {
								queue.push({ x: nx, y: ny });
							}
						}
					}
				}

				if (foundPos) {
					positions.push(foundPos);
				} else {
					// If no valid position found, just duplicate the center as a last resort
					positions.push({ ...center });
				}
			}
		};

		const generateFormationPositions = (
			count: number,
			center: PositionLiteral,
		): PositionLiteral[] => {
			const positions: PositionLiteral[] = [];

			if (count === 1) {
				// Single pawn goes directly to target
				return [center];
			}

			// Start with a larger search area when obstacles are present
			const initialRingSize = Math.ceil(Math.sqrt(count));
			const maxRings = initialRingSize * 3; // Allow for a much larger search area

			let _positionIndex = 0;

			// First try the center position
			const centerPos = {
				x: clamp(0, config.worldSize.width - 1, center.x),
				y: clamp(0, config.worldSize.height - 1, center.y),
			};

			if (isValidFormationPosition(centerPos)) {
				positions.push(centerPos);
				_positionIndex++;
			}

			// Expand search in rings, but use spiral pattern for better obstacle avoidance
			for (let ring = 1; ring <= maxRings && positions.length < count; ring++) {
				// Get spiral positions for this ring
				const ringPositions = generateSpiralPositions(center, ring);

				for (const pos of ringPositions) {
					if (positions.length >= count) break;

					if (isValidFormationPosition(pos)) {
						// Check if this position is far enough from existing positions
						if (isPositionDistanced(pos, positions, 1)) {
							positions.push(pos);
						}
					}
				}
			}

			// Fill any remaining slots with closest valid positions
			if (positions.length < count) {
				fillRemainingPositions(positions, count, center);
			}

			return positions.slice(0, count);
		};

		const assignOptimalFormationPositions = (
			positionConversion: typeof PositionConversion.Service,
			selectedPositions: PositionLiteral[],
			formationPositions: PositionLiteral[],
		): Array<{
			position: PositionLiteral;
			target: PositionLiteral;
		}> => {
			const assignments: Array<{
				position: PositionLiteral;
				target: PositionLiteral;
			}> = [];

			// Create cost matrix for Hungarian algorithm
			const costMatrix: number[][] = [];

			for (const position of selectedPositions) {
				const pawnPos = positionConversion.worldToGrid(position);
				const costs: number[] = [];

				for (const formationPos of formationPositions) {
					// Calculate path length instead of just distance
					const path = tilemap.findPath(pawnPos, formationPos);
					const pathLength = path.length;

					// If no path is found, use a very high cost
					costs.push(pathLength > 0 ? pathLength : 1000);
				}

				costMatrix.push(costs);
			}

			// Implement a greedy assignment based on path costs
			const assignedPositions = new Set<number>();

			for (let i = 0; i < selectedPositions.length; i++) {
				const position = selectedPositions[i];
				let bestCost = Infinity;
				let bestPositionIndex = -1;

				for (let j = 0; j < formationPositions.length; j++) {
					if (assignedPositions.has(j)) continue;

					if (costMatrix[i][j] < bestCost) {
						bestCost = costMatrix[i][j];
						bestPositionIndex = j;
					}
				}

				if (bestPositionIndex !== -1) {
					assignedPositions.add(bestPositionIndex);
					assignments.push({
						position,
						target: formationPositions[bestPositionIndex],
					});
				} else {
					// Fallback: assign to first available position
					for (let j = 0; j < formationPositions.length; j++) {
						if (!assignedPositions.has(j)) {
							assignedPositions.add(j);
							assignments.push({
								position,
								target: formationPositions[j],
							});
							break;
						}
					}
				}
			}

			return assignments;
		};

		return {
			isValidFormationPosition,
			generateSpiralPositions,
			isPositionDistanced,
			fillRemainingPositions,
			generateFormationPositions,
			assignOptimalFormationPositions,
		} as const;
	}),
);
