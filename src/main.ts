import { BrowserRuntime } from "@effect/platform-browser";
import { Effect, Logger, LogLevel } from "effect";
import { AStarFinder, Grid } from 'pathfinding';
import { ConfigLive } from "./app/config.ts";
import { GameEngine } from "./app/engine.ts";
import { EntityManagerLive } from "./app/entity-manager.ts";
import { RendererLive } from "./app/renderer.ts";
import { StageLive } from "./app/stage.ts";
import { TickerLive } from "./app/ticker.ts";
import { TilemapLive } from "./app/tilemap.ts";
import { ViewportLive } from "./app/viewport.ts";
import { EntityLayer } from "./entities/layer.ts";
import { PathfinderFactoryLive } from "./services/pathfinder-factory.ts";
import { PathfindingLive } from "./services/pathfinding-service.ts";
import { PositionConversionLive } from "./services/position-conversion.ts";

BrowserRuntime.runMain(
	GameEngine.pipe(
		Effect.provide(EntityLayer),
		Effect.provide(PathfindingLive),
		Effect.provide(TilemapLive),
		Effect.provide(PathfinderFactoryLive),
		Effect.provide(PositionConversionLive),
		Effect.provide(EntityManagerLive),
		Effect.provide(ViewportLive),
		Effect.provide(TickerLive),
		Effect.provide(RendererLive),
		Effect.provide(StageLive),
		Effect.provide(ConfigLive),
		Logger.withMinimumLogLevel(LogLevel.Debug),
	),
);


const grid = new Grid(10, 10)
const finder = new AStarFinder();
const path = finder.findPath(0,0,4,6, grid)
console.log({ path })
//
// const cols = 5; //columns in the grid
// const rows = 5; //rows in the grid
//
// const grid = new Array(cols); //array of all the grid points
//
// const openSet: GridPoint[] = []; //array containing unevaluated grid points
// const closedSet: GridPoint[] = []; //array containing completely evaluated grid points
//
// let start: GridPoint; //starting grid point
// let end: GridPoint; // ending grid point (goal)
// const path: GridPoint[] = [];
//
// //heuristic we will be using - Manhattan distance
// //for other heuristics visit - https://theory.stanford.edu/~amitp/GameProgramming/Heuristics.html
// function heuristic(position0, position1) {
// 	const d1 = Math.abs(position1.x - position0.x);
// 	const d2 = Math.abs(position1.y - position0.y);
//
// 	return d1 + d2;
// }
//
// //constructor function to create all the grid points as objects containind the data for the points
// class GridPoint {
// 	f = 0; //total cost function
// 	g = 0; //cost function from start to the current grid point
// 	h = 0; //heuristic estimated cost function from current grid point to the goal
// 	neighbors: GridPoint[] = []; // neighbors of the current grid point
// 	parent: GridPoint | undefined = undefined; // immediate source of the current grid point
//
// 	constructor(
// 		private readonly x: number,
// 		private readonly y: number,
// 	) {}
//
// 	updateNeighbors(grid: GridPoint[][]) {
// 		const i = this.x;
// 		const j = this.y;
// 		if (i < cols - 1) {
// 			this.neighbors.push(grid[i + 1][j]);
// 		}
// 		if (i > 0) {
// 			this.neighbors.push(grid[i - 1][j]);
// 		}
// 		if (j < rows - 1) {
// 			this.neighbors.push(grid[i][j + 1]);
// 		}
// 		if (j > 0) {
// 			this.neighbors.push(grid[i][j - 1]);
// 		}
// 	}
// }
//
// //initializing the grid
// function init() {
// 	//making a 2D array
// 	for (let i = 0; i < cols; i++) {
// 		grid[i] = new Array(rows);
// 	}
//
// 	for (let i = 0; i < cols; i++) {
// 		for (let j = 0; j < rows; j++) {
// 			grid[i][j] = new GridPoint(i, j);
// 		}
// 	}
//
// 	for (let i = 0; i < cols; i++) {
// 		for (let j = 0; j < rows; j++) {
// 			grid[i][j].updateNeighbors(grid);
// 		}
// 	}
//
// 	start = grid[0][0];
// 	end = grid[cols - 1][rows - 1];
//
// 	openSet.push(start);
//
// 	console.log(grid);
// }
//
// //A star search implementation
//
// function search() {
// 	init();
// 	while (openSet.length > 0) {
// 		//assumption the lowest index is the first one to begin with
// 		let lowestIndex = 0;
// 		for (let i = 0; i < openSet.length; i++) {
// 			if (openSet[i].f < openSet[lowestIndex].f) {
// 				lowestIndex = i;
// 			}
// 		}
// 		const current = openSet[lowestIndex];
//
// 		if (current === end) {
// 			let temp = current;
// 			path.push(temp);
// 			while (temp.parent) {
// 				path.push(temp.parent);
// 				temp = temp.parent;
// 			}
// 			console.log("DONE!");
// 			// return the traced path
// 			return path.reverse();
// 		}
//
// 		//remove current from openSet
// 		openSet.splice(lowestIndex, 1);
// 		//add current to closedSet
// 		closedSet.push(current);
//
// 		const neighbors = current.neighbors;
//
// 		for (let i = 0; i < neighbors.length; i++) {
// 			const neighbor = neighbors[i];
//
// 			if (!closedSet.includes(neighbor)) {
// 				const possibleG = current.g + 1;
//
// 				if (!openSet.includes(neighbor)) {
// 					openSet.push(neighbor);
// 				} else if (possibleG >= neighbor.g) {
// 					continue;
// 				}
//
// 				neighbor.g = possibleG;
// 				neighbor.h = heuristic(neighbor, end);
// 				neighbor.f = neighbor.g + neighbor.h;
// 				neighbor.parent = current;
// 			}
// 		}
// 	}
//
// 	//no solution by default
// 	return [];
// }
//
// console.log(search());
