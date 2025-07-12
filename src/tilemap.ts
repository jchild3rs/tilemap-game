import { AStarFinder, DiagonalMovement, Grid, Heuristic } from "pathfinding";
import { Container, Graphics } from "pixi.js";
import type { Viewport } from "pixi-viewport";
import { CELL_SIZE, WORLD_HEIGHT, WORLD_WIDTH } from "./config.ts";
import { Ground } from "./ground.ts";
import { Tile } from "./tile.ts";
import type { PositionLiteral } from "./types.ts";
import { clamp } from "./utils.ts";

export class Tilemap {
	public readonly grid = new Grid(WORLD_WIDTH, WORLD_HEIGHT);
	public readonly tiles: Tile[][] = [];
	private readonly finder = new AStarFinder({
		diagonalMovement: DiagonalMovement.OnlyWhenNoObstacles,
		heuristic: Heuristic.manhattan,
	});
	private readonly element = new Container({ label: "Tilemap" });
	get container() {
		return this.element;
	}

	constructor(private readonly viewport: Viewport) {
		// add a background to the viewport
		this.viewport.addChild(
			new Graphics({
				label: "ViewportBackground",
				eventMode: "none",
			})
				.rect(0, 0, this.viewport.worldWidth, this.viewport.worldHeight)
				.fill(0x333333),
		);

		for (let row = 0; row < WORLD_WIDTH; row++) {
			const rowTiles: Tile[] = [];

			for (let col = 0; col < WORLD_HEIGHT; col++) {
				rowTiles.push(
					new Tile(
						this.grid.getNodeAt(row, col),
						this.element.addChild(
							new Graphics({ label: `Tile ${row},${col}` })
								.rect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE)
								.stroke({
									width: 1,
									color: 0xffffff,
									alpha: 0.1,
									// alpha: 1,
									pixelLine: true,
									alignment: 1,
								}),
						),
						Ground.makeRandomGround(),
					),
				);
			}

			this.tiles.push(rowTiles);
		}

