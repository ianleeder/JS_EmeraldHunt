'use strict';

import { stateEnum, difficultyEnum, colorEnum } from './enums.js';
import { Dirt, Diamond, Gem, Rock, Exit, Dozer, Explosion, Grenade, DroppedGrenade, Bug, spriteEnum, classArray } from './objects.js';
import { EmeraldHunt } from './hunt.js';

class Field {
	// Canvas context for drawing
	#ctx;

	// Horizontal field size
	#fieldX;

	// Vertical field size
	#fieldY;

	// Game difficulty enum
	#difficulty;

	// Field data array
	#grid;

	// Dozer instance
	#dozer;

	// Boolean to flag if a new game has just started
	#fieldInitialising;

	// Amount of score accumulated in this game
	#gameScore = 0;

	// Amount of score available at the start of the game
	#availableScore = 0;

	// Target score to unlock the exit
	#targetScore = 0;

	// Callback to the Hunt object playerDying function
	#playerDyingCallback;

	// Callback to the Hunt object playerWon function
	#playerWonCallback;

	// Audio context
	#audioContext;

	// Audio gain (volume)
	#gainNode;

	// Multidimensional array containing distribution of objects, indexed by difficulty enum
	#difficultyDistribution = {};
	
	// Array of score multiplication factors (to determine target score from total available field score) indexed by difficulty enum
	#difficultyScoreFactor = {};

	// Maximum gain to set audio to
	#audioLevel = EmeraldHunt.STARTVOLUME;

	constructor(c, diff, dyingCallback, wonCallback) {
		this.#ctx = c;
		this.#fieldX = EmeraldHunt.DEFAULTFIELDX;
		this.#fieldY = EmeraldHunt.DEFAULTFIELDY;
		this.#difficulty = diff;
		this.#gameScore = 0;
		this.#playerDyingCallback = dyingCallback;
		this.#playerWonCallback = wonCallback;

		this.#audioContext = new (window.AudioContext || window.webkitAudioContext);
		this.#gainNode = this.#audioContext.createGain();
		this.#gainNode.gain.setValueAtTime(this.#audioLevel, this.#audioContext.currentTime);
		this.#gainNode.connect(this.#audioContext.destination);

		// Types are stored in the same array order as the sprites
		/*
			BLANK: 0,
			DIRT: 1,
			ROCK: 2,
			EMERALD: 3,
			BRICK: 4,
			BOMB: 5,
			EXIT: 6,
			DOZER: 7,
			COBBLE: 8,
			BUG: 9,
			DIAMOND: 10,
			SLIME: 11,
			EXPLOSION: 12,
			GRENADE: 13,
			NOTUSED: 14,
			ALTDOZER: 15
		*/
		// Numbers are for a default 40x20 field (800 tiles).
		// Actual items will be scaled for field size.
		// Set difficulty values
		this.#difficultyDistribution[difficultyEnum.EASY] =    [  0, 173, 125, 219,  80,   0,   0,   0,   0,   0,   0,   0,   0,  26,   0,   0];
		//                                                     [  0, 185, 126, 215,  78,   0,   0,   0,   0,   0,   0,   0,   0,  20,   0,   0];
		this.#difficultyDistribution[difficultyEnum.MEDIUM] =  [  0, 153, 105, 191, 101,  18,   0,   0,  42,   0,   0,   0,   0,  24,   0,   0];
		//                                                     [  0, 197, 101, 173,  83,  30,   0,   0,  34,   0,   0,   0,   0,  18,   0,   0];
		this.#difficultyDistribution[difficultyEnum.HARD] =    [  0, 199, 120, 140,  84,  25,   0,   0,  65,   0,  49,   0,   0,  12,   0,   0];
		//                                                     [  0, 173, 103, 133,  95,  40,   0,   0,  67,   0,  53,   0,   0,  18,   0,   0];
		this.#difficultyDistribution[difficultyEnum.HARDER] =  [  0, 128, 115,   0,  68,  31,   0,   0, 128,   0, 201,   0,   0,  20,   0,   0];
		//                                                     [  0, 134, 123,   0,  60,  33,   0,   0, 100,   0, 208,   0,   0,  21,   0,   0];
		this.#difficultyDistribution[difficultyEnum.HARDEST] = [  0,  98, 122,  55,  95,  27,   0,   0,  93,  24, 111,   0,   0,  19,   0,   0];
		//                                                     [  0, 101, 120,  54,  87,  32,   0,   0, 107,  24, 104,   0,   0,  17,   0,   0];

		this.#difficultyScoreFactor[difficultyEnum.EASY] =    0.90;
		this.#difficultyScoreFactor[difficultyEnum.MEDIUM] =  0.915;
		this.#difficultyScoreFactor[difficultyEnum.HARD] =    0.945;
		this.#difficultyScoreFactor[difficultyEnum.HARDER] =  0.96;
		this.#difficultyScoreFactor[difficultyEnum.HARDEST] = 0.96;

		this.initField();
		this.#fieldInitialising = true;
	}

