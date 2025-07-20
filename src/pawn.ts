import { computed, effect, signal } from "@preact/signals-core";
import { Container, Graphics, type Ticker } from "pixi.js";
import { CELL_SIZE } from "./config.ts";
import { Ground } from "./ground.ts";
import { HealthBar } from "./health-bar.ts";
import { Tilemap } from "./tilemap.ts";
import { MovementDirection, type PositionLiteral } from "./types.ts";

type PawnState = "working" | "drafted";

export class Pawn {
	static readonly skinColors = [
		"#e1ceba",
		"#d4b49c",
		"#c69c7d",
		"#b7845e",
		"#a86c3f",
		"#8b5e34",
		"#6e4c29",
		"#51391e",
	];

	readonly $maxHealth = signal(100);
	readonly $damage = signal(0);

	public damage(amount: number) {
		this.$damage.value += amount;

		if (this.$damage.value > this.$maxHealth.value) {
			if (this.$isDrafted.value) {
				this.undraft();
			}
		}
	}

	readonly $health = computed(() => {
		const maxHealth = this.$maxHealth.value;
		const damage = this.$damage.value;
		return maxHealth - damage;
	});

	readonly $healthStatus = computed<"alive" | "dead">(() => {
		const health = this.$health.value;
		if (health <= 0) return "dead";
		return "alive";
	});

	readonly $flowField = signal<number[][][] | null>(null);
	readonly $flowFieldTarget = signal<PositionLiteral | null>(null);
	readonly $state = signal<PawnState>("working");
	readonly $isMoving = signal(false);
	readonly $movementPaths = signal<number[][][]>([]); // Array of paths
	readonly $currentPathIndex = signal(0); // Which path we're currently on
	readonly $currentPathStepIndex = signal(0); // Which step in the current path
	readonly $direction = signal(MovementDirection.Up);
	readonly $position = signal({ x: 0, y: 0 });
	readonly $jobQueue = signal([]);
	readonly $isSelected = signal(false);

	readonly $movementSpeedBase = signal(1);
	readonly $movementSpeed = computed(() => {
		const tile = this.tilemap.getTileAtPosition(this.$position.value);

		return tile
			? Ground.groundWalkSpeedMap[tile.ground.groundType]
			: this.$movementSpeedBase.value;
	});

	readonly $hasFlowField = computed(() => this.$flowField.value !== null);
	readonly $isDrafted = computed(() => this.$state.value === "drafted");
	readonly $isWorking = computed(() => this.$state.value === "working");
	readonly $isWandering = computed(
		() => this.$state.value === "working" && this.$jobQueue.value.length === 0,
	);
	readonly $hasPath = computed(
		() =>
			this.$movementPaths.value.length > 0 &&
			this.$movementPaths.value[this.$currentPathIndex.value]?.length > 0,
	);
	readonly $isAtDestination = computed(() => {
		const paths = this.$movementPaths.value;
		const pathIndex = this.$currentPathIndex.value;
		const stepIndex = this.$currentPathStepIndex.value;

		if (pathIndex >= paths.length) return true;
		if (!paths[pathIndex]) return true;

		return (
			stepIndex >= paths[pathIndex].length && pathIndex >= paths.length - 1
		);
	});
	readonly $shouldShowPath = computed(
		() =>
			this.$isDrafted.value &&
			this.$hasPath.value &&
			!this.$isAtDestination.value,
	);
	readonly $shouldShowWeapon = computed(() => this.$isDrafted.value);

	readonly $isUnderWater = computed(() => {
		const pos = this.$position.value;
		const tile = this.tilemap.getTileAtPosition(pos);
		return tile?.ground.groundType === "water";
	});

	// PIXI objects
	public readonly container = new Container({ label: "Pawn Container" });
	private readonly graphic = Pawn.makePawnBody();
	private readonly highlight = new Graphics({ label: "pawnHighlight" })
		.rect(0, 0, CELL_SIZE, CELL_SIZE)
		.stroke({ width: 2, color: 0xffffff });
	private readonly pathGraphic = new Graphics({
		label: "pawn path",
		visible: false,
	});
	// Array to hold multiple destination graphics
	private readonly destinationGraphics: Graphics[] = [];

