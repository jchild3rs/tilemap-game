import type { MovementComponent } from "../components/movement.ts";
import type { PositionComponent } from "../components/position.ts";
import type { EntityManager } from "../entity-manager.ts";
import type { System } from "../types.ts";

export class MovementSystem implements System {
	constructor(private entityManager: EntityManager) {}

	update(_deltaTime: number): void {
		const entities = this.entityManager.getAllEntities();

		for (const entity of entities) {
			if (entity.hasComponent("Position") && entity.hasComponent("Movement")) {
				const _position = entity.getComponent<PositionComponent>("Position")!;
				const movement = entity.getComponent<MovementComponent>("Movement")!;

				if (movement.path.length > 0) {
					// Movement logic here
					// Move towards next path node
					// Update position component
				}
			}
		}
	}
}