	setVolume(n) {
		this.#audioLevel = n;
		this.#gainNode.gain.setValueAtTime(this.#audioLevel, this.#audioContext.currentTime);
	}

	initField() {
		// Move to storing the field in a 1D array
		this.#grid = new Array(this.#fieldX * this.#fieldY).fill(spriteEnum.BLANK);

		// If this field is being used for a menu background, leave it blank
		// It will self-populate
		if (this.#difficulty === stateEnum.MENU)
			return;

		let requiredTypes = [
			spriteEnum.DIRT,
			spriteEnum.ROCK,
			spriteEnum.EMERALD,
			spriteEnum.BRICK,
			spriteEnum.BOMB,
			spriteEnum.COBBLE,
			spriteEnum.BUG,
			spriteEnum.DIAMOND,
			spriteEnum.GRENADE
		];

		requiredTypes.forEach(this.populateFieldWithType.bind(this));
	}

	playGemFall() {
		/*
			First tone, 24ms, 26 cycles, 1,083Hz for 24ms
			Second tone, 28ms, 25 cycles: 892Hz for 28ms
			Third tone, 27ms, 19 cycles:  700Hz for 27ms
			Fourth tone, 80ms, 8 cycles: 100Hz for 80ms
			Fifth tone, 2ms, 1/2 cycle: 250Hz for 4ms
			Total time: 163ms
		*/
		let osc = new OscillatorNode(this.#audioContext);
		osc.connect(this.#gainNode);
		osc.type = 'square';

		osc.frequency.setValueAtTime(1083, this.#audioContext.currentTime);
		osc.frequency.setValueAtTime(892, this.#audioContext.currentTime + 0.024);
		osc.frequency.setValueAtTime(700, this.#audioContext.currentTime + 0.052);
		osc.frequency.setValueAtTime(100, this.#audioContext.currentTime + 0.079);
		osc.frequency.setValueAtTime(250, this.#audioContext.currentTime + 0.159);

		this.startTone(osc);
		setTimeout(disconnectOscillator.bind(this), 163);

		function disconnectOscillator() {
			osc.disconnect(this.#gainNode);
		}
	}

	playExplosion() {
		/*
			First tone, 22ms, 13 cycles: 590Hz for 23ms
			Second tone, 53ms, 17 cycles: 320Hz for 54ms
			Third tone, 25ms, 2 cycles: 80Hz for 33ms
			Fourth tone, 17ms, 2 cycles: 117Hz for 25ms
			Off for 17ms
			Fifth tone, 17ms, 1/2 cycle: 30Hz for 33ms
			Total time: 185ms
		*/
		let osc = new OscillatorNode(this.#audioContext);
		osc.connect(this.#gainNode);
		osc.type = 'square';

		osc.frequency.setValueAtTime(590, this.#audioContext.currentTime);
		osc.frequency.setValueAtTime(320, this.#audioContext.currentTime + 0.023);
		osc.frequency.setValueAtTime(80, this.#audioContext.currentTime + 0.077);
		osc.frequency.setValueAtTime(117, this.#audioContext.currentTime + 0.110);
		this.#gainNode.gain.setValueAtTime(0, this.#audioContext.currentTime + 0.135);

		osc.frequency.setValueAtTime(30, this.#audioContext.currentTime + 0.140);
		this.#gainNode.gain.setValueAtTime(this.#audioLevel, this.#audioContext.currentTime + 0.152);
		
		this.startTone(osc);
		setTimeout(disconnectOscillator.bind(this), 185);

		function disconnectOscillator() {
			osc.disconnect(this.#gainNode);
		}
	}

	playDiamondCrushed() {
		/*
			First tone, 2ms, 1 cycle, 500Hz for 2ms
			Second tone, 26ms, 63 cycles: 2,400Hz for 26ms
			Third tone, 27ms, 22 cycles:  815Hz for 27ms
			Fourth tone, 27ms, 41 cycles: 1,500Hz for 28ms
			Fifth tone, 26ms, 21 cycles: 800Hz for 27ms
			Sixth tone, 53ms, 64 cycles: 1,200Hz for 54ms
			Total time: 164ms
		*/
		let osc = new OscillatorNode(this.#audioContext);
		osc.connect(this.#gainNode);
		osc.type = 'square';

		osc.frequency.setValueAtTime(500, this.#audioContext.currentTime);
		osc.frequency.setValueAtTime(2400, this.#audioContext.currentTime + 0.002);
		osc.frequency.setValueAtTime(815, this.#audioContext.currentTime + 0.028);
		osc.frequency.setValueAtTime(1500, this.#audioContext.currentTime + 0.055);
		osc.frequency.setValueAtTime(800, this.#audioContext.currentTime + 0.083);
		osc.frequency.setValueAtTime(1200, this.#audioContext.currentTime + 0.110);

		this.startTone(osc);
		setTimeout(disconnectOscillator.bind(this), 165);

		function disconnectOscillator() {
			osc.disconnect(this.#gainNode);
		}
	}

	playPlayerDie() {
		/*
			First tone, 25ms, 10 cycles: 400Hz for 25ms
			Second tone, 27ms, 24 cycles: 889Hz for 27ms
			Third tone, 28ms, 14 cycles:  500Hz for 28ms
			Fourth tone, 25ms, 5 cycles: 200Hz for 30ms
			Fifth tone, 20ms, 1 cycle: 50Hz for 50ms
			Total time: 160ms
		*/
		let osc = new OscillatorNode(this.#audioContext);
		osc.connect(this.#gainNode);
		osc.type = 'square';

		osc.frequency.setValueAtTime(400, this.#audioContext.currentTime);
		osc.frequency.setValueAtTime(889, this.#audioContext.currentTime + 0.025);
		osc.frequency.setValueAtTime(500, this.#audioContext.currentTime + 0.052);
		osc.frequency.setValueAtTime(200, this.#audioContext.currentTime + 0.080);
		osc.frequency.setValueAtTime(50, this.#audioContext.currentTime + 0.110);

		this.startTone(osc);
		setTimeout(disconnectOscillator.bind(this), 160);

		function disconnectOscillator() {
			osc.disconnect(this.#gainNode);
		}
	}

	playDestroyDirt() {
		/*
			First tone, 30ms, 3 cycles: 100Hz for 30ms
			Second tone, 26ms, 13 cycles: 500Hz for 26ms
			Third tone, 50ms, 1 cycle: 20Hz for 50ms
			Fourth tone, 4ms, 2 cycles: 500Hz for 4ms
			Fifth tone, 40ms, 2 cycles: 50Hz for 60ms
			Total time: 170ms
		*/
		let osc = new OscillatorNode(this.#audioContext);
		osc.connect(this.#gainNode);
		osc.type = 'square';

		osc.frequency.setValueAtTime(100, this.#audioContext.currentTime);
		osc.frequency.setValueAtTime(500, this.#audioContext.currentTime + 0.030);
		osc.frequency.setValueAtTime(20, this.#audioContext.currentTime + 0.056);
		osc.frequency.setValueAtTime(500, this.#audioContext.currentTime + 0.106);
		osc.frequency.setValueAtTime(50, this.#audioContext.currentTime + 0.110);

		this.startTone(osc);
		setTimeout(disconnectOscillator.bind(this), 170);

		function disconnectOscillator() {
			osc.disconnect(this.#gainNode);
		}
	}

	playRockFall() {
		/*
			First tone, 23ms, 7 cycles, 304Hz for 25ms
			Off for 48ms
			Second tone, 80ms, 7 cycles: 87Hz for 87ms
			Total time: 160ms
		*/
		let osc = new OscillatorNode(this.#audioContext);
		osc.connect(this.#gainNode);
		osc.type = 'square';

		osc.frequency.setValueAtTime(304, this.#audioContext.currentTime);
		this.#gainNode.gain.setValueAtTime(0, this.#audioContext.currentTime + 0.025);

		osc.frequency.setValueAtTime(87.5, this.#audioContext.currentTime + 0.03);
		this.#gainNode.gain.setValueAtTime(this.#audioLevel, this.#audioContext.currentTime + 0.073);
		
		this.startTone(osc);
		setTimeout(disconnectOscillator.bind(this), 160);

		function disconnectOscillator() {
			osc.disconnect(this.#gainNode);
		}
	}

	startTone(osc) {
		if (osc.start) {
			osc.start(0);
		} else {
			osc.noteOn(0);
		}
	}

	finaliseField() {
		// Get the list of empty cells in the field
		let emptyCells = this.findAllCellsOfType(spriteEnum.BLANK);
		// Pick one cell at random
		let rnd = Math.floor(Math.random() * emptyCells.length);
		// Remove it from the array of empty cells
		let index = emptyCells.splice(rnd, 1)[0];

		// Place the player at that index
		this.#dozer = new Dozer(index);
		this.#grid[index] = this.#dozer;

		// Pick another empty cell at random
		rnd = Math.floor(Math.random() * emptyCells.length);
		index = emptyCells.splice(rnd, 1)[0];
		// Place the exit at that index
		this.#grid[index] = new Exit();

		this.#availableScore = this.getRemainingScore();
		this.#targetScore = Math.floor(this.#availableScore * this.#difficultyScoreFactor[this.#difficulty]);

		console.log(`Available score is ${this.#availableScore}, target score is ${this.#targetScore}`);

		// Remove flag that was holding up gameplay
		this.#fieldInitialising = false;
	}

	getRemainingScore()	{
		let emeralds = this.findAllCellsOfType(spriteEnum.EMERALD).length;
		let diamonds = this.findAllCellsOfType(spriteEnum.DIAMOND).length;
		return (diamonds * 5) + emeralds;
	}

	updateField() {
		// We get ordering issues when moving items around.
		// If we do a single pass through the field, items can be updated twice (two movements in one tick of time)
		// If an item moves to the right (in order to fall down), and we are iterating left-to-right,
		// it will be updated twice (right and down)

		// Track if there are any field changes
		// so we know when the board has settled and we can place
		// the dozer and exit.
		let changes = false;

		// Move the bugs separately, since they can move in any direction.
		// Too tricky to avoid moving them twice in a single update (frame)
		this.moveBugs();

		for (let c = this.#grid.length - 1; c >= 0; c--) {
			let obj = this.#grid[c];

			if (obj === spriteEnum.BLANK)
				continue;

			// Check if cell is an explosion
			if (obj instanceof Explosion) {
				changes = true;
				if (obj.isNewExplosion) {
					obj.isNewExplosion = false;
				} else {
					this.#grid[c] = spriteEnum.BLANK;
				}
				continue;
			}

			// Check if cell is a DroppedGrenade
			if (obj instanceof DroppedGrenade) {
				if (obj.tick()) {
					this.createExplosion(c);
					this.playExplosion();
				}
			}

			if (!obj.gravity)
				continue;

			// Deal with items on the bottom row
			if (this.checkEdgeBottom(c)) {
				// If item is falling and explosive
				if (obj.isFalling) {
					obj.isFalling = false;

					if (obj instanceof Gem) {
						this.playGemFall();
					}

					if (obj instanceof Rock) {
						this.playRockFall();
					}

					if (obj.isExplosive) {
						changes = true;
						this.createExplosion(c);
						this.playExplosion();
					}
				}

				// Don't bother checking other items on bottom row
				continue;
			}

			let cellBelow = c + this.#fieldX;
			let objBelow = this.#grid[cellBelow];
			// Check if cell below is empty, OR if item is falling and item below can be crushed
			if (!objBelow || obj.isFalling && objBelow.canBeCrushed) {
				changes = true;
				// If item below is explosive, go bang!
				if (objBelow && objBelow.isExplosive) {
					this.createExplosion(cellBelow);
					this.playExplosion();
					continue;
				}
				// If item below is dozer, die
				else if (objBelow == this.#dozer) {
					this.playPlayerDie();
					this.#playerDyingCallback('You got crushed!');
				}

				if (objBelow instanceof Diamond) {
					this.playDiamondCrushed();
				}

				// Propogate item down
				obj.isFalling = true;
				this.#grid[cellBelow] = obj;
				this.#grid[c] = spriteEnum.BLANK;
			}
			// Else check if item is falling and explosive (already ruled out empty cell below)
			else if (obj.isFalling && obj.isExplosive) {
				changes = true;
				this.createExplosion(c);
				this.playExplosion();
			}
			// Else check if item below is uneven and it can fall left (cell left and below left are empty)
			// If we move item to the left, skip it (decrement the counter) so it doesn't get processed twice
			else if (!this.checkEdgeLeft(c) && objBelow.isUneven && !this.#grid[c - 1] && !this.#grid[c - 1 + this.#fieldX]) {
				if (obj.isFalling && obj instanceof Gem) {
					this.playGemFall();
				}
				if (obj.isFalling && obj instanceof Rock) {
					this.playRockFall();
				}
				changes = true;
				obj.isFalling = true;
				this.#grid[c - 1] = obj;
				this.#grid[c] = spriteEnum.BLANK;
				c--;
			}
			// Else check if item below is uneven and it can fall right (cell right and below right are empty)
			else if (!this.checkEdgeRight(c) && objBelow.isUneven && !this.#grid[c + 1] && !this.#grid[c + 1 + this.#fieldX]) {
				if (obj.isFalling && obj instanceof Gem) {
					this.playGemFall();
				}
				if (obj.isFalling && obj instanceof Rock) {
					this.playRockFall();
				}
				changes = true;
				obj.isFalling = true;
				this.#grid[c + 1] = obj;
				this.#grid[c] = spriteEnum.BLANK;
			}
			// Else check if item below is solid (can't be crushed) to disable falling.
			else if (obj.isFalling) {
				if (obj instanceof Gem) {
					this.playGemFall();
				}
				if (obj instanceof Rock) {
					this.playRockFall();
				}
				changes = true;
				obj.isFalling = false;
			}
		}

		if (this.#fieldInitialising && !changes)
			this.finaliseField();
	}

	moveBugs() {
		var bugArray = this.findAllCellsOfType(spriteEnum.BUG);
		var movementFunctions = new Array(this.moveBugUp.bind(this), this.moveBugRight.bind(this), this.moveBugDown.bind(this), this.moveBugLeft.bind(this));

		bugArray.forEach((c) => {
			let bug = this.#grid[c];
			// Always try to go "left" (relative to current direction) first,
			for (const i of new Array(3, 0, 1, 2)) {
				let tryDirection = (bug.Direction + i) % 4;
				if (movementFunctions[tryDirection](c)) {
					bug.Direction = tryDirection;
					break;
				}
			}
		});
	}

	moveBugUp(c) {
		// Move UP case
		// (on left edge or left cell is not empty or top-left cell is not empty)
		// AND
		// (cell above is not edge and is empty)
		if ((this.checkEdgeLeft(c) || this.#grid[c-1] || (!this.checkEdgeTop(c) && this.#grid[c-this.#fieldX-1]))
			&&
			(!this.checkEdgeTop(c) && !this.#grid[c-this.#fieldX])) {
			let newCell = c-this.#fieldX;
			this.#grid[newCell] = this.#grid[c];
			this.#grid[c] = 0;
			this.checkBugDozerProximity(newCell);
			return true;
		}
		return false;
	}

	moveBugRight(c) {
		// Move RIGHT case
		// (on top edge or top cell is not empty or top-right cell is not empty)
		// AND
		// (cell right is not edge and is empty)
		if ((this.checkEdgeTop(c) || this.#grid[c-this.#fieldX] || (!this.checkEdgeRight(c) && this.#grid[c-this.#fieldX+1]))
			&&
			(!this.checkEdgeRight(c) && !this.#grid[c+1])) {
			let newCell = c+1;
			this.#grid[newCell] = this.#grid[c];
			this.#grid[c] = 0;
			this.checkBugDozerProximity(newCell);
			return true;
		}
		return false;
	}

	moveBugDown(c) {
		// Move DOWN case
		// (on right edge or right cell is not empty or bottom-right cell is not empty)
		// AND
		// (cell below is not edge and is empty)
		if ((this.checkEdgeRight(c) || this.#grid[c+1] || (!this.checkEdgeBottom(c) && this.#grid[c+this.#fieldX+1]))
			&&
			(!this.checkEdgeBottom(c) && !this.#grid[c+this.#fieldX])) {
			let newCell = c+this.#fieldX;
			this.#grid[newCell] = this.#grid[c];
			this.#grid[c] = 0;
			this.checkBugDozerProximity(newCell);
			return true;
		}
		return false;
	}

	moveBugLeft(c) {
		// Move LEFT case
		// (on bottom edge or bottom cell is not empty or bottom-left cell is not empty)
		// AND
		// (cell left is not edge and is empty)
		if ((this.checkEdgeBottom(c) || this.#grid[c+this.#fieldX] || (!this.checkEdgeLeft(c) && this.#grid[c+this.#fieldX-1]))
			&&
			(!this.checkEdgeLeft(c) && !this.#grid[c-1])) {
			let newCell = c-1;
			this.#grid[newCell] = this.#grid[c];
			this.#grid[c] = 0;
			this.checkBugDozerProximity(newCell);
			return true;
		}
		return false;
	}

	checkBugDozerProximity(n) {
		// If the passed in cell contains a Bug, we are looking for Dozer
		let lookingFor = null;

		if (this.#grid[n] instanceof Bug) {
			lookingFor = Dozer;
		} else if (this.#grid[n] instanceof Dozer) {
			lookingFor = Bug;
		} else {
			return;
		}

		let rStart = this.checkEdgeTop(n) ? 0 : -1;
		let rEnd = this.checkEdgeBottom(n) ? 0 : 1;
		let cStart = this.checkEdgeLeft(n) ? 0 : -1;
		let cEnd = this.checkEdgeRight(n) ? 0 : 1;

		// Create a 3x3 explosion grid
		for (let r = rStart; r <= rEnd; r++) {
			for (let c = cStart; c <= cEnd; c++) {
				let checkCell = n + (r * this.#fieldX) + c;
				if (this.#grid[checkCell] instanceof lookingFor) {
					// Center the explosion on the bug
					let explosionCell = (this.#grid[checkCell] instanceof Bug) ? checkCell : n;
					this.createExplosion(explosionCell);
				}
			}
		}
	}


	checkEdgeLeft(n) {
		return (n % this.#fieldX) === 0;
	}

	checkEdgeRight(n) {
		return (n % this.#fieldX) === (this.#fieldX - 1);
	}

	checkEdgeTop(n) {
		return Math.floor(n / this.#fieldX) === 0;
	}

	checkEdgeBottom(n) {
		return Math.floor(n / this.#fieldX) === (this.#fieldY - 1);
	}

	convertTupleToSingle(x, y) {
		return (y * this.#fieldX) + x;
	}

	convertSingleToTuple(n) {
		return {
			x: n % this.#fieldX,
			y: Math.floor(n / this.#fieldX)
		};
	}

	createExplosion(cellNum) {
		// Clear center square contents (eg grenade/bomb) to avoid infinite recursion.
		this.#grid[cellNum] = 0;

		let rStart = this.checkEdgeTop(cellNum) ? 0 : -1;
		let rEnd = this.checkEdgeBottom(cellNum) ? 0 : 1;
		let cStart = this.checkEdgeLeft(cellNum) ? 0 : -1;
		let cEnd = this.checkEdgeRight(cellNum) ? 0 : 1;

		// Create a 3x3 explosion grid
		for (let r = rStart; r <= rEnd; r++) {
			for (let c = cStart; c <= cEnd; c++) {
				let checkCell = cellNum + (r * this.#fieldX) + c;

				// Can't check grid, since if we sit on a dropped grenade we don't exist in the grid
				// If it contains dozer, die
				if (!this.#fieldInitialising && checkCell === this.#dozer.pos) {
					this.playPlayerDie();
					this.#playerDyingCallback('You got asploded!');
				}

				// If cell contains an object and it's explosive, recurse
				if (this.#grid[checkCell] && this.#grid[checkCell].isExplosive) {
					this.createExplosion(checkCell);
					continue;
				}

				// If cell is empty OR object can be destroyed.
				if (!this.#grid[checkCell] || this.#grid[checkCell].canBeDestroyed) {
					this.#grid[checkCell] = new Explosion();
				}
			}
		}
	}

	populateFieldWithType(t) {
		// Get an array of all the empty field cells
		let emptyCells = this.findAllCellsOfType(spriteEnum.BLANK);

		// Default field size is 800
		// Calculate a scaling factor for this field, based on size
		let scale = (this.#fieldX * this.#fieldY) / 800;
		let desiredQty = Math.round(this.#difficultyDistribution[this.#difficulty][t] * scale);

		for (let i = 0; i < desiredQty; i++) {
			// Pick a random value from the array of empty cells
			let rnd = Math.floor(Math.random() * emptyCells.length);
			// Splice deletes 1 cell from the empty array, at position random
			// And returns the value removed
			let index = emptyCells.splice(rnd, 1)[0];
			this.#grid[index] = new classArray[t]();
		}
	}

	findAllCellsOfType(t) {
		// https://stackoverflow.com/a/41271541/5329728
		// e for element, i for index
		return this.#grid.map(function(e, i){
			if(t === spriteEnum.BLANK)
			{
				// Check if grid cell contains "blank" (0)
				return e === t ? i : '';
			}
			// Check if grid cell is an instance of the specified class type
			return e instanceof classArray[t] ? i : '';
		}).filter(String);
	}

	addRandomDiamond() {
		let rnd = Math.floor(Math.random() * this.#fieldX);
		this.#grid[rnd] = new Diamond();
	}

	handleInput(e) {
		// If we are still initialising the field
		// and haven't placed the dozer yet, ignore input
		if(this.#fieldInitialising)
			return;
		
		let dozerPos = this.#dozer.pos;
		let sittingOnGrenade = this.#grid[dozerPos] instanceof DroppedGrenade;
		
		var key = e.key || e.keyCode;
		switch (key) {
		// Up key
			case 'ArrowUp':
			case 38:
				e.preventDefault();
				// If we're on the top edge already, give up
				if (this.checkEdgeTop(dozerPos))
					return;

				var objAbove = this.#grid[dozerPos - this.#fieldX];
				// Check if cell above is either empty or can pass through
				if (!objAbove || objAbove.canPassThrough) {
					if (!sittingOnGrenade) {
						this.#grid[dozerPos] = spriteEnum.BLANK;
					}
					this.#dozer.pos -= this.#fieldX;
				} else if (objAbove instanceof Exit && this.#gameScore >= this.#targetScore) {
					this.#grid[dozerPos] = spriteEnum.BLANK;
					this.#dozer.pos -= this.#fieldX;
					console.log('You win!');
					this.#playerWonCallback();
				}
				break;

			// Down key
			case 'ArrowDown':
			case 40:
				e.preventDefault();
				// If we're on the bottom edge already, give up
				if (this.checkEdgeBottom(dozerPos))
					return;

				var objBelow = this.#grid[dozerPos + this.#fieldX];
				// Check if cell is either empty or can pass through
				if (!objBelow || objBelow.canPassThrough) {
					if (!sittingOnGrenade) {
						this.#grid[dozerPos] = spriteEnum.BLANK;
					}
					this.#dozer.pos += this.#fieldX;
				} else if (objBelow instanceof Exit && this.#gameScore >= this.#targetScore) {
					this.#grid[dozerPos] = spriteEnum.BLANK;
					this.#dozer.pos += this.#fieldX;
					console.log('You win!');
					this.#playerWonCallback();
				}
				break;

			// Left key
			case 'ArrowLeft':
			case 37:
				e.preventDefault();
				// If we're on the left edge already, give up
				if (this.checkEdgeLeft(dozerPos))
					return;

				var objLeft = this.#grid[dozerPos - 1];
				// Check if cell is either empty or can pass through
				if (!objLeft || objLeft.canPassThrough) {
					if (!sittingOnGrenade) {
						this.#grid[dozerPos] = spriteEnum.BLANK;
					}
					this.#dozer.pos -= 1;
				}
				// If we are at least 2 squares from left edge (square to our left is not the edge)
				// and item to left is pushable AND item to left of that is empty
				else if (!this.checkEdgeLeft(dozerPos - 1) && objLeft.isPushable && !this.#grid[dozerPos - 2]) {
				// Push the item left
					this.#grid[dozerPos - 2] = this.#grid[dozerPos - 1];
					if (!sittingOnGrenade) {
						this.#grid[dozerPos] = spriteEnum.BLANK;
					}
					this.#dozer.pos -= 1;
				} else if (objLeft instanceof Exit && this.#gameScore >= this.#targetScore) {
					this.#grid[dozerPos] = spriteEnum.BLANK;
					this.#dozer.pos -= 1;
					console.log('You win!');
					this.#playerWonCallback();
				}
				break;

			// Right key
			case 'ArrowRight':
			case 39:
				e.preventDefault();
				// If we're on the right edge already, give up
				if (this.checkEdgeRight(dozerPos))
					return;

				var objRight = this.#grid[dozerPos + 1];
				// Check if cell is either empty or can pass through
				if (!objRight || objRight.canPassThrough) {
					if (!sittingOnGrenade) {
						this.#grid[dozerPos] = spriteEnum.BLANK;
					}
					this.#dozer.pos += 1;
				}
				// If we are at least 2 squares from right edge (square to our right is not the edge)
				// and item to right is pushable AND item to right of that is empty
				else if (!this.checkEdgeRight(dozerPos + 1) && objRight.isPushable && !this.#grid[dozerPos + 2]) {
				// Push the item right
					this.#grid[dozerPos + 2] = this.#grid[dozerPos + 1];
					if (!sittingOnGrenade) {
						this.#grid[dozerPos] = spriteEnum.BLANK;
					}
					this.#dozer.pos += 1;
				} else if (objRight instanceof Exit && this.#gameScore >= this.#targetScore) {
					this.#grid[dozerPos] = spriteEnum.BLANK;
					this.#dozer.pos += 1;
					console.log('You win!');
					this.#playerWonCallback();
				}
				break;

			// Space key
			case ' ':
			case 32:
				e.preventDefault();
				if (this.#dozer.hasGrenades()) {
					this.#dozer.useGrenade();
					this.#grid[dozerPos] = new DroppedGrenade();
				}
				break;
		}

		let newPosObj = this.#grid[this.#dozer.pos];

		if ((newPosObj instanceof Grenade) && !(newPosObj instanceof DroppedGrenade)) {
			this.#dozer.pickupGrenade();
		} else if (newPosObj instanceof Gem) {
			this.#gameScore += newPosObj.score;
			console.log(`Ate a gem, score ${this.#gameScore}/${this.#targetScore} (${this.getRemainingScore()} remaining)`);
		}

		if (newPosObj instanceof Dirt) {
			this.playDestroyDirt();
		}

		// Set grid location to dozer, unless a grenade was dropped
		if (!(newPosObj instanceof DroppedGrenade)) {
			this.#grid[this.#dozer.pos] = this.#dozer;
		}

		this.checkBugDozerProximity(this.#dozer.pos);

		// Explicitly clear the old dozer position 
		// Otherwise we need to wait for the next game tick to clear the canvas
		this.clearCell(dozerPos);
		// Perform an additional render on each keystroke to keep the game responsive
		this.renderField();
	}

	clearCell(n) {
		let p = this.convertSingleToTuple(n);
		let s = EmeraldHunt.SPRITESIZE;
		let x = p.x * s;
		let y = p.y * s;
		this.#ctx.fillStyle = colorEnum.BLACK;
		this.#ctx.fillRect(x, y, s+1, s+1);
	}

	renderField() {
		this.#grid.forEach((e, i) => {
			if (!e)
				return;

			let x = EmeraldHunt.SPRITESIZE * (i % this.#fieldX);
			let y = EmeraldHunt.SPRITESIZE * Math.floor(i / this.#fieldX);
			this.#ctx.drawImage(e.image, x, y);
		});
		this.renderScoreBar();
	}

	renderScoreBar() {
		// Wipe scorebar first to prevent flicker
		this.#ctx.fillStyle = colorEnum.BLACK;
		this.#ctx.fillRect(0, (EmeraldHunt.SPRITESIZE * this.#fieldY)-1, EmeraldHunt.SPRITESIZE * this.#fieldX, EmeraldHunt.SPRITESIZE * 1.5);

		// Draw horizontal line
		this.#ctx.strokeStyle = colorEnum.WHITE;
		this.#ctx.beginPath();
		this.#ctx.moveTo(0, EmeraldHunt.SPRITESIZE * this.#fieldY);
		this.#ctx.lineTo(EmeraldHunt.SPRITESIZE * this.#fieldX, EmeraldHunt.SPRITESIZE * this.#fieldY);
		this.#ctx.stroke();

		let y = EmeraldHunt.SPRITESIZE * (this.#fieldY+1);
		this.#ctx.font = EmeraldHunt.FONT;

		// Write score
		this.#ctx.fillStyle = colorEnum.WHITE;
		this.#ctx.fillText('score :', 1, y);
		// Ensure targetscore has value, then compare to gamescore
		this.#ctx.fillStyle = this.#targetScore && this.#gameScore >= this.#targetScore ? colorEnum.GREEN : colorEnum.RED;
		this.#ctx.fillText(this.#gameScore, 62, y);

		// Write goal
		this.#ctx.fillStyle = colorEnum.WHITE;
		this.#ctx.fillText('goal :', 100, y);
		this.#ctx.fillStyle = colorEnum.RED;
		this.#ctx.fillText(this.#targetScore, 152, y);

		// Write grenades
		let grenades = 0;
		if(this.#dozer) {
			grenades = this.#dozer.numGrenades;
		}
		this.#ctx.fillStyle = colorEnum.WHITE;
		this.#ctx.fillText('grenades :', 190, y);
		this.#ctx.fillStyle = colorEnum.RED;
		this.#ctx.fillText(grenades, 275, y);

		// Write help text
		this.#ctx.fillStyle = colorEnum.WHITE;
		//this.#ctx.fillText('F1=HELP  ESC=QUIT  ENTER=SAVE', 340, y);
	}
}

export { Field };