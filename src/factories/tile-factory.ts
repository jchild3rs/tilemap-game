import { Graphics } from "pixi.js";
import { GridPositionComponent } from "../components/grid-position.ts";
import { TileRenderComponent } from "../components/tile-render.ts";
import { TileComponent } from "../components/tile.ts";
import { GameConfig } from "../config.ts";
import type { Entity, EntityManager } from "../entity-manager.ts";

export class TileFactory {
	private config = GameConfig.getInstance();

	constructor(private entityManager: EntityManager) {}

	createTile(x: number, y: number, groundType: string = ""): Entity {
		const entity = this.entityManager.createEntity();

		// Determine ground type if not provided
		const type = groundType || this.getRandomGroundType();
		const walkable = this.isWalkable(type);
		const cost = this.getMovementCost(type);

		// Create graphics for the tile
		const graphic = new Graphics({ label: `Tile ${x},${y}` })
			.rect(
				x * this.config.CELL_SIZE,
				y * this.config.CELL_SIZE,
				this.config.CELL_SIZE,
				this.config.CELL_SIZE,
			)
			.stroke({
				width: 1,
				color: 0xffffff,
				alpha: 0.1,
				pixelLine: true,
				alignment: 1,
			})
			.fill(this.config.ground.colorMap[type]);

		// Add components
		entity.addComponent(new GridPositionComponent(x, y));
		entity.addComponent(new TileComponent(type, walkable, cost));
		entity.addComponent(new TileRenderComponent(graphic));

		return entity;
	}

	makeBlockingTile(x: number, y: number): Entity {
		const entity = this.createTile(x, y, "wall");
		const tile = entity.getComponent<TileComponent>("Tile");
		tile.walkable = false;

		// Update graphic
		const renderComponent =
			entity.getComponent<TileRenderComponent>("TileRender");
		renderComponent.graphic
			.clear()
			.rect(
				x * this.config.CELL_SIZE,
				y * this.config.CELL_SIZE,
				this.config.CELL_SIZE,
				this.config.CELL_SIZE,
			)
			.fill(0x999999);

		return entity;
	}

	private getRandomGroundType(): string {
		const types = Object.keys(this.config.ground.colorMap);
		return types[Math.floor(Math.random() * types.length)];
	}

	private isWalkable(groundType: string): boolean {
		return groundType !== "wall";
	}

	private getMovementCost(groundType: string): number {
		return 1 / (this.config.ground.walkSpeedMap[groundType] || 1);
	}
}
