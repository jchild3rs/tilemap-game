import { Container, Graphics } from "pixi.js";
import type { Viewport } from "pixi-viewport";
import { CELL_SIZE, WORLD_HEIGHT, WORLD_WIDTH } from "./config.ts";
import { Ground } from "./ground.ts";
import { DiagonalMovement } from "./pathfinding/diagonal-movement.ts";
import { DistanceHeuristic } from "./pathfinding/distance-heuristic.ts";
import { AStarFinder } from "./pathfinding/finders/a-star-finder.ts";
import { Grid } from "./pathfinding/grid.ts";
import { Tile } from "./tile.ts";
import type { PositionLiteral } from "./types.ts";
import { clamp } from "./util.ts";

export class Tilemap {
	public readonly grid = new Grid(WORLD_WIDTH, WORLD_HEIGHT);
	public readonly tiles: Tile[][] = [];
	private readonly finder = new AStarFinder({
		diagonalMovement: DiagonalMovement.IfAtMostOneObstacle,
		heuristic: DistanceHeuristic.manhattan,
	});
	private readonly element = new Container({ label: "Tilemap" });

	constructor(
		private readonly viewport: Viewport,
		// private readonly textureMap: Record<string, Texture>,
	) {
		// // add a background to the viewport
		this.viewport.addChild(
			new Graphics({
				label: "ViewportBackground",
				eventMode: "none",
			})
				.rect(0, 0, this.viewport.worldWidth, this.viewport.worldHeight)
				.fill("white"),
		);

		for (let row = 0; row < WORLD_WIDTH; row++) {
			const rowTiles: Tile[] = [];

			for (let col = 0; col < WORLD_HEIGHT; col++) {
				// const grassTexture = this.textureMap["grass.jpg"];
				const ground = Ground.makeRandomGround();
				// this.grid.getNodeAt(0,0)

				const graphic = this.element.addChild(
					new Graphics({ label: `Tile ${row},${col}` })

						.rect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE)
						.stroke({
							width: 1,
							color: 0xffffff,
							alpha: 0.1,
							// alpha: 1,
							pixelLine: true,
							alignment: 1,
						})
						// .fill('white')
						.fill(Ground.groundColorMap[ground.type]),
				);
				// graphic.alpha = 0.5;
				//
				// graphic.blendMode = "screen";
				// graphic.texture(
				// 	grassTexture, // texture
				// 	groundColorTint, // white tint
				// 	col * CELL_SIZE,
				// 	row * CELL_SIZE,
				// 	CELL_SIZE,
				// 	CELL_SIZE, // dimensions
				// );

				// let cost = 0
				// if (ground.type === 'water') {
				// 	cost = 1000
				// }
				// const cost = Ground.groundWalkSpeedMap[ground.type] * 10
				// console.log({ cost })
				// this.grid.setCostAt(row, col, cost);
				const tile = new Tile(this.grid.getNodeAt(row, col), graphic, ground);
				// console.log(tile);
				rowTiles.push(tile);
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

	get container() {
		return this.element;
	}

	makeBlockingTile(x: number, y: number) {
		const wall = new Graphics({
			label: "wall",
			eventMode: "none",
			interactiveChildren: false,
		})
			.rect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE)
			.fill("#999999");
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

	getTileAtPosition(position: PositionLiteral): Tile | undefined {
		const gridPos = Tilemap.positionToGrid(position);
		if (
			gridPos.x >= 0 &&
			gridPos.x < WORLD_WIDTH &&
			gridPos.y >= 0 &&
			gridPos.y < WORLD_HEIGHT
		) {
			return this.tiles[gridPos.y][gridPos.x];
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
}
