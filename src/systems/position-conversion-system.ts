// systems/PositionConversionSystem.ts
import type { GridPositionComponent } from "../components/grid-position.ts";
import type { MapComponent } from "../components/map.ts";
import type { PositionLiteral, System } from "../types.ts";
import { GameConfig } from "../config.ts";
import type { Entity, EntityManager } from "../entity-manager.ts";

export class PositionConversionSystem implements System {
	private config = GameConfig.getInstance();

	constructor(private entityManager: EntityManager) {}

	// Convert world position to grid position
	worldToGrid(position: PositionLiteral): PositionLiteral {
		const mapEntity = this.getMapEntity();
		if (!mapEntity) return { x: 0, y: 0 };

		const mapComponent = mapEntity.getComponent<MapComponent>("Map");

		return {
			x: this.clamp(
				0,
				mapComponent.width - 1,
				Math.floor(position.x / this.config.CELL_SIZE),
			),
			y: this.clamp(
				0,
				mapComponent.height - 1,
				Math.floor(position.y / this.config.CELL_SIZE),
			),
		};
	}

	// Convert grid position to world position
	gridToWorld(position: PositionLiteral): PositionLiteral {
		return {
			x: position.x * this.config.CELL_SIZE,
			y: position.y * this.config.CELL_SIZE,
		};
	}

	// Get tile entity at a world position
	getTileAtWorldPosition(position: PositionLiteral): Entity | undefined {
		const gridPos = this.worldToGrid(position);
		return this.getTileAtGridPosition(gridPos);
	}

	// Get tile entity at a grid position
	getTileAtGridPosition(position: PositionLiteral): Entity | undefined {
		return this.entityManager
			.getAllEntitiesWithComponents(["Tile", "GridPosition"])
			.find((entity) => {
				const gridPos =
					entity.getComponent<GridPositionComponent>("GridPosition");
				return gridPos.x === position.x && gridPos.y === position.y;
			});
	}

	private getMapEntity(): Entity | undefined {
		return this.entityManager.getAllEntitiesWithComponents(["Map"])[0];
	}

	private clamp(min: number, max: number, value: number): number {
		return Math.max(min, Math.min(max, value));
	}

	update(_deltaTime: number) {
		// nada
	}
}