	private tickerCallback: (time: Ticker) => void = () => {};
	private cleanupEffects: Array<() => void> = [];
	private healthBar: HealthBar;

	constructor(
		private readonly tilemap: Tilemap,
		private readonly viewport: Container,
		private readonly ticker: Ticker,
	) {
		this.healthBar = new HealthBar(this.$health, this.container);
		this.setupInitialState();
		this.setupReactiveEffects();
		this.setupMovementLoop();
		this.setupPIXIHierarchy();
	}

	private setupInitialState() {
		// Set the initial position
		const currentGridPosition = this.tilemap.randomGridPosition("start");
		this.$position.value = {
			x: currentGridPosition.x * CELL_SIZE,
			y: currentGridPosition.y * CELL_SIZE,
		};

		// Set an initial path for working pawns
		if (this.$isWandering.value) {
			const randomEndPosition = this.tilemap.randomGridPosition("end");
			const initialPath = this.tilemap.findPath(
				currentGridPosition,
				randomEndPosition,
			);
			this.$movementPaths.value = [initialPath];
			this.$isMoving.value = true;
		}
	}

	private setupReactiveEffects() {
		// Update highlight based on selection
		this.cleanupEffects.push(
			effect(() => {
				if (this.$healthStatus.value === "dead") {
					return;
				}
				this.highlight.alpha = this.$isSelected.value ? 1 : 0;
			}),
		);

		this.cleanupEffects.push(
			effect(() => {
				if (this.$healthStatus.value === "dead") {
					return;
				}
				this.healthBar.healthBarGraphic.visible =
					this.$isSelected.value || this.$isDrafted.value;
			}),
		);

		this.cleanupEffects.push(
			effect(() => {
				if (this.$healthStatus.value === "dead") {
					// rotate pawn and place at bottom of cell
					this.container.rotation = Math.PI / 2;
					this.container.x += CELL_SIZE;
				}
			}),
		);

		this.cleanupEffects.push(
			effect(() => {
				if (this.$healthStatus.value === "dead") {
					this.$isMoving.value = false;
				}
			}),
		);

		this.cleanupEffects.push(
			effect(() => {
				const head = this.graphic.getChildByLabel("Head")!;
				const torso = this.graphic.getChildByLabel("Torso")!;
				const legs = this.graphic.getChildByLabel("Legs")!;

				if (this.$healthStatus.value === "dead") {
					torso.visible = true;
					legs.visible = true;
					return;
				}

				if (head) {
					head.y = this.$isUnderWater.value ? 4 : 0;
				}
				if (torso) {
					torso.visible = !this.$isUnderWater.value;
				}
				if (legs) {
					legs.visible = !this.$isUnderWater.value;
				}
			}),
		);

		// Update weapon visibility
		this.cleanupEffects.push(
			effect(() => {
				if (this.$healthStatus.value === "dead") {
					return;
				}

				const gun = this.graphic.getChildByLabel("Gun");
				if (gun) {
					gun.visible = this.$shouldShowWeapon.value;

					switch (this.$direction.value) {
						case "right":
							gun.scale.x = 1;
							gun.rotation = Pawn.DEFAULT_GUN_ROTATION;
							break;
						case "left":
							gun.scale.x *= -1;
							gun.rotation = Pawn.DEFAULT_GUN_ROTATION * -1;
							break;
						case "up-right":
							gun.rotation = Pawn.DEFAULT_GUN_ROTATION;
							gun.rotation = -Math.PI / 6;
							break;
						case "up-left":
							if (gun.scale.x !== -1) {
								gun.rotation = Pawn.DEFAULT_GUN_ROTATION * -1;
								gun.scale.x *= -1;
							}
							gun.rotation = Pawn.DEFAULT_GUN_ROTATION * -1;
							gun.rotation = Math.PI / 6;
							break;
						case "down-left":
							if (gun.scale.x !== -1) {
								gun.rotation = Pawn.DEFAULT_GUN_ROTATION * -1;
								gun.scale.x *= -1;
							}
							gun.rotation = Pawn.DEFAULT_GUN_ROTATION * -1;
							gun.rotation = -Math.PI / 6;
							break;
						case "down-right":
							gun.rotation = Pawn.DEFAULT_GUN_ROTATION;
							gun.rotation = Math.PI / 6;
							break;
						default:
							gun.scale.x = 1;
							gun.rotation = Pawn.DEFAULT_GUN_ROTATION;
							break;
					}
				}
			}),
		);

		// Update eye placement
		this.cleanupEffects.push(
			effect(() => {
				const head = this.graphic.getChildByLabel("Head");
				const leftEye = head?.getChildByLabel("Left Eye")!;
				const rightEye = head?.getChildByLabel("Right Eye")!;
				const deadEyes = head?.getChildByLabel("Dead Eyes")!;

				if (this.$healthStatus.value === "dead") {
					deadEyes.visible = true;
					leftEye.visible = false;
					rightEye.visible = false;

					return;
				}

				const direction = this.$direction.value;
				if (leftEye && rightEye) {
					if (this.$isDrafted.value) {
						leftEye.position.set(0, 0);
						rightEye.position.set(0, 0);
					} else if (direction.includes("right")) {
						leftEye.position.set(CELL_SIZE / 5, 0);
						rightEye.position.set(0, 0);
					} else if (direction.includes("left")) {
						rightEye.position.set(-CELL_SIZE / 5, 0);
						leftEye.position.set(0, 0);
					} else {
						leftEye.position.set(0, 0);
						rightEye.position.set(0, 0);
					}
				}
			}),
		);

		// Update path visibility
		this.cleanupEffects.push(
			effect(() => {
				// heal
			}),
		);

		// Update path visibility
		this.cleanupEffects.push(
			effect(() => {
				if (this.$healthStatus.value === "dead") {
					return;
				}

				if (this.$shouldShowPath.value) {
					this.updatePathGraphics();
				} else {
					this.hidePath();
				}
			}),
		);

		// Update container position
		this.cleanupEffects.push(
			effect(() => {
				if (this.$healthStatus.value === "dead") {
					return;
				}

				const pos = this.$position.value;
				this.container.position.set(pos.x, pos.y);
			}),
		);

		// Handle state transitions
		this.cleanupEffects.push(
			effect(() => {
				const state = this.$state.value;

				if (state === "working" && !this.$hasPath.value) {
					// Working pawns should always have a path
					this.generateNewWorkingPath();
				}
			}),
		);
	}

