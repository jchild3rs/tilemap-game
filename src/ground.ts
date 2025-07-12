type GroundType = (typeof Ground)["groundTypes"][number];

export class Ground {
	constructor(public readonly type: GroundType) {}

	static readonly groundTypes = [
		"dirt",
		"grass",
		"rock",
		"sand",
		"snow",
		"stone",
		"water",
	] as const;

	static readonly groundWalkSpeedMap: Readonly<Record<GroundType, number>> = {
		dirt: 0.7,
		grass: 0.8,
		rock: 0.9,
		sand: 0.5,
		snow: 0.6,
		stone: 1,
		water: 0.4,
	};

	static readonly groundColorMap: Record<GroundType, number> = {
		dirt: 0x5d4037,
		grass: 0x2e7d32,
		rock: 0x424242,
		sand: 0xffd180,
		snow: 0xe0e0e0,
		stone: 0x616161,
		water: 0x1976d2,
	};

	static randomGroundType() {
		return Ground.groundTypes[
			Math.floor(Math.random() * Ground.groundTypes.length)
		];
	}

	static makeRandomGround() {
		const groundType = Ground.randomGroundType();
		return new Ground(groundType);
	}

	get groundType() {
		return this.type;
	}
}
