import { Context, Effect, Layer } from "effect";
import type { PositionLiteral } from "../types.ts";
import { Config } from "./config.ts";

export class Tilemap extends Context.Tag("Tilemap")<
	Tilemap,
	{
		getCostAt(x: number, y: number): number;
		setCostAt(x: number, y: number, cost: number): void;
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

		const grid: number[][] = [];
		for (let i = 0; i < config.WORLD_SIZE; i++) {
			const row: number[] = [];
			for (let j = 0; j < config.WORLD_SIZE; j++) {
				row.push(1);
			}
			grid.push(row);
		}

		yield* Effect.log("created tilemap", {
			config,
			grid,
		});

		function getValidNeighbors(grid: number[][], r: number, c: number) {
			const cardinalDirs = [
				[0, 1],
				[1, 0],
				[0, -1],
				[-1, 0],
			];

			const diagonalDirs = [
				[-1, -1],
				[-1, 1],
				[1, -1],
				[1, 1],
			];

			const rows = grid.length;
			const cols = grid[0].length;
			const neighbors = [];

			const isWall = (nr: number, nc: number) =>
				nr < 0 ||
				nr >= rows ||
				nc < 0 ||
				nc >= cols ||
				grid[nr][nc] === Infinity;

			// Cardinal directions are always checked
			for (const [dr, dc] of cardinalDirs) {
				const nr = r + dr,
					nc = c + dc;
				if (!isWall(nr, nc)) {
					neighbors.push([nr, nc]);
				}
			}

			// Diagonal directions are conditionally allowed
			for (const [dr, dc] of diagonalDirs) {
				const nr = r + dr,
					nc = c + dc;
				const adj1 = [r + dr, c]; // vertical
				const adj2 = [r, c + dc]; // horizontal

				if (
					!isWall(nr, nc) &&
					// @ts-ignore
					!isWall(...adj1) &&
					// @ts-ignore
					!isWall(...adj2)
				) {
					neighbors.push([nr, nc]);
				}
			}

			return neighbors;
		}

		/**
		 * @example
		 * ```typescript
		 * const grid = [
		 * 	[1, 1, 1],
		 * 	[9, 9, 1],
		 * 	[1, 1, 1]
		 * ];
		 *
		 * const result = aStar(grid, 0, 0, 2, 2);
		 * console.log("Cost:", result.cost); // e.g., 5
		 * console.log("Path:", result.path); // e.g., [[0,0],[0,1],[0,2],[1,2],[2,2]]
		 * ```
		 */
		function aStar(
			grid: number[][],
			startRow: number,
			startCol: number,
			endRow: number,
			endCol: number,
		) {
			const toKey = (r: number, c: number) => `${r},${c}`;

			const heuristic = (r: number, c: number) =>
				Math.abs(r - endRow) + Math.abs(c - endCol); // Manhattan

			const dist: Record<string, number> = {};
			const parent: Record<string, string> = {};
			const pq = new MinHeap();
			const visited = new Set();

			const startKey = toKey(startRow, startCol);
			dist[startKey] = 0;
			pq.push({ key: startKey, priority: heuristic(startRow, startCol) });

			while (!pq.isEmpty()) {
				const { key } = pq.pop()!;
				if (visited.has(key)) continue;
				visited.add(key);

				const [r, c] = key.split(",").map(Number);
				if (r === endRow && c === endCol) break;

				for (const [nr, nc] of getValidNeighbors(grid, r, c)) {
					const neighborKey = `${nr},${nc}`;
					const cost = grid[nr][nc];
					const newDist = dist[key] + cost;

					if (dist[neighborKey] === undefined || newDist < dist[neighborKey]) {
						dist[neighborKey] = newDist;
						parent[neighborKey] = key;
						const priority = newDist + heuristic(nr, nc);
						pq.push({ key: neighborKey, priority });
					}
				}
			}

			// Reconstruct path
			const path = [];
			let cur = toKey(endRow, endCol);
			while (cur !== undefined) {
				const [r, c] = cur.split(",").map(Number);
				path.push([r, c]);
				cur = parent[cur];
			}
			path.reverse();

			return {
				cost: dist[toKey(endRow, endCol)] ?? Infinity,
				path: path.length ? path : [],
			};
		}

		const findPath = (start: PositionLiteral, end: PositionLiteral) =>
			aStar(grid, start.x, start.y, end.x, end.y).path;

		const isWalkableAt = (x: number, y: number) => {
			return grid[x][y] !== Infinity;
		};

		const setWalkableAt = (x: number, y: number, isWalkable: boolean) => {
			grid[x][y] = isWalkable ? 1 : Infinity;
		};

		const getRandomWalkablePosition = () => {
			const x = Math.floor(Math.random() * config.WORLD_SIZE);
			const y = Math.floor(Math.random() * config.WORLD_SIZE);

			if (isWalkableAt(x, y)) {
				return { x, y };
			} else {
				return getRandomWalkablePosition();
			}
		};

		const getCostAt = (x: number, y: number) => {
			return grid[x][y];
		};

		const setCostAt = (x: number, y: number, cost: number) => {
			grid[x][y] = cost;
		};

		return {
			setCostAt,
			getRandomWalkablePosition,
			findPath,
			isWalkableAt,
			setWalkableAt,
			getCostAt,
		} as const;
	}),
);

interface Node {
	key: string;
	priority: number;
}

class MinHeap {
	constructor(private readonly heap: Node[] = []) {}

	push(item: Node) {
		this.heap.push(item);
		this._siftUp();
	}

	pop() {
		if (this.heap.length === 0) return null;
		const top = this.heap[0];
		const last = this.heap.pop();
		if (last && this.heap.length > 0) {
			this.heap[0] = last;
			this._siftDown();
		}
		return top;
	}

	_siftUp() {
		let i = this.heap.length - 1;
		while (i > 0) {
			const p = Math.floor((i - 1) / 2);
			if (this.heap[i].priority >= this.heap[p].priority) break;
			[this.heap[i], this.heap[p]] = [this.heap[p], this.heap[i]];
			i = p;
		}
	}

	_siftDown() {
		let i = 0;
		const n = this.heap.length;
		while (true) {
			let left = 2 * i + 1,
				right = 2 * i + 2,
				smallest = i;
			if (left < n && this.heap[left].priority < this.heap[smallest].priority)
				smallest = left;
			if (right < n && this.heap[right].priority < this.heap[smallest].priority)
				smallest = right;
			if (smallest === i) break;
			[this.heap[i], this.heap[smallest]] = [this.heap[smallest], this.heap[i]];
			i = smallest;
		}
	}

	isEmpty() {
		return this.heap.length === 0;
	}
}
