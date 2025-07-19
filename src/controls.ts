import { Graphics, type Ticker } from "pixi.js";
import type { Viewport } from "pixi-viewport";
import {
	CELL_SIZE,
	GAME_SPEED_FAST,
	GAME_SPEED_NORMAL,
	GAME_SPEED_SLOW,
	WORLD_HEIGHT,
	WORLD_WIDTH,
} from "./config.ts";
import type { Pawn } from "./pawn.ts";
import type { GameState } from "./state.ts";
import { Tilemap } from "./tilemap.ts";
import type { PositionLiteral } from "./types.ts";
import { clamp } from "./util.ts";

export class Controls {
	// static pausedStartTimestamp = 0;
	// static pausedEndTimestamp = 0;
	// static pausedTime = 0;

	private pausedStartTimestamp = 0;
	private pausedEndTimestamp = 0;
	private pausedTime = 0;

	constructor(
		readonly viewport: Viewport,
		readonly tilemap: Tilemap,
		readonly ticker: Ticker,
		readonly appTicker: Ticker,
		readonly gameState: GameState,
	) {
		let isMouseDown = false;
		let isRightClick = false;
		let selectionStart: PositionLiteral | null = null;
		let selectionEnd: PositionLiteral | null = null;

		const selectionBox = this.viewport.addChild(
			new Graphics({ label: "selectionBox", zIndex: 1 })
				.rect(0, 0, 0, 0)
				.fill(0xffffff),
		);

		document.addEventListener("contextmenu", (e) => {
			e.preventDefault();
			isRightClick = true;
		});

		this.viewport.on("clicked", (e) => {
			const clickedGridPosition = Tilemap.positionToGrid(
				viewport.toLocal(e.screen),
			);
			const clickedPawn = this.gameState.getPawnAtPosition(clickedGridPosition);
			const event = e.event as unknown as MouseEvent;
			console.log({ clickedPawn });
			// console.log({clickedTileHasPawnAlready})

			if (isRightClick) {
				if (clickedPawn) {
					// todo show menu?
					return;
				}

				const selected = this.gameState.getSelectedPawns();
				const addWaypoint = event.shiftKey; // Check if shift is held

				if (selected.length > 1) {
					this.handleFormationMovement(
						selected,
						clickedGridPosition,
						addWaypoint,
					);
				} else if (selected.length === 1) {
					this.handleSinglePawnMovement(
						selected[0],
						clickedGridPosition,
						addWaypoint,
						new Set(),
					);
				}

				isRightClick = false;
				return;
			}

			if (!event.shiftKey) {
				this.gameState.clearSelected();
			}
		});

		this.viewport.on("mousedown", (e) => {
			if (!e.shiftKey) {
				this.gameState.clearSelected();
			}
			isMouseDown = true;

			selectionStart = this.viewport.toLocal(e.global);
		});

		this.viewport.on("mouseup", (e) => {
			const clickedGridPosition = Tilemap.positionToGrid(
				this.viewport.toLocal(e.screen),
			);
			const clickedPawn = this.gameState.pawnArr.find((pawn) => {
				const pawnGridPosition = Tilemap.positionToGrid(
					pawn.container.position,
				);

				return (
					pawnGridPosition.x === clickedGridPosition.x &&
					pawnGridPosition.y === clickedGridPosition.y
				);
			});

			if (e.shiftKey) {
				clickedPawn?.toggleSelected();
			}

			if (isRightClick) {
				isRightClick = false;
				return;
			}
			selectionEnd = this.viewport.toLocal(e.global);
			isMouseDown = false;

			this.gameState.pawnArr.forEach((pawn) => {
				if (selectionStart && selectionEnd) {
					const pawnIsWithinSelection = Tilemap.isWithinSelection(
						Tilemap.positionToGrid(selectionStart),
						Tilemap.positionToGrid(selectionEnd),
						Tilemap.positionToGrid(pawn.container.position),
					);

					if (pawnIsWithinSelection) {
						pawn.setSelected(true);
					}
				}
			});
		});

		document.addEventListener("mouseup", () => {
			if (isMouseDown) {
				isMouseDown = false;
				if (selectionBox.visible) {
					selectionBox.visible = false;
					selectionBox.clear();
				}
			}
		});

		document.addEventListener("mouseleave", () => {
			if (isMouseDown) {
				isMouseDown = false;
				if (selectionBox.visible) {
					selectionBox.visible = false;
					selectionBox.clear();
				}
			}
		});

		let previousSpeed: number | null = null;

		document.addEventListener("keydown", (e) => {
			const key = e.key;

			if (key === " ") {
				this.gameState.setPaused(!this.gameState.isPaused.value);

				if (previousSpeed) {
					// this.ticker.speed
					this.ticker.speed = previousSpeed;
					// this.ticker.start();
					previousSpeed = null;
					this.pausedEndTimestamp = Date.now();
					this.pausedTime +=
						this.pausedEndTimestamp - this.pausedStartTimestamp;
					this.pausedStartTimestamp = 0;
					this.pausedEndTimestamp = 0;
				} else {
					// this.ticker.stop();
					this.pausedStartTimestamp = Date.now();
					previousSpeed = this.ticker.speed;
					this.ticker.speed = 0;
				}
			} else if (key === "1") {
				this.ticker.speed = GAME_SPEED_SLOW;
				this.gameState.setGameSpeed(GAME_SPEED_SLOW);
			} else if (key === "2") {
				this.ticker.speed = GAME_SPEED_NORMAL;
				this.gameState.setGameSpeed(GAME_SPEED_NORMAL);
			} else if (key === "3") {
				this.ticker.speed = GAME_SPEED_FAST;
				this.gameState.setGameSpeed(GAME_SPEED_FAST);
			}

			if (key === "r") {
				const selected = this.gameState.getSelectedPawns();
				if (selected.length === 0) return;

				// if we have a mixed state, we want to set all selected to `drafted`
				const selectedHasMixedState =
					selected.filter((pawn) => pawn.$isMoving.value).length <
					selected.length;
				const notDrafted = selected.filter((pawn) => pawn.$isMoving.value);
				const notDraftedSelectionCount = notDrafted.length;

				for (const pawn of selected) {
					if (notDraftedSelectionCount === 0) {
						pawn.undraft();
						continue;
					}

					if (pawn.$isDrafted.value && !selectedHasMixedState) {
						pawn.undraft();
					} else {
						pawn.draft();
					}
				}
			}
		});

		const keysPressed = new Set<string>();
		const moveDelta = CELL_SIZE / 4;

		document.addEventListener("keydown", (e) => {
			keysPressed.add(e.key);
		});

		document.addEventListener("keyup", (e) => {
			keysPressed.delete(e.key);
		});

		let hoveredCellPosition: PositionLiteral | null = null;

		this.viewport.on("globalpointermove", (e) => {
			selectionEnd = this.viewport.toLocal(e.global);
			hoveredCellPosition = Tilemap.positionToGrid(
				this.viewport.toLocal(e.global),
			);
			this.gameState.setHoveredPosition(hoveredCellPosition);
		});

		this.ticker.add((time) => {
			this.gameState.setElapsedTime(time.lastTime - this.pausedTime);
			this.gameState.setGameSpeed(time.speed);
			this.gameState.setFPS(time.FPS);

			// Update game time (accumulates with speed scaling)
			this.gameState.updateGameTime(time.deltaTime * (1000 / 60)); // Convert to milliseconds
		});

		this.appTicker.add(() => {
			if (keysPressed.size === 1) {
				if (keysPressed.has("w")) {
					this.viewport.moveCenter(
						this.viewport.center.x,
						this.viewport.center.y - moveDelta,
					);
				} else if (keysPressed.has("s")) {
					this.viewport.moveCenter(
						this.viewport.center.x,
						this.viewport.center.y + moveDelta,
					);
				} else if (keysPressed.has("a")) {
					this.viewport.moveCenter(
						this.viewport.center.x - moveDelta,
						this.viewport.center.y,
					);
				} else if (keysPressed.has("d")) {
					this.viewport.moveCenter(
						this.viewport.center.x + moveDelta,
						this.viewport.center.y,
					);
				}
			} else if (keysPressed.size === 2) {
				if (keysPressed.has("w") && keysPressed.has("a")) {
					this.viewport.moveCenter(
						this.viewport.center.x - moveDelta,
						this.viewport.center.y - moveDelta,
					);
				} else if (keysPressed.has("w") && keysPressed.has("d")) {
					this.viewport.moveCenter(
						this.viewport.center.x + moveDelta,
						this.viewport.center.y - moveDelta,
					);
				} else if (keysPressed.has("s") && keysPressed.has("a")) {
					this.viewport.moveCenter(
						this.viewport.center.x - moveDelta,
						this.viewport.center.y + moveDelta,
					);
				} else if (keysPressed.has("s") && keysPressed.has("d")) {
					this.viewport.moveCenter(
						this.viewport.center.x + moveDelta,
						this.viewport.center.y + moveDelta,
					);
				}
			}

			if (isMouseDown && selectionStart && selectionEnd) {
				if (!selectionBox.visible) {
					selectionBox.visible = true;
				}

				const x = Math.min(selectionStart.x, selectionEnd.x);
				const y = Math.min(selectionStart.y, selectionEnd.y);
				const width = Math.max(selectionStart.x, selectionEnd.x) - x;
				const height = Math.max(selectionStart.y, selectionEnd.y) - y;

				// Only redraw if dimensions changed
				if (selectionBox.width !== width || selectionBox.height !== height) {
					selectionBox.clear();
					selectionBox
						.rect(x, y, width, height)
						.fill({ color: 0xffffff, alpha: 0.2 })
						.stroke({
							width: 2,
							color: 0xffffff,
							alignment: 0,
							alpha: 0.5,
						});
				}
			} else if (selectionBox.visible) {
				selectionBox.visible = false;
				selectionBox.clear();
			}
		});
	}

