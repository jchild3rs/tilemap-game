import type { ColorSource } from "pixi.js";

type GroundType = (typeof Ground)["groundTypes"][number];

export class Ground {
	constructor(public readonly type: GroundType) {}

	static readonly groundTypes = [
		"dirt",
		// "grass",
		// "rock",
		// "sand",
		// "snow",
		// "stone",
		"water",
	] as const;

	static readonly groundWalkSpeedMap: Readonly<Record<GroundType, number>> = {
		dirt: 0.7,
		// grass: 0.8,
		// rock: 0.9,
		// sand: 0.5,
		// snow: 0.6,
		// stone: 1,
		water: 0.1,
	};

	static readonly groundColorMap: Record<GroundType, ColorSource> = {
		dirt: "#9d9368",
		// grass: "#2e7d32",
		// rock: "#424242",
		// sand: "#ffd180",
		// snow: "#ffffff",
		// stone: "#616161",
		water: "#1976d2",
	};

	static randomGroundType() {
		const rng = Math.random();

		if (rng < 0.1) {
			return "water";
		}

		return "dirt"
	}

	static makeRandomGround() {
		const groundType = Ground.randomGroundType();
		return new Ground(groundType);
	}

	get groundType() {
		return this.type;
	}
}
