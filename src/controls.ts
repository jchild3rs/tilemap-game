import { Graphics, type Ticker, UPDATE_PRIORITY } from "pixi.js";
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
import { clamp } from "./utils.ts";

export class Controls {
	static pausedStartTimestamp = 0;
	static pausedEndTimestamp = 0;
	static pausedTime = 0;

	handleFormationMovement(
		selectedPawns: Pawn[],
		targetPosition: PositionLiteral,
		addWaypoint: boolean = false,
	) {
		console.log(
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

		// Execute pathfinding for each assignment
		assignments.forEach(({ pawn, target }) => {
			let startPos: PositionLiteral;

			if (addWaypoint && pawn.$movementPaths.value.length > 0) {
				// If adding a waypoint, start from the end of the last path
				const lastPath = pawn.$movementPaths.value[pawn.$movementPaths.value.length - 1];
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

	handleSinglePawnMovement(
		pawn: Pawn,
		targetPosition: PositionLiteral,
		addWaypoint: boolean = false,
	) {
		let startPos: PositionLiteral;

		if (addWaypoint && pawn.$movementPaths.value.length > 0) {
			// If adding a waypoint, start from the end of the last path
			const lastPath = pawn.$movementPaths.value[pawn.$movementPaths.value.length - 1];
			if (lastPath && lastPath.length > 0) {
				const [lastX, lastY] = lastPath[lastPath.length - 1];
				startPos = { x: lastX, y: lastY };
			} else {
				startPos = Tilemap.positionToGrid(pawn.container.position);
			}
		} else {
			startPos = Tilemap.positionToGrid(pawn.container.position);
		}

		const path = this.tilemap.findPath(startPos, targetPosition);

		if (path.length > 0) {
			if (addWaypoint) {
				pawn.addMovementPath(path);
			} else {
				pawn.setMovementPath(path);
			}
		}
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

		// Calculate grid size for formation
		const gridSize = Math.ceil(Math.sqrt(count));
		const halfGrid = Math.floor(gridSize / 2);

		let positionIndex = 0;

		// Generate positions in expanding rings around the center
		for (let ring = 0; ring <= halfGrid && positionIndex < count; ring++) {
			if (ring === 0) {
				// Center position
				const pos = {
					x: clamp(0, WORLD_WIDTH - 1, center.x),
					y: clamp(0, WORLD_HEIGHT - 1, center.y),
				};

				if (this.isValidFormationPosition(pos)) {
					positions.push(pos);
					positionIndex++;
				}
			} else {
				// Ring positions
				const ringPositions = this.generateRingPositions(center, ring);

				for (const pos of ringPositions) {
					if (positionIndex >= count) break;

					if (this.isValidFormationPosition(pos)) {
						positions.push(pos);
						positionIndex++;
					}
				}
			}
		}

		// If we still need more positions, add them in a simple grid
		while (positions.length < count) {
			const fallbackPos = {
				x: clamp(0, WORLD_WIDTH - 1, center.x + (positions.length % 3) - 1),
				y: clamp(
					0,
					WORLD_HEIGHT - 1,
					center.y + Math.floor(positions.length / 3),
				),
			};

			if (this.isValidFormationPosition(fallbackPos)) {
				positions.push(fallbackPos);
			} else {
				// If even fallback fails, just use the center
				positions.push(center);
			}
		}

		return positions.slice(0, count);
	}

	// Generate positions in a ring around the center
	private generateRingPositions(
		center: PositionLiteral,
		ring: number,
	): PositionLiteral[] {
		const positions: PositionLiteral[] = [];
		const radius = ring;

		// Generate positions on the ring perimeter
		for (let x = -radius; x <= radius; x++) {
			for (let y = -radius; y <= radius; y++) {
				// Only positions on the ring edge
				if (Math.abs(x) === radius || Math.abs(y) === radius) {
					const pos = {
						x: clamp(0, WORLD_WIDTH - 1, center.x + x),
						y: clamp(0, WORLD_HEIGHT - 1, center.y + y),
					};
					positions.push(pos);
				}
			}
		}

		return positions;
	}

	// Check if a formation position is valid (walkable and not occupied)
	private isValidFormationPosition(position: PositionLiteral): boolean {
		// Check if position is walkable
		if (!this.tilemap.grid.isWalkableAt(position.x, position.y)) {
			return false;
		}

		// Could add additional checks here:
		// - Check if position is already occupied by another unit
		// - Check if position is too close to obstacles
		// - Check if position has enough space around it

		return true;
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

		// Create a copy of positions to work with
		const availablePositions = [...formationPositions];
		const unassignedPawns = [...selectedPawns];

		// Greedy assignment: repeatedly assign the closest pawn-position pair
		while (unassignedPawns.length > 0 && availablePositions.length > 0) {
			let bestDistance = Infinity;
			let bestPawnIndex = -1;
			let bestPositionIndex = -1;

			// Find the closest pawn-position pair
			unassignedPawns.forEach((pawn, pawnIndex) => {
				const pawnPos = Tilemap.positionToGrid(pawn.container.position);

				availablePositions.forEach((formationPos, posIndex) => {
					const dx = pawnPos.x - formationPos.x;
					const dy = pawnPos.y - formationPos.y;
					const distance = Math.sqrt(dx * dx + dy * dy);

					if (distance < bestDistance) {
						bestDistance = distance;
						bestPawnIndex = pawnIndex;
						bestPositionIndex = posIndex;
					}
				});
			});

			if (bestPawnIndex !== -1 && bestPositionIndex !== -1) {
				// Make the assignment
				assignments.push({
					pawn: unassignedPawns[bestPawnIndex],
					target: availablePositions[bestPositionIndex],
				});

				// Remove assigned pawn and position
				unassignedPawns.splice(bestPawnIndex, 1);
				availablePositions.splice(bestPositionIndex, 1);
			} else {
				// Safety break if no valid assignment found
				break;
			}
		}

		// Handle any remaining unassigned pawns (fallback to center)
		if (unassignedPawns.length > 0 && formationPositions.length > 0) {
			const fallbackTarget = formationPositions[0]; // Use first formation position as fallback

			unassignedPawns.forEach((pawn) => {
				assignments.push({
					pawn: pawn,
					target: fallbackTarget,
				});
			});
		}

		return assignments;
	}

	constructor(
		readonly viewport: Viewport,
		readonly tilemap: Tilemap,
		readonly ticker: Ticker,
		readonly uiTicker: Ticker,
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
			const clickedTileHasPawnAlready =
				this.gameState.hasPawnAtPosition(clickedGridPosition);

			if (isRightClick) {
				const selected = this.gameState.getSelectedPawns();
				const event = e.event as unknown as MouseEvent;
				const addWaypoint = event.shiftKey; // Check if shift is held

				if (clickedTileHasPawnAlready && selected.length === 1) {
					return;
				}

				if (selected.length > 1) {
					this.handleFormationMovement(selected, clickedGridPosition, addWaypoint);
				} else if (selected.length === 1) {
					this.handleSinglePawnMovement(selected[0], clickedGridPosition, addWaypoint);
				}

				isRightClick = false;
				return;
			}

			const event = e.event as unknown as MouseEvent;
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
				clickedPawn?.toggleSelected()
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
					this.uiTicker.speed = previousSpeed;
					// this.ticker.start();
					previousSpeed = null;
					Controls.pausedEndTimestamp = Date.now();
					Controls.pausedTime +=
						Controls.pausedEndTimestamp - Controls.pausedStartTimestamp;
					Controls.pausedStartTimestamp = 0;
					Controls.pausedEndTimestamp = 0;
				} else {
					// this.ticker.stop();
					Controls.pausedStartTimestamp = Date.now();
					previousSpeed = this.uiTicker.speed;
					this.uiTicker.speed = 0;
				}
			} else if (key === "1") {
				this.uiTicker.speed = GAME_SPEED_SLOW;
				this.gameState.setGameSpeed(GAME_SPEED_SLOW);
			} else if (key === "2") {
				this.uiTicker.speed = GAME_SPEED_NORMAL;
				this.gameState.setGameSpeed(GAME_SPEED_NORMAL);
			} else if (key === "3") {
				this.uiTicker.speed = GAME_SPEED_FAST;
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
						pawn.undraft()
						continue;
					}

					if (pawn.$isDrafted.value && !selectedHasMixedState) {
						pawn.undraft()
					} else {
						pawn.draft()
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

		this.ticker.add(
			(time) => {
				this.gameState.setElapsedTime(time.lastTime - Controls.pausedTime);
				this.gameState.setGameSpeed(time.speed);
				this.gameState.setFPS(time.FPS);

				// Update game time (accumulates with speed scaling)
				this.gameState.updateGameTime(time.deltaTime * (1000 / 60)); // Convert to milliseconds

				if (keysPressed.size === 1) {
					if (keysPressed.has("w")) {
						console.log("w");
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
			},
			undefined,
			UPDATE_PRIORITY.INTERACTION,
		);
	}
}
