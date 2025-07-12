import { computed, signal } from "@preact/signals-core";
import { CELL_SIZE } from "./config.ts";
import type { Pawn } from "./pawn.ts";
import type { PositionLiteral } from "./types.ts";

export class GameState {
	private readonly _pawns = signal(new Set<Pawn>());
	private readonly _gameSpeed = signal(1);
	private readonly _isPaused = signal(false);
	private readonly _hoveredPosition = signal<PositionLiteral | null>(null);
	private readonly _elapsedTime = signal(0);
	private readonly _gameElapsedTime = signal(0); // New: tracks time scaled by speed
	private readonly _FPS = signal(0);

	// Day/night cycle configuration
	private readonly DAY_DURATION_MS = 60000; // 60 seconds per full day/night cycle

	readonly pawns = computed(() => Array.from(this._pawns.value));
	readonly selectedPawns = computed(() =>
		this.pawns.value.filter((pawn) => pawn.$isSelected.value),
	);
	readonly selectedCount = computed(() => this.selectedPawns.value.length);
	readonly FPS = computed(() => Math.round(this._FPS.value));
	readonly gameSpeed = computed(() => this._gameSpeed.value);
	readonly isPaused = computed(() => this._isPaused.value);
	readonly hoveredPosition = computed(() => this._hoveredPosition.value);
	readonly elapsedTime = computed(() => this._elapsedTime.value);
	readonly gameElapsedTime = computed(() => this._gameElapsedTime.value);
	readonly pawnCount = computed(() => this._pawns.value.size);
	readonly draftedPawns = computed(() =>
		this.pawns.value.filter((pawn) => pawn.$isDrafted.value),
	);
	readonly draftedCount = computed(() => this.draftedPawns.value.length);

	// Day/night cycle computed values - now uses accumulated game time
	readonly timeOfDay = computed(() => {
		// Use accumulated game time instead of scaling current elapsed time
		return (
			(this.gameElapsedTime.value % this.DAY_DURATION_MS) / this.DAY_DURATION_MS
		);
	});

	readonly isNight = computed(() => {
		const time = this.timeOfDay.value;
		return time < 0.25 || time > 0.75;
	});

	readonly isDay = computed(() => !this.isNight.value);

	readonly isDawn = computed(() => {
		const time = this.timeOfDay.value;
		return time >= 0.75 || time <= 0.25;
	});

	readonly totalDays = computed(() => {
		return this.gameElapsedTime.value / this.DAY_DURATION_MS;
	});

	readonly colorTemperature = computed(() => {
		const time = this.timeOfDay.value;

		// Create color temperature curve
		// 0.0-0.2 (night to dawn): Cool to warm
		// 0.2-0.3 (dawn): Warm golden
		// 0.3-0.7 (morning to afternoon): Neutral warm
		// 0.7-0.8 (dusk): Warm golden
		// 0.8-1.0 (dusk to night): Warm to cool

		if (time < 0.2 || time > 0.8) {
			// Night - cool blue
			return { color: "#6699cc", intensity: 0.4 };
		} else if ((time >= 0.2 && time < 0.3) || (time >= 0.7 && time < 0.8)) {
			// Dawn/Dusk - warm golden
			return { color: "#ffaa66", intensity: 0.3 };
		} else {
			// Day - neutral warm
			return { color: "#ffffee", intensity: 0.1 };
		}
	});

	readonly atmosphericBrightness = computed(() => {
		const base = this.lightLevel.value;
		const temp = this.colorTemperature.value;

		// Slightly darker during color temperature transitions
		return base * (1 - temp.intensity * 0.2);
	});

	readonly isDusk = computed(() => this.isDawn.value);

	readonly lightLevel = computed(() => {
		const time = this.timeOfDay.value;
		const normalizedTime = Math.abs(time - 0.5) * 2;
		return 0.3 + (1 - normalizedTime) * 0.7;
	});

	readonly debugInfo = computed(() => {
		const pos = this.hoveredPosition.value;
		const timeHours = Math.floor(this.timeOfDay.value * 24);
		const timeMinutes = Math.floor((this.timeOfDay.value * 24 * 60) % 60);
		const timeStr = `${(timeHours % 12 || 12).toString().padStart(2, "0")}:${timeMinutes.toString().padStart(2, "0")} ${timeHours >= 12 ? "PM" : "AM"}`;

		return `Coordinates: ${pos?.x ?? "?"},${pos?.y ?? "?"}
Total: ${this.pawnCount.value} pawns
Selected: ${this.selectedCount.value} pawns
Drafted: ${this.draftedCount.value} pawns
Game Speed: ${this.gameSpeed.value.toFixed(1)}x
Elapsed: ${Math.round(this.elapsedTime.value / 1000)}s
Game Time: ${Math.round(this.gameElapsedTime.value / 1000)}s
Time: ${timeStr} ${this.isNight.value ? "🌙" : "☀️"} (${Math.floor(this.totalDays.value)} days)
Light Level: ${(this.lightLevel.value * 100).toFixed(0)}%
Paused: ${this.isPaused.value ? "Yes" : "No"}
FPS: ${this.FPS}`;
	});

	addPawn(pawn: Pawn) {
		// Create new Set to trigger signal update
		const newPawns = new Set(this._pawns.value);
		newPawns.add(pawn);
		this._pawns.value = newPawns;
	}

	removePawn(pawn: Pawn) {
		const newPawns = new Set(this._pawns.value);
		newPawns.delete(pawn);
		this._pawns.value = newPawns;
	}

	// Legacy getter for compatibility
	get pawnArr() {
		return this.pawns.value;
	}

	getSelectedPawns() {
		return this.selectedPawns.value;
	}

	getPawnAtPosition(position: PositionLiteral) {
		return this.pawns.value.find((pawn) => {
			return (
				position.x === pawn.container.x / CELL_SIZE &&
				position.y === pawn.container.y / CELL_SIZE
			);
		});
	}

	hasPawnAtPosition(position: PositionLiteral) {
		return this.pawns.value.some((pawn) => {
			return (
				position.x === pawn.container.x / CELL_SIZE &&
				position.y === pawn.container.y / CELL_SIZE
			);
		});
	}

	clearSelected() {
		this._pawns.value.forEach((pawn) => {
			pawn.setSelected(false);
		});
	}

	// Signal setters
	setFPS(fps: number) {
		this._FPS.value = fps;
	}

	updateGameTime(deltaTime: number) {
		if (!this.isPaused.value) {
			this._gameElapsedTime.value += deltaTime * this.gameSpeed.value;
		}
	}

	setGameSpeed(speed: number) {
		this._gameSpeed.value = speed;
	}

	setPaused(paused: boolean) {
		this._isPaused.value = paused;
	}

	setHoveredPosition(position: PositionLiteral | null) {
		this._hoveredPosition.value = position;
	}

	setElapsedTime(time: number) {
		this._elapsedTime.value = time;
	}
}