	private setupMovementLoop() {
		this.tickerCallback = (time) => {
			if (!this.$isMoving.value || !this.$hasPath.value) {
				this.handleDestinationReached();
				return;
			}

			const paths = this.$movementPaths.value;
			const pathIndex = this.$currentPathIndex.value;
			const stepIndex = this.$currentPathStepIndex.value;

			if (pathIndex >= paths.length) {
				this.handleDestinationReached();
				return;
			}

			const currentPath = paths[pathIndex];
			if (!currentPath || stepIndex >= currentPath.length) {
				// Move to next path
				this.$currentPathIndex.value += 1;
				this.$currentPathStepIndex.value = 0;
				return;
			}

			this.updateMovement(time, currentPath[stepIndex]);
		};

		this.ticker.add(this.tickerCallback);
	}

	private updateMovement(time: Ticker, targetGrid?: number[]) {
		if (
			this.$hasFlowField.value &&
			this.$flowField.value &&
			this.$flowFieldTarget.value
		) {
			this.updateFlowFieldMovement(time);
			return;
		}

		if (!targetGrid) return;

		const [nextX, nextY] = targetGrid;
		const targetX = nextX * CELL_SIZE;
		const targetY = nextY * CELL_SIZE;

		this.tilemap.grid.setWalkableAt(nextX, nextY, true);

		const currentPos = this.$position.value;
		const dx = targetX - currentPos.x;
		const dy = targetY - currentPos.y;
		const distance = Math.sqrt(dx * dx + dy * dy);

		this.updateDirection();

		if (distance < 2) {
			this.$position.value = { x: targetX, y: targetY };
			this.$currentPathStepIndex.value += 1;
		} else {
			const gameSpeed =
				time.speed *
				this.$movementSpeed.value *
				(this.$isWandering.value ? 2 : 4);
			const moveDistance = Math.min(gameSpeed * time.deltaTime, distance);

			const dirX = dx / distance;
			const dirY = dy / distance;

			this.$position.value = {
				x: currentPos.x + dirX * moveDistance,
				y: currentPos.y + dirY * moveDistance,
			};
		}
	}

