import { Context, Effect, Layer } from "effect";
import {
	type AStarFinder,
	type BiAStarFinder,
	type BiBreadthFirstFinder,
	type BreadthFirstFinder,
	Grid,
} from "pathfinding";
import { PathfinderFactory } from "../services/pathfinder-factory.ts";
import type { PositionLiteral } from "../types.ts";
import { Config } from "./config.ts";

export class Tilemap extends Context.Tag("Tilemap")<
	Tilemap,
	{
		grid: Grid;
		isWalkableAt(x: number, y: number): boolean;
		setWalkableAt(x: number, y: number, isWalkable: boolean): void;
		findPath(start: PositionLiteral, end: PositionLiteral): number[][];
		getRandomWalkablePosition(): PositionLiteral;
	}
>() {}

export const TilemapLive = Layer.effect(
	Tilemap,
	Effect.gen(function* () {
		const config = yield* Config;

		const pathfinderFactory = yield* PathfinderFactory;
		const grid = new Grid(config.WORLD_SIZE, config.WORLD_SIZE);

		const finders: Record<
			typeof config.pathfinding.defaultAlgorithm,
			AStarFinder | BiAStarFinder | BreadthFirstFinder | BiBreadthFirstFinder
		> = {
			aStar: yield* pathfinderFactory.createFinder("aStar"),
			biAStar: yield* pathfinderFactory.createFinder("biAStar"),
			breadthFirst: yield* pathfinderFactory.createFinder("breadthFirst"),
			biBreadthFirst: yield* pathfinderFactory.createFinder("biBreadthFirst"),
		};

		yield* Effect.log("created tilemap", {
			config,
			grid,
			finders,
		});

		const findPath = (
			start: PositionLiteral,
			end: PositionLiteral,
			algo = "aStar",
		) => finders[algo].findPath(start.x, start.y, end.x, end.y, grid.clone());

		const isWalkableAt = (x: number, y: number) => grid.isWalkableAt(x, y);

		const setWalkableAt = (x: number, y: number, isWalkable: boolean) => {
			return grid.setWalkableAt(x, y, isWalkable);
		};

		const getRandomWalkablePosition = () => {
			const x = Math.floor(Math.random() * config.WORLD_SIZE);
			const y = Math.floor(Math.random() * config.WORLD_SIZE);

			if (grid.isWalkableAt(x, y)) {
				return { x, y };
			} else {
				return getRandomWalkablePosition();
			}
		};

		return {
			grid,
			getRandomWalkablePosition,
			findPath,
			isWalkableAt,
			setWalkableAt,
		} as const;
	}),
);
