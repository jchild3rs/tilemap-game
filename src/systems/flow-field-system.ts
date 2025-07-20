// systems/FlowFieldSystem.ts
import type { MapComponent } from "../components/map.ts";
import type { PositionLiteral, System } from "../types.ts";
import type { Entity, EntityManager } from "../entity-manager.ts";
import type { PathfindingSystem } from "./pathfinding-system.ts";
import { PositionConversionSystem } from "./position-conversion-system.ts";

export class FlowFieldSystem implements System {
	constructor(
		private entityManager: EntityManager,
		private pathfindingSystem: PathfindingSystem,
	) {
		console.log(this.pathfindingSystem);
	}

	update(_deltaTime: number) {
		// nada
	}

	generateFlowField(_target: PositionLiteral): number[][][] {
		// Flow field generation logic
		// ...

		return [[[0, 0]]]; // Placeholder
	}

	getFlowDirection(
		flowField: number[][][],
		position: PositionLiteral,
	): [number, number] {
		const positionConversionSystem = this.getPositionConversionSystem();
		const gridPos = positionConversionSystem.worldToGrid(position);

		const mapEntity = this.getMapEntity();
		if (!mapEntity) return [0, 0];

		const mapComponent = mapEntity.getComponent<MapComponent>("Map");

		if (
			gridPos.x >= 0 &&
			gridPos.x < mapComponent.width &&
			gridPos.y >= 0 &&
			gridPos.y < mapComponent.height
		) {
			return flowField[gridPos.x][gridPos.y] as [number, number];
		}
		return [0, 0];
	}

	private getMapEntity(): Entity | undefined {
		return this.entityManager.getAllEntitiesWithComponents(["Map"])[0];
	}

	private getPositionConversionSystem(): PositionConversionSystem {
		// This would be better handled through proper dependency injection
		return new PositionConversionSystem(this.entityManager);
	}
}