	handleFormationMovement(
		selectedPawns: Pawn[],
		targetPosition: PositionLiteral,
		addWaypoint: boolean = false,
	) {
		console.debug(
			`Using formation movement for ${selectedPawns.length} pawns to`,
			targetPosition,
			addWaypoint ? "(adding waypoint)" : "(new path)",
		);

		// Generate formation positions around the target
		const formationPositions = this.generateFormationPositions(
			selectedPawns.length,
			targetPosition,
		);

		// Assign each pawn to the closest formation position
		const assignments = this.assignOptimalFormationPositions(
			selectedPawns,
			formationPositions,
		);
		console.log(selectedPawns);

		// Execute pathfinding for each assignment
		assignments.forEach(({ pawn, target }) => {
			let startPos: PositionLiteral;

			if (addWaypoint && pawn.$movementPaths.value.length > 0) {
				// If adding a waypoint, start from the end of the last path
				const lastPath =
					pawn.$movementPaths.value[pawn.$movementPaths.value.length - 1];
				if (lastPath && lastPath.length > 0) {
					const [lastX, lastY] = lastPath[lastPath.length - 1];
					startPos = { x: lastX, y: lastY };
				} else {
					startPos = Tilemap.positionToGrid(pawn.container.position);
				}
			} else {
				startPos = Tilemap.positionToGrid(pawn.container.position);
			}

			const path = this.tilemap.findPath(startPos, target);

			if (path.length > 0) {
				if (addWaypoint) {
					pawn.addMovementPath(path);
				} else {
					pawn.setMovementPath(path);
				}
			}
		});
	}

