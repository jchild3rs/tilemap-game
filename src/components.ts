/**
 * Components are data structs used to compose entities to then be queried by systems.
 */
import { Data } from "effect";
import type { Grid } from "pathfinding";
import type * as PIXI from "pixi.js";

import type { MovementDirection, PositionLiteral } from "./types.ts";

export type CombatStatus = "friendly" | "hostile";

interface Components {
	CombatStatus: {
		readonly _tag: "CombatStatus";
		status: CombatStatus;
	};
	Weapon: {
		readonly _tag: "Weapon";
		range: number; // radius
		damagePerHit: number;
		hitPercentage: number;
		isFiring: boolean;
		target: PositionLiteral | null;
	};
	Tile: {
		readonly _tag: "Tile";
		groundType: string;
		walkable: boolean;
		cost: number;
	};
	Tilemap: {
		readonly _tag: "Tilemap";
		readonly width: number;
		readonly height: number;
		readonly grid: Grid;
	};
	Ground: { readonly _tag: "Ground"; isWalkable: boolean };
	Objects: { readonly _tag: "Objects" };
	UI: { readonly _tag: "UI" };

	Draftable: {
		readonly _tag: "Draftable";
		isDrafted: boolean;
		fireAtWill: boolean;
	};
	Position: {
		readonly _tag: "Position";
		x: number;
		y: number;
	};
	GridPosition: {
		readonly _tag: "GridPosition";
		cellX: number;
		cellY: number;
	};
	Health: {
		readonly _tag: "Health";
		currentHealth: number;
		maxHealth: number;
	};
	Graphics:
		| {
				readonly _tag: "Graphics";
				readonly graphic: PIXI.Graphics;
		  }
		| {
				readonly _tag: "Graphics";
				readonly graphic: PIXI.Sprite;
		  }
		| {
				readonly _tag: "Graphics";
				readonly graphic: PIXI.Container;
		  };
	Movement: {
		readonly _tag: "Movement";
		speed: number;
		path: number[][][];
		isMoving: boolean;
		isWandering: boolean;
		pendingPath: number[][][];
		currentPathIndex: number;
		currentStepIndex: number;
		direction: MovementDirection;
	};
	Highlightable: {
		readonly _tag: "Highlightable";
	};
	Selectable: {
		readonly _tag: "Selectable";
		isSelected: boolean;
	};
	Input: {
		readonly _tag: "Input";
		isPlayerControlled?: boolean;
		moveUp: string;
		moveDown: string;
		moveLeft: string;
		moveRight: string;
		action1: string;
	};
	Walkable: {
		readonly _tag: "Walkable";
		isWalkable: boolean;
		weight: number;
	};
}

export namespace Components {
	export const Weapon = Data.tagged<Components["Weapon"]>("Weapon");
	export const CombatStatus =
		Data.tagged<Components["CombatStatus"]>("CombatStatus");
	export const Position = Data.tagged<Components["Position"]>("Position");
	export const Selectable = Data.tagged<Components["Selectable"]>("Selectable");
	export const Highlightable =
		Data.tagged<Components["Highlightable"]>("Highlightable");
	export const Health = Data.tagged<Components["Health"]>("Health");
	export const Graphics = Data.tagged<Components["Graphics"]>("Graphics");
	// const Container = Data.tagged<Components["Graphics"]>("Graphics");
	export const Movement = Data.tagged<Components["Movement"]>("Movement");
	export const Input = Data.tagged<Components["Input"]>("Input");
	export const Ground = Data.tagged<Components["Ground"]>("Ground");
	export const Tilemap = Data.tagged<Components["Tilemap"]>("Tilemap");
	export const Objects = Data.tagged<Components["Objects"]>("Objects");
	export const Tile = Data.tagged<Components["Tile"]>("Tile");
	export const Walkable = Data.tagged<Components["Walkable"]>("Walkable");
	export const Draftable = Data.tagged<Components["Draftable"]>("Draftable");
	export const GridPosition =
		Data.tagged<Components["GridPosition"]>("GridPosition");
}

export type ComponentTag = Components[keyof Components]["_tag"];
export type ComponentForTag<T extends ComponentTag> = Components[T];
export type Component = ComponentForTag<ComponentTag>;