		this.viewport.addChild(this.element);
	}

	static isWithinSelection(
		start: PositionLiteral,
		end: PositionLiteral,
		position: PositionLiteral,
	) {
		const xMin = Math.min(start.x, end.x);
		const xMax = Math.max(start.x, end.x);
		const yMin = Math.min(start.y, end.y);
		const yMax = Math.max(start.y, end.y);
		const isWithinX = position.x >= xMin && position.x <= xMax;
		const isWithinY = position.y >= yMin && position.y <= yMax;
		return isWithinX && isWithinY;
	}

	makeBlockingTile(x: number, y: number) {
		const wall = new Graphics({
			label: "wall",
			eventMode: "none",
			interactiveChildren: false,
		})
			.rect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE)
			.fill(0x222222);
		this.tiles[x][y].node.walkable = false;
		return wall;
	}

	findPath(start: PositionLiteral, end: PositionLiteral) {
		try {
			const path = this.finder.findPath(
				start.x,
				start.y,
				end.x,
				end.y,
				this.grid.clone(),
			);
			if (path.length === 0) {
				console.warn("No path found from", start, "to", end);
				return [];
			}
			return path;
		} catch (error) {
			console.error("Pathfinding error:", error);
			return [];
		}
	}

	drawPath(graphic: Graphics, endGraphic: Graphics, path: number[][]) {
		if (Array.isArray(path) && path.length > 0) {
			graphic.clear();
			graphic.alpha = 1;
			graphic.moveTo(
				path[0][0] * CELL_SIZE + CELL_SIZE / 2,
				path[0][1] * CELL_SIZE + CELL_SIZE / 2,
			);
			for (const [x, y] of path) {
				graphic.lineTo(
					x * CELL_SIZE + CELL_SIZE / 2,
					y * CELL_SIZE + CELL_SIZE / 2,
				);
			}
			graphic.stroke({
				color: 0xffffff,
				pixelLine: true,
				alpha: 0.2,
			});

			const [x, y] = path[path.length - 1];
			const pos = Tilemap.gridToPosition({ x, y });
			console.log('setting end graphic to ', pos.x, pos.y)
			endGraphic.position.set(pos.x, pos.y);
		}

		return path;
	}

	static positionToGrid({ x, y }: PositionLiteral) {
		return {
			x: clamp(0, WORLD_WIDTH - 1, Math.floor(x / CELL_SIZE)),
			y: clamp(0, WORLD_HEIGHT - 1, Math.floor(y / CELL_SIZE)),
		};
	}

	static gridToPosition({ x, y }: PositionLiteral): PositionLiteral {
		return {
			x: x * CELL_SIZE,
			y: y * CELL_SIZE,
		};
	}

	static generateRandomPosition(): PositionLiteral {
		return {
			x: Math.floor(Math.random() * WORLD_WIDTH),
			y: Math.floor(Math.random() * WORLD_HEIGHT),
		};
	}

	randomGridPosition(type: string = "unknown"): PositionLiteral {
		const randomPosition = Tilemap.generateRandomPosition();
		const grid = this.grid.clone();
		if (grid.isWalkableAt(randomPosition.x, randomPosition.y)) {
			const node = grid.getNodeAt(randomPosition.x, randomPosition.y);
			const sides = grid.getNeighbors(node, DiagonalMovement.Always);
			const sidesHaveAtLeastOneWalkableNeighbor =
				sides.map((side) => side.walkable).length > 0;
			if (sidesHaveAtLeastOneWalkableNeighbor) {
				return randomPosition;
			} else {
				console.debug("node is trapped, trying again");
				return this.randomGridPosition(type);
			}
		} else {
			console.debug(
				`random position ${type} ${JSON.stringify(Object.values(randomPosition))} is not walkable, trying again`,
			);
			return this.randomGridPosition(type);
		}
	}

	getFlowDirection(
		flowField: number[][][],
		position: PositionLiteral,
	): [number, number] {
		const gridPos = Tilemap.positionToGrid(position);
		if (
			gridPos.x >= 0 &&
			gridPos.x < WORLD_WIDTH &&
			gridPos.y >= 0 &&
			gridPos.y < WORLD_HEIGHT
		) {
			return flowField[gridPos.x][gridPos.y] as [number, number];
		}
		return [0, 0];
	}

	generateFlowField(target: PositionLiteral): number[][][] {
		const flowField: number[][][] = Array(WORLD_WIDTH)
			.fill(null)
			.map(() =>
				Array(WORLD_HEIGHT)
					.fill(null)
					.map(() => [0, 0]),
			); // [dx, dy] direction vectors

		// Use Dijkstra from target to calculate distances
		const distances: number[][] = Array(WORLD_WIDTH)
			.fill(null)
			.map(() => Array(WORLD_HEIGHT).fill(Infinity));

		const queue: [number, number, number][] = [[target.x, target.y, 0]];
		distances[target.x][target.y] = 0;

		while (queue.length > 0) {
			queue.sort((a, b) => a[2] - b[2]);
			const [x, y, dist] = queue.shift()!;

			if (dist > distances[x][y]) continue;

			// Check all 8 neighbors
			for (let dx = -1; dx <= 1; dx++) {
				for (let dy = -1; dy <= 1; dy++) {
					if (dx === 0 && dy === 0) continue;

					const nx = x + dx;
					const ny = y + dy;

					if (nx >= 0 && nx < WORLD_WIDTH && ny >= 0 && ny < WORLD_HEIGHT) {
						if (this.grid.isWalkableAt(nx, ny)) {
							const newDist = dist + (dx !== 0 && dy !== 0 ? Math.SQRT2 : 1);

							if (newDist < distances[nx][ny]) {
								distances[nx][ny] = newDist;
								queue.push([nx, ny, newDist]);
							}
						}
					}
				}
			}
		}

		// Generate flow directions based on distances
		for (let x = 0; x < WORLD_WIDTH; x++) {
			for (let y = 0; y < WORLD_HEIGHT; y++) {
				if (!this.grid.isWalkableAt(x, y)) continue;

				let bestDir = [0, 0];
				let bestDistance = distances[x][y];

				// Check all neighbors to find steepest descent
				for (let dx = -1; dx <= 1; dx++) {
					for (let dy = -1; dy <= 1; dy++) {
						if (dx === 0 && dy === 0) continue;

						const nx = x + dx;
						const ny = y + dy;

						if (nx >= 0 && nx < WORLD_WIDTH && ny >= 0 && ny < WORLD_HEIGHT) {
							if (distances[nx][ny] < bestDistance) {
								bestDistance = distances[nx][ny];
								bestDir = [dx, dy];
							}
						}
					}
				}

				// Normalize direction
				const length = Math.sqrt(
					bestDir[0] * bestDir[0] + bestDir[1] * bestDir[1],
				);
				if (length > 0) {
					flowField[x][y] = [bestDir[0] / length, bestDir[1] / length];
				}
			}
		}

		return flowField;
	}
}
