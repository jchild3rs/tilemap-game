// systems/TilemapRenderSystem.ts
import type { GridPositionComponent } from "../components/grid-position.ts";
import type { TileRenderComponent } from "../components/tile-render.ts";
import type { TileComponent } from "../components/tile.ts";
import { GameConfig } from "../config.ts";
import type { Entity, EntityManager } from "../entity-manager.ts";

import type { System } from "../types.ts";

export class TilemapRenderSystem implements System {
	constructor(
		private entityManager: EntityManager,
		private config = GameConfig.getInstance(),
	) {
		const mapEntity = this.getMapEntity();
		if (!mapEntity) return;

		const entities = this.entityManager.getAllEntitiesWithComponents([
			"Tile",
			"GridPosition",
			"TileRender",
		]);
		console.log({ entities });

		for (const entity of entities) {
			const gridPos =
				entity.getComponent<GridPositionComponent>("GridPosition");
			const render = entity.getComponent<TileRenderComponent>("TileRender");
			const tile = entity.getComponent<TileComponent>("Tile");

			// Update tile appearance based on ground type
			render.graphic
				.rect(
					gridPos.x * this.config.CELL_SIZE,
					gridPos.y * this.config.CELL_SIZE,
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
				.fill(this.getGroundColor(tile.groundType));
		}
	}

	update(): void {
		//
	}

	private getMapEntity(): Entity | undefined {
		return this.entityManager.getAllEntitiesWithComponents(["Map"])[0];
	}

	private getGroundColor(groundType: string): number {
		// Get color from config or use default
		return this.config.ground.colorMap[groundType] || 0x00ff00;
	}
}