	private updateFlowFieldMovement(time: Ticker) {
		const flowField = this.$flowField.value!;
		const target = this.$flowFieldTarget.value!;
		const currentPos = this.$position.value;

		// Check if we've reached the target area
		const targetPixel = Tilemap.gridToPosition(target);
		const distanceToTarget = Math.sqrt(
			(currentPos.x - targetPixel.x) ** 2 + (currentPos.y - targetPixel.y) ** 2,
		);

		if (distanceToTarget < CELL_SIZE * 2) {
			// Close enough to target, stop moving
			this.handleDestinationReached();
			return;
		}

		// Get flow direction at current position
		const [flowX, flowY] = this.tilemap.getFlowDirection(flowField, currentPos);

		if (flowX === 0 && flowY === 0) {
			// No flow direction, we might be stuck
			this.handleDestinationReached();

			return;
		}

		// Move in flow direction
		const gameSpeed = time.speed * (this.$isWandering.value ? 2 : 4);
		const moveDistance = gameSpeed * time.deltaTime;

		this.$position.value = {
			x: currentPos.x + flowX * moveDistance,
			y: currentPos.y + flowY * moveDistance,
		};

		// Update direction for animation
		this.updateFlowDirection(flowX, flowY);
	}

	private updateFlowDirection(flowX: number, flowY: number) {
		if (Math.abs(flowX) < 0.1 && Math.abs(flowY) < 0.1) {
			this.$direction.value = MovementDirection.Down;
			return;
		}

		const angle = Math.atan2(flowY, flowX);
		const degree = (angle * 180) / Math.PI;

		// Convert angle to movement direction
		if (degree >= -22.5 && degree < 22.5) {
			this.$direction.value = MovementDirection.Right;
		} else if (degree >= 22.5 && degree < 67.5) {
			this.$direction.value = MovementDirection.DownRight;
		} else if (degree >= 67.5 && degree < 112.5) {
			this.$direction.value = MovementDirection.Down;
		} else if (degree >= 112.5 && degree < 157.5) {
			this.$direction.value = MovementDirection.DownLeft;
		} else if (degree >= 157.5 || degree < -157.5) {
			this.$direction.value = MovementDirection.Left;
		} else if (degree >= -157.5 && degree < -112.5) {
			this.$direction.value = MovementDirection.UpLeft;
		} else if (degree >= -112.5 && degree < -67.5) {
			this.$direction.value = MovementDirection.Up;
		} else if (degree >= -67.5 && degree < -22.5) {
			this.$direction.value = MovementDirection.UpRight;
		}
	}

	private handleDestinationReached() {
		// Set each path we moved as walkable
		const paths = this.$movementPaths.value;
		if (paths.length === 0) return;

		for (const path of paths) {
			for (let i = 0; i < path.length; i++) {
				const [x, y] = path[i];
				this.tilemap.grid.setWalkableAt(x, y, true);
			}
		}

		this.$isMoving.value = false;
		this.$currentPathIndex.value = 0;
		this.$currentPathStepIndex.value = 0;
		this.$flowField.value = null;
		this.$flowFieldTarget.value = null;
		this.$movementPaths.value = [];

		if (this.$isWandering.value) {
			setTimeout(() => this.generateNewWorkingPath(), 1000);
		} else {
			this.hidePath();
		}
	}

	private generateNewWorkingPath() {
		if (!this.$isWorking.value) return;

		const currentGrid = {
			x: Math.round(this.$position.value.x / CELL_SIZE),
			y: Math.round(this.$position.value.y / CELL_SIZE),
		};

		const newTarget = this.tilemap.randomGridPosition("end");
		const newPath = this.tilemap.findPath(currentGrid, newTarget);

		if (newPath.length > 0) {
			this.$movementPaths.value = [newPath];
			this.$currentPathIndex.value = 0;
			this.$currentPathStepIndex.value = 0;
			this.$isMoving.value = true;
		}
	}

