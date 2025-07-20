// systems/PathfindingSystem.ts
import type { MapComponent } from "../components/map.ts";
import type { PositionLiteral, System } from "../types.ts";
import { DiagonalMovement } from "../pathfinding/diagonal-movement.ts";
import type { Grid } from "../pathfinding/grid.ts";
import { GameConfig } from "../config.ts";
import type { Entity, EntityManager } from "../entity-manager.ts";
import { PathfinderFactory } from "../factories/pathfinder-factory.ts";

export class PathfindingSystem implements System {
	private pathfinderFactory = PathfinderFactory.getInstance();
	private config = GameConfig.getInstance();

	constructor(private entityManager: EntityManager) {}

	findPath(startPos: PositionLiteral, endPos: PositionLiteral): number[][] {
		const mapEntity = this.getMapEntity();
		if (!mapEntity) return [];

		const mapComponent = mapEntity.getComponent<MapComponent>("Map");
		const grid = mapComponent.grid.clone();

		const finder = this.pathfinderFactory.createFinder(
			this.config.pathfinding.defaultAlgorithm,
		);

		try {
			const path = finder.findPath(
				startPos.x,
				startPos.y,
				endPos.x,
				endPos.y,
				grid,
			);

			if (path.length === 0) {
				console.warn("No path found from", startPos, "to", endPos);
			}

			return path;
		} catch (error) {
			console.error("Pathfinding error:", error);
			return [];
		}
	}

	// Method to find a random walkable position
	findRandomWalkablePosition(type: string = "unknown"): PositionLiteral {
		const mapEntity = this.getMapEntity();
		if (!mapEntity) return { x: 0, y: 0 };

		const mapComponent = mapEntity.getComponent<MapComponent>("Map");
		const width = mapComponent.width;
		const height = mapComponent.height;
		const grid = mapComponent.grid.clone();

		const generatePosition = (): PositionLiteral => {
			return {
				x: Math.floor(Math.random() * width),
				y: Math.floor(Math.random() * height),
			};
		};

		let randomPosition = generatePosition();
		let attempts = 0;
		const MAX_ATTEMPTS = 100;

		while (
			!this.isValidPosition(randomPosition, grid) &&
			attempts < MAX_ATTEMPTS
		) {
			console.debug(
				`Random position ${type} ${JSON.stringify(randomPosition)} is not walkable, trying again`,
			);
			randomPosition = generatePosition();
			attempts++;
		}

		return randomPosition;
	}

	private isValidPosition(position: PositionLiteral, grid: Grid): boolean {
		if (!grid.isWalkableAt(position.x, position.y)) {
			return false;
		}

		const node = grid.getNodeAt(position.x, position.y);
		const neighbors = grid.getNeighbors(node, DiagonalMovement.Always);
		return neighbors.some((neighbor) => neighbor.walkable);
	}

	private getMapEntity(): Entity | undefined {
		return this.entityManager.getAllEntitiesWithComponents(["Map"])[0];
	}

	update(_deltaTime: number) {
		// nada
	}
}
