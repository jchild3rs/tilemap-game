import { Layer } from "effect";
import { MountainEntity } from "./mountain.ts";
import { PawnEntity } from "./pawn.ts";
import { WallEntity } from "./wall.ts";
import { WaterEntity } from "./water.ts";

export const EntityLayer = Layer.mergeAll(
	WallEntity.Default,
	WaterEntity.Default,
	PawnEntity.Default,
	MountainEntity.Default,
);