	// Generate formation positions in a grid pattern around the target
	private generateFormationPositions(
		count: number,
		center: PositionLiteral,
	): PositionLiteral[] {
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
			x: clamp(0, WORLD_WIDTH - 1, center.x),
			y: clamp(0, WORLD_HEIGHT - 1, center.y),
		};

		if (this.isValidFormationPosition(centerPos)) {
			positions.push(centerPos);
			_positionIndex++;
		}

		// Expand search in rings, but use spiral pattern for better obstacle avoidance
		for (let ring = 1; ring <= maxRings && positions.length < count; ring++) {
			// Get spiral positions for this ring
			const ringPositions = this.generateSpiralPositions(center, ring);

			for (const pos of ringPositions) {
				if (positions.length >= count) break;

				if (this.isValidFormationPosition(pos)) {
					// Check if this position is far enough from existing positions
					if (this.isPositionDistanced(pos, positions, 1)) {
						positions.push(pos);
					}
				}
			}
		}

		// Fill any remaining slots with closest valid positions
		if (positions.length < count) {
			this.fillRemainingPositions(positions, count, center);
		}

		return positions.slice(0, count);
	}

	// Generate positions in a spiral pattern (better for obstacle avoidance)
	private generateSpiralPositions(
		center: PositionLiteral,
		distance: number,
	): PositionLiteral[] {
		const positions: PositionLiteral[] = [];
		const steps = Math.max(8 * distance, 20); // More steps for smoother spiral

		for (let i = 0; i < steps; i++) {
			// Parametric spiral equation
			const angle = (i / steps) * Math.PI * 2;
			const d = (i / steps) * distance;

			const x = Math.round(center.x + d * Math.cos(angle));
			const y = Math.round(center.y + d * Math.sin(angle));

			const pos = {
				x: clamp(0, WORLD_WIDTH - 1, x),
				y: clamp(0, WORLD_HEIGHT - 1, y),
			};

			// Add if not already in the list
			if (!positions.some((p) => p.x === pos.x && p.y === pos.y)) {
				positions.push(pos);
			}
		}

		return positions;
	}

	// Check if a position is sufficiently distanced from existing positions
	private isPositionDistanced(
		pos: PositionLiteral,
		existingPositions: PositionLiteral[],
		minDistance: number,
	): boolean {
		for (const existing of existingPositions) {
			const dx = pos.x - existing.x;
			const dy = pos.y - existing.y;
			const distance = Math.sqrt(dx * dx + dy * dy);

			if (distance < minDistance) {
				return false;
			}
		}
		return true;
	}

	// Fill remaining positions with pathfinding if needed
	private fillRemainingPositions(
		positions: PositionLiteral[],
		targetCount: number,
		center: PositionLiteral,
	): void {
		// If we still need more positions, find them using pathfinding
		while (positions.length < targetCount) {
			// Start with the center and expand outward
			const searchGrid = this.tilemap.grid.clone();

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
					this.isValidFormationPosition(current)
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

						if (nx >= 0 && nx < WORLD_WIDTH && ny >= 0 && ny < WORLD_HEIGHT) {
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
	}

	// Check if a formation position is valid (walkable and not occupied)
	// Enhanced isValidFormationPosition to check for other pawns' destinations
	private isValidFormationPosition(
		position: PositionLiteral,
		existingPawnDestinations: Set<string> = new Set(),
	): boolean {
		// Check if position is already a target for another pawn
		const posKey = `${position.x},${position.y}`;
		if (existingPawnDestinations.has(posKey)) {
			return false;
		}

		// Basic walkable check
		if (!this.tilemap.grid.isWalkableAt(position.x, position.y)) {
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
					nx >= WORLD_WIDTH ||
					ny < 0 ||
					ny >= WORLD_HEIGHT ||
					!this.tilemap.grid.isWalkableAt(nx, ny)
				) {
					blockedNeighbors++;
				}
			}
		}

		// If too many neighbors are blocked, this position is too constrained
		return blockedNeighbors <= 6;
	}

	// Handle movement for a single pawn with destination checking
	private handleSinglePawnMovement(
		pawn: Pawn,
		targetPosition: PositionLiteral,
		addWaypoint: boolean,
		existingPawnDestinations: Set<string>,
	) {
		let startPos: PositionLiteral;

		if (addWaypoint && pawn.$movementPaths.value.length > 0) {
			// If adding a waypoint, start from the end of the last path
			const lastPath =
				pawn.$movementPaths.value[pawn.$movementPaths.value.length - 1];
			if (lastPath && lastPath.length > 0) {
				const [lastX, lastY] = lastPath[lastPath.length - 1];
				startPos = { x: lastX, y: lastY };
			} else {
				startPos = Tilemap.positionToGrid(pawn.container.position);
			}
		} else {
			startPos = Tilemap.positionToGrid(pawn.container.position);
		}

		// Check if target is valid
		const targetKey = `${targetPosition.x},${targetPosition.y}`;
		const validTarget =
			this.tilemap.grid.isWalkableAt(targetPosition.x, targetPosition.y) &&
			!existingPawnDestinations.has(targetKey);

		// Try to find a path to the target
		let path: number[][] = [];

		if (validTarget) {
			path = this.tilemap.findPath(startPos, targetPosition);
		}

		// If no path or target is invalid, find closest valid position
		if (path.length === 0 || !validTarget) {
			const closestPos = this.findClosestWalkablePosition(
				targetPosition,
				existingPawnDestinations,
			)[0];

			path = this.tilemap.findPath(startPos, closestPos);
		}

		if (path.length > 0) {
			if (addWaypoint) {
				pawn.addMovementPath(path);
			} else {
				pawn.setMovementPath(path);
			}
		}
	}

	// Find the closest walkable position that isn't already a destination
	private findClosestWalkablePosition(
		target: PositionLiteral,
		existingPawnDestinations: Set<string>,
	): PositionLiteral[] {
		// If target is already walkable and not a destination, return it immediately
		const targetKey = `${target.x},${target.y}`;
		if (
			this.tilemap.grid.isWalkableAt(target.x, target.y) &&
			!existingPawnDestinations.has(targetKey)
		) {
			return [target];
		}

		const visited = new Set<string>();
		const queue: [number, number, number][] = [[target.x, target.y, 0]]; // [x, y, distance]

		while (queue.length > 0) {
			// Sort by distance to ensure we find the closest walkable tile
			queue.sort((a, b) => a[2] - b[2]);

			const [x, y, dist] = queue.shift()!;
			const key = `${x},${y}`;

			if (visited.has(key)) continue;
			visited.add(key);

			// If this position is walkable and not already a destination, return it
			if (
				this.tilemap.grid.isWalkableAt(x, y) &&
				!existingPawnDestinations.has(key)
			) {
				return [{ x, y }];
			}

			// Add neighbors to queue
			for (let dx = -1; dx <= 1; dx++) {
				for (let dy = -1; dy <= 1; dy++) {
					const nx = x + dx;
					const ny = y + dy;

					if (nx >= 0 && nx < WORLD_WIDTH && ny >= 0 && ny < WORLD_HEIGHT) {
						const newDist = dist + (dx !== 0 && dy !== 0 ? Math.SQRT2 : 1);
						queue.push([nx, ny, newDist]);
					}
				}
			}
		}

		// Fallback - if all nearby positions are taken, just use the target
		// This is unlikely to happen unless the map is extremely crowded
		return [
			{
				x: clamp(0, WORLD_WIDTH - 1, target.x),
				y: clamp(0, WORLD_HEIGHT - 1, target.y),
			},
		];
	}

	// Assign pawns to formation positions using closest-match algorithm
	private assignOptimalFormationPositions(
		selectedPawns: Pawn[],
		formationPositions: PositionLiteral[],
	): Array<{ pawn: Pawn; target: PositionLiteral }> {
		const assignments: Array<{
			pawn: Pawn;
			target: PositionLiteral;
		}> = [];

		// Create cost matrix for Hungarian algorithm
		const costMatrix: number[][] = [];

		selectedPawns.forEach((pawn) => {
			const pawnPos = Tilemap.positionToGrid(pawn.container.position);
			const costs: number[] = [];

			formationPositions.forEach((formationPos) => {
				// Calculate path length instead of just distance
				const path = this.tilemap.findPath(pawnPos, formationPos);
				const pathLength = path.length;

				// If no path is found, use a very high cost
				costs.push(pathLength > 0 ? pathLength : 1000);
			});

			costMatrix.push(costs);
		});

		// Implement a greedy assignment based on path costs
		const assignedPositions = new Set<number>();

		for (let i = 0; i < selectedPawns.length; i++) {
			const pawn = selectedPawns[i];
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
					pawn,
					target: formationPositions[bestPositionIndex],
				});
			} else {
				// Fallback: assign to first available position
				for (let j = 0; j < formationPositions.length; j++) {
					if (!assignedPositions.has(j)) {
						assignedPositions.add(j);
						assignments.push({
							pawn,
							target: formationPositions[j],
						});
						break;
					}
				}
			}
		}

		return assignments;
	}
}