	private updateDirection() {
		const paths = this.$movementPaths.value;
		const pathIndex = this.$currentPathIndex.value;
		const stepIndex = this.$currentPathStepIndex.value;

		if (pathIndex >= paths.length || !paths[pathIndex]) {
			this.$direction.value = MovementDirection.Down;
			return;
		}

		const currentPath = paths[pathIndex];
		if (stepIndex === 0 || stepIndex >= currentPath.length) {
			this.$direction.value = MovementDirection.Down;
			return;
		}

		const [prevX, prevY] = currentPath[stepIndex - 1];
		const [nextX, nextY] = currentPath[stepIndex];
		const xDiff = nextX - prevX;
		const yDiff = nextY - prevY;

		if (xDiff === 0 && yDiff === 1) {
			this.$direction.value = MovementDirection.Down;
		} else if (xDiff === 1 && yDiff === 1) {
			this.$direction.value = MovementDirection.DownRight;
		} else if (xDiff === 1 && yDiff === 0) {
			this.$direction.value = MovementDirection.Right;
		} else if (xDiff === 1 && yDiff === -1) {
			this.$direction.value = MovementDirection.UpRight;
		} else if (xDiff === 0 && yDiff === -1) {
			this.$direction.value = MovementDirection.Up;
		} else if (xDiff === -1 && yDiff === -1) {
			this.$direction.value = MovementDirection.UpLeft;
		} else if (xDiff === -1 && yDiff === 0) {
			this.$direction.value = MovementDirection.Left;
		} else if (xDiff === -1 && yDiff === 1) {
			this.$direction.value = MovementDirection.DownLeft;
		}
	}

	// Public methods for path manipulation
	setMovementPath(path: number[][]) {
		this.$movementPaths.value = [path];
		this.$currentPathIndex.value = 0;
		this.$currentPathStepIndex.value = 0;
		this.$isMoving.value = path.length > 0;
	}

	addMovementPath(path: number[][]) {
		if (path.length === 0) return;

		const currentPaths = this.$movementPaths.value;
		this.$movementPaths.value = [...currentPaths, path];

		// If not currently moving, start moving
		if (!this.$isMoving.value) {
			this.$currentPathIndex.value = 0;
			this.$currentPathStepIndex.value = 0;
			this.$isMoving.value = true;
		}
	}

	clearMovementPaths() {
		this.$movementPaths.value = [];
		this.$currentPathIndex.value = 0;
		this.$currentPathStepIndex.value = 0;
		this.$isMoving.value = false;
	}

	private createDestinationGraphic(pathIndex: number): Graphics {
		const isCurrentPath = pathIndex === this.$currentPathIndex.value;
		const isFinalDestination =
			pathIndex === this.$movementPaths.value.length - 1;

		let graphic: Graphics;

		if (isFinalDestination) {
			// Final destination - larger, more prominent
			graphic = new Graphics({
				label: `destination-final-${pathIndex}`,
				alpha: 0.8,
			})
				.circle(CELL_SIZE / 2, CELL_SIZE / 2, CELL_SIZE * 0.4)
				.stroke({ width: 3, color: 0xffffff, alpha: 0.8 })
				.circle(CELL_SIZE / 2, CELL_SIZE / 2, CELL_SIZE * 0.25)
				.fill({ color: 0xffffff, alpha: 0.3 });
		} else {
			// Waypoint - smaller, numbered
			const waypointNumber = pathIndex + 1;
			graphic = new Graphics({
				label: `destination-waypoint-${pathIndex}`,
				alpha: isCurrentPath ? 0.8 : 0.5,
			})
				.circle(CELL_SIZE / 2, CELL_SIZE / 2, CELL_SIZE * 0.3)
				.stroke({
					width: 2,
					color: isCurrentPath ? 0xffff00 : 0xaaaaaa,
					alpha: isCurrentPath ? 0.8 : 0.5,
				})
				.circle(CELL_SIZE / 2, CELL_SIZE / 2, CELL_SIZE * 0.2)
				.fill({
					color: isCurrentPath ? 0xffff00 : 0xaaaaaa,
					alpha: 0.3,
				});

			// Add number text for waypoints (simplified representation with a small dot pattern)
			// Since we can't easily add text in PIXI Graphics, we'll use a visual pattern
			const dotSize = CELL_SIZE * 0.03;
			const centerX = CELL_SIZE / 2;
			const centerY = CELL_SIZE / 2;

			// Create a simple dot pattern to represent the waypoint number
			for (let i = 0; i < Math.min(waypointNumber, 4); i++) {
				const angle = (i * Math.PI * 2) / 4;
				const radius = CELL_SIZE * 0.1;
				const dotX = centerX + Math.cos(angle) * radius;
				const dotY = centerY + Math.sin(angle) * radius;

				graphic
					.circle(dotX, dotY, dotSize)
					.fill({ color: isCurrentPath ? 0x000000 : 0x666666, alpha: 0.8 });
			}
		}

		return graphic;
	}

