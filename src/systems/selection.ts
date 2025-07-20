import type { PositionComponent } from "../components/position.ts";
import type { SelectableComponent } from "../components/selectable.ts";
import type { EntityManager } from "../entity-manager.ts";
import type { System } from "../types.ts";

export class SelectionSystem implements System {
	constructor(private entityManager: EntityManager) {}

	update(): void {
		// Handle selection logic
	}

	selectEntitiesInArea(x1: number, y1: number, x2: number, y2: number): void {
		const entities = this.entityManager.getAllEntities();

		for (const entity of entities) {
			if (
				entity.hasComponent("Position") &&
				entity.hasComponent("Selectable")
			) {
				const position = entity.getComponent<PositionComponent>("Position")!;
				const selectable =
					entity.getComponent<SelectableComponent>("Selectable")!;

				// Check if entity is in selection box
				if (
					position.x >= x1 &&
					position.x <= x2 &&
					position.y >= y1 &&
					position.y <= y2
				) {
					selectable.isSelected = true;
				}
			}
		}
	}
}
