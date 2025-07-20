import { Container, Graphics } from "pixi.js";
import { GraphicsComponent } from "../components/graphics.ts";
import { GroundComponent } from "../components/ground.ts";
import { MapComponent } from "../components/map.ts";
import { PositionComponent } from "../components/position.ts";
import type { TileRenderComponent } from "../components/tile-render.ts";
import { Grid } from "../pathfinding/grid.ts";
import type { TileComponent } from "../components/tile.ts";
import { GameConfig } from "../config.ts";
import type { Entity, EntityManager } from "../entity-manager.ts";
import type { TileFactory } from "./tile-factory.ts";

export class MapFactory {
	private config = GameConfig.getInstance();

	constructor(
		private entityManager: EntityManager,
		private tileFactory: TileFactory,
	) {}

	createMap(): Entity {
		// Create the map entity
		const mapEntity = this.entityManager.createEntity();

		// Set up the grid for pathfinding
		const grid = new Grid(this.config.WORLD_SIZE, this.config.WORLD_SIZE);
		mapEntity.addComponent(
			new MapComponent(this.config.WORLD_SIZE, this.config.WORLD_SIZE, grid),
		);
		mapEntity.addComponent(new GroundComponent());
		mapEntity.addComponent(new PositionComponent(0, 0));
		// Add background to viewport



		// Create all tile entities
		const tileContainer = new Container({ label: "Tilemap" });
		mapEntity.addComponent(
			new PositionComponent(tileContainer.position.x, tileContainer.position.y),
		);
		mapEntity.addComponent(new GraphicsComponent(tileContainer));

		for (let row = 0; row < this.config.WORLD_SIZE; row++) {
			for (let col = 0; col < this.config.WORLD_SIZE; col++) {
				const tile = this.tileFactory.createTile(row, col);
				const renderComponent =
					tile.getComponent<TileRenderComponent>("TileRender");
				tileContainer.addChild(renderComponent.graphic);

				// Update grid with walkability
				const tileComponent = tile.getComponent<TileComponent>("Tile");
				grid.setWalkableAt(row, col, tileComponent.walkable);

				// Optionally add cost information to grid
				if (tileComponent.cost !== 1) {
					grid.setCostAt(row, col, tileComponent.cost);
				}
			}
		}

		return mapEntity;
	}
}