	private updateDestinationGraphics() {
		// Clear existing destination graphics
		this.destinationGraphics.forEach((graphic) => {
			if (graphic.parent) {
				graphic.parent.removeChild(graphic);
			}
			graphic.destroy();
		});
		this.destinationGraphics.length = 0;

		const paths = this.$movementPaths.value;
		if (!this.$isDrafted.value || paths.length === 0) {
			return;
		}

		// Create destination graphics for each path
		paths.forEach((path, pathIndex) => {
			if (path.length === 0) return;

			const [endX, endY] = path[path.length - 1];
			const pos = Tilemap.gridToPosition({ x: endX, y: endY });

			const destinationGraphic = this.createDestinationGraphic(pathIndex);
			destinationGraphic.position.set(pos.x, pos.y);

			this.viewport.addChild(destinationGraphic);
			this.destinationGraphics.push(destinationGraphic);
		});
	}

	private updatePathGraphics() {
		const paths = this.$movementPaths.value;
		if (paths.length === 0) {
			this.hidePath();
			return;
		}

		this.pathGraphic.clear();
		this.pathGraphic.visible = true;

		// Draw all paths with different colors/styles
		paths.forEach((path, pathIndex) => {
			if (path.length === 0) return;

			// Use different alpha/color for different paths
			const isCurrentPath = pathIndex === this.$currentPathIndex.value;
			const isCompletedPath = pathIndex < this.$currentPathIndex.value;

			let alpha: number;
			let color: number;
			let width: number;

			if (isCompletedPath) {
				// Completed paths - very faded
				alpha = 0.2;
				color = 0x666666;
				width = 1;
			} else if (isCurrentPath) {
				// Current path - bright and prominent
				alpha = 0.8;
				color = 0xffffff;
				width = 3;
			} else {
				// Future paths - medium visibility
				alpha = 0.5;
				color = 0xaaaaaa;
				width = 2;
			}

			// Only draw the part of the path that hasn't been traversed yet
			const startIndex = isCurrentPath ? this.$currentPathStepIndex.value : 0;

			if (startIndex >= path.length) return; // Skip if entire path has been traversed

			// Move to the current position on the path
			this.pathGraphic.moveTo(
				path[startIndex][0] * CELL_SIZE + CELL_SIZE / 2,
				path[startIndex][1] * CELL_SIZE + CELL_SIZE / 2,
			);

			// Draw lines only for the remaining steps
			for (let i = startIndex; i < path.length; i++) {
				const [x, y] = path[i];
				this.pathGraphic.lineTo(
					x * CELL_SIZE + CELL_SIZE / 2,
					y * CELL_SIZE + CELL_SIZE / 2,
				);
			}

			this.pathGraphic.stroke({
				color,
				width,
				alpha,
				pixelLine: true,
			});
		});

		// Update destination graphics
		this.updateDestinationGraphics();
	}

	private hidePath() {
		this.pathGraphic.visible = false;
		this.pathGraphic.clear();

		// Hide all destination graphics
		this.destinationGraphics.forEach((graphic) => {
			if (graphic.parent) {
				graphic.parent.removeChild(graphic);
			}
			graphic.destroy();
		});
		this.destinationGraphics.length = 0;
	}

