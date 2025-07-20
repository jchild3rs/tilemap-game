import type { MapComponent } from "../components/map.ts";
import type { TileRenderComponent } from "../components/tile-render.ts";
import type { PositionLiteral } from "../types.ts";
import type { TileComponent } from "../components/tile.ts";
import { GameConfig } from "../config.ts";
import type { Entity, EntityManager } from "../entity-manager.ts";
import type { FlowFieldSystem } from "../systems/flow-field-system.ts";
import type { PathfindingSystem } from "../systems/pathfinding-system.ts";
import type { PositionConversionSystem } from "../systems/position-conversion-system.ts";

// services/MapService.ts
export class MapService {
	constructor(
		private entityManager: EntityManager,
		private pathfindingSystem: PathfindingSystem,
		private positionConversionSystem: PositionConversionSystem,
		private flowFieldSystem: FlowFieldSystem,
	) {}

	findPath(start: PositionLiteral, end: PositionLiteral): number[][] {
		return this.pathfindingSystem.findPath(start, end);
	}

	randomGridPosition(type: string = "unknown"): PositionLiteral {
		return this.pathfindingSystem.findRandomWalkablePosition(type);
	}

	getTileAtPosition(position: PositionLiteral): Entity | undefined {
		return this.positionConversionSystem.getTileAtWorldPosition(position);
	}

	worldToGrid(position: PositionLiteral): PositionLiteral {
		return this.positionConversionSystem.worldToGrid(position);
	}

	gridToWorld(position: PositionLiteral): PositionLiteral {
		return this.positionConversionSystem.gridToWorld(position);
	}

	generateFlowField(target: PositionLiteral): number[][][] {
		return this.flowFieldSystem.generateFlowField(target);
	}

	getFlowDirection(
		flowField: number[][][],
		position: PositionLiteral,
	): [number, number] {
		return this.flowFieldSystem.getFlowDirection(flowField, position);
	}

	makeBlockingTile(x: number, y: number): void {
		const tileEntity = this.positionConversionSystem.getTileAtGridPosition({
			x,
			y,
		});
		if (tileEntity) {
			const tile = tileEntity.getComponent<TileComponent>("Tile");
			tile.walkable = false;
			tile.groundType = "wall";

			// Update the grid in MapComponent
			const mapEntity = this.entityManager.getAllEntitiesWithComponents([
				"Map",
			])[0];
			if (mapEntity) {
				const mapComponent = mapEntity.getComponent<MapComponent>("Map");
				mapComponent.grid.setWalkableAt(x, y, false);
			}

			// Update the rendering
			const renderComponent =
				tileEntity.getComponent<TileRenderComponent>("TileRender");
			renderComponent.graphic
				.clear()
				.rect(
					x * GameConfig.getInstance().CELL_SIZE,
					y * GameConfig.getInstance().CELL_SIZE,
					GameConfig.getInstance().CELL_SIZE,
					GameConfig.getInstance().CELL_SIZE,
				)
				.fill(0x999999);
		}
	}
}