	private setupPIXIHierarchy() {
		this.highlight.alpha = 0;

		this.viewport.addChild(this.container);
		this.viewport.addChild(this.pathGraphic);
		this.container.addChild(this.graphic);
		this.container.addChild(this.highlight);

		// Set initial position
		const pos = this.$position.value;
		this.container.position.set(pos.x, pos.y);

		this.container.interactive = true;
		this.container.on("click", () => {
			if (!this.$isDrafted.value) {
				this.setSelected(!this.$isSelected.value);
			}
		});
	}

	static generateSkinColor() {
		return Pawn.skinColors[Math.floor(Math.random() * Pawn.skinColors.length)];
	}

	static readonly DEFAULT_GUN_ROTATION = 0.2;

	static makePawnBody() {
		const container = new Container({ label: "Body" });

		const torsoContainer = container.addChild(
			new Container({ label: "Torso" }),
		);
		const skinColor = Pawn.generateSkinColor();
		torsoContainer.addChild(
			new Graphics({ label: "Torso" })
				.ellipse(
					CELL_SIZE / 2,
					CELL_SIZE / 1.8,
					CELL_SIZE / 3.5,
					CELL_SIZE / 2.5,
				)
				.fill(skinColor)
				.stroke({ width: 2, color: 0x000000 }),
		);

		const shirtMask = torsoContainer.addChild(
			new Graphics({ label: "Shirt Mask" })
				.ellipse(CELL_SIZE / 2, CELL_SIZE / 2, CELL_SIZE / 2, CELL_SIZE / 4)
				.fill("#000000")
				.stroke({ width: 2, color: 0x000000 }),
		);

		const shirt = torsoContainer.addChild(
			new Graphics({ label: "Shirt" })
				.ellipse(
					CELL_SIZE / 2,
					CELL_SIZE / 1.8,
					CELL_SIZE / 3.5,
					CELL_SIZE / 2.5,
				)
				.fill("#0cbfff")
				.stroke({ width: 2, color: 0x000000 }),
		);
		shirt.position.set(0, 0);
		shirt.mask = shirtMask;

		const legsContainer = container.addChild(new Container({ label: "Legs" }));
		legsContainer.position.set(0, 0);

		const pantsMask = legsContainer.addChild(
			new Graphics({ label: "Pants Mask" })
				.rect(0, CELL_SIZE * 0.7, CELL_SIZE, CELL_SIZE / 2)
				.fill("transparent"),
		);
		const pants = legsContainer.addChild(
			new Graphics({ label: "Pants" })
				.ellipse(
					CELL_SIZE / 2,
					CELL_SIZE / 1.8,
					CELL_SIZE / 3.5,
					CELL_SIZE / 2.5,
				)
				.fill(0x0000ff)
				.stroke({ width: 2, color: 0x000000 }),
		);
		pants.position.set(0, 0);
		pants.mask = pantsMask;

		const headContainer = container.addChild(new Container({ label: "Head" }));
		headContainer.addChild(
			new Graphics({ label: "Head" })
				.circle(CELL_SIZE / 2, CELL_SIZE / 3.5, CELL_SIZE / 4)
				.fill(skinColor)
				.stroke({ width: 2, color: 0x000000 }),
		);

		// Eyes
		const crossSizeInPixels = 3;
		const deadEyes = headContainer.addChild(
			new Container({ label: "Dead Eyes", visible: false }),
		);
		const deadLeftEye = deadEyes.addChild(new Graphics());
		deadLeftEye
			.lineTo(crossSizeInPixels, crossSizeInPixels)
			.moveTo(crossSizeInPixels, 0)
			.lineTo(crossSizeInPixels, 0)
			.moveTo(0, crossSizeInPixels)
			.lineTo(crossSizeInPixels, 0)
			.stroke({ width: 1, color: "black" });
		deadLeftEye.position.set(CELL_SIZE / 2 - CELL_SIZE / 8, CELL_SIZE / 4);

		const deadRightEye = deadEyes.addChild(new Graphics());
		deadRightEye
			.lineTo(crossSizeInPixels, crossSizeInPixels)
			.moveTo(crossSizeInPixels, 0)
			.lineTo(crossSizeInPixels, 0)
			.moveTo(0, crossSizeInPixels)
			.lineTo(crossSizeInPixels, 0)
			.stroke({ width: 1, color: "black" });
		deadRightEye.position.set(CELL_SIZE / 2, CELL_SIZE / 4);

		const leftEye = headContainer.addChild(
			new Graphics({ label: "Left Eye" })
				.circle(CELL_SIZE / 2 - CELL_SIZE / 16, CELL_SIZE / 4, CELL_SIZE / 24)
				.fill(0x000000),
		);
		leftEye.position.set(0, 0);

		headContainer.addChild(
			new Graphics({ label: "Right Eye" })
				.circle(CELL_SIZE / 2 + CELL_SIZE / 16, CELL_SIZE / 4, CELL_SIZE / 24)
				.fill(0x000000),
		);

		const gunHeight = CELL_SIZE / 6;
		const gunWidth = CELL_SIZE;
		const gunStartX = CELL_SIZE / 2;
		const gunStartY = CELL_SIZE / 2;
		const gunGraphic = container.addChild(
			new Graphics({ label: "Gun", visible: false })
				.poly([
					// Grip
					gunStartX - gunHeight / 4,
					gunStartY,
					gunStartX + gunHeight / 4,
					gunStartY,
					gunStartX + gunHeight / 4,
					gunStartY + gunHeight,
					gunStartX - gunHeight / 4,
					gunStartY + gunHeight,
					// Barrel
					gunStartX - gunHeight / 4,
					gunStartY,
					gunStartX - gunHeight / 4,
					gunStartY - gunHeight / 4,
					gunStartX + gunWidth / 2,
					gunStartY - gunHeight / 4,
					gunStartX + gunWidth / 2,
					gunStartY,
				])
				.fill(0x000000)
				.stroke({ width: 2, color: 0x000000 }),
		);
		// Set pivot point to center for proper rotation
		gunGraphic.pivot.set(gunStartX, gunStartY);

		// Position relative to a container center
		gunGraphic.position.set(CELL_SIZE / 2, CELL_SIZE / 2);
		gunGraphic.rotation = Pawn.DEFAULT_GUN_ROTATION;

		const BASE_GUN_RANGE = 5;
		const gunRadiusGraphic = container.addChild(
			new Graphics({ alpha: 0.25, label: "Gun Radius" })
				.circle(CELL_SIZE / 2, CELL_SIZE / 2, CELL_SIZE * BASE_GUN_RANGE)
				.stroke({ width: 2, color: 0xffffff }),
		);
		gunRadiusGraphic.visible = false;

		return container;
	}

	// ... rest of the existing methods (setSelected, toggleSelected, etc.)
	setSelected(selected: boolean) {
		this.$isSelected.value = selected;
	}

	toggleSelected() {
		this.$isSelected.value = !this.$isSelected.value;
	}

	draft() {
		this.$state.value = "drafted";
		this.clearMovementPaths(); // Clear any existing movement when drafted
	}

	undraft() {
		this.$state.value = "working";
		this.clearMovementPaths(); // Clear drafted movement paths
	}

	// Cleanup method to call when pawn is destroyed
	destroy() {
		// Clean up reactive effects
		this.cleanupEffects.forEach((cleanup) => cleanup());
		this.cleanupEffects.length = 0;

		// Clean up destination graphics
		this.destinationGraphics.forEach((graphic) => {
			if (graphic.parent) {
				graphic.parent.removeChild(graphic);
			}
			graphic.destroy();
		});
		this.destinationGraphics.length = 0;

		// Remove ticker callback
		if (this.tickerCallback) {
			this.ticker.remove(this.tickerCallback);
		}

		// Clean up PIXI objects
		if (this.container.parent) {
			this.container.parent.removeChild(this.container);
		}
		if (this.pathGraphic.parent) {
			this.pathGraphic.parent.removeChild(this.pathGraphic);
		}

		this.container.destroy();
		this.pathGraphic.destroy();
	}
}
