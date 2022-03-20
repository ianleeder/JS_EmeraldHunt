'use strict';

import { stateEnum, difficultyEnum } from './enums.js';
import { Diamond, Gem, Exit, Dozer, Explosion, Grenade, DroppedGrenade, spriteEnum, classArray } from './objects.js';
import { EmeraldHunt } from './hunt.js';

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
let difficultyDistribution = {};
difficultyDistribution[difficultyEnum.EASY] =    [0, 100, 60, 150, 50, 0, 0, 0, 50, 0, 0, 0, 0, 20, 0, 0];
difficultyDistribution[difficultyEnum.MEDIUM] =  [0, 80, 60, 150, 50, 0, 0, 0, 50, 0, 20, 0, 0, 10, 0, 0];
difficultyDistribution[difficultyEnum.HARD] =    [0, 90, 90, 90, 90, 20, 0, 0, 50, 0, 90, 0, 0, 10, 0, 0];
difficultyDistribution[difficultyEnum.HARDER] =  [0, 100, 60, 0, 50, 0, 0, 0, 50, 0, 180, 0, 0, 10, 0, 0];
difficultyDistribution[difficultyEnum.HARDEST] = [0, 100, 60, 150, 50, 0, 0, 0, 50, 0, 0, 0, 0, 10, 0, 0];

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
	#gameScore;

	// Amount of score available at the start of the game
	#availableScore;

	// Target score to unlock the exit
	#targetScore;

	// Multiplication factor to determine target score from total available field score
	#targetScoreFactor = 0.9;

	// Callback to the Hunt object playerDying function
	#playerDyingCallback;

	// Audio context
	#audioContext;

	constructor(c, diff, dyingCallback) {
		this.#ctx = c;
		this.#fieldX = EmeraldHunt.DEFAULTFIELDX;
		this.#fieldY = EmeraldHunt.DEFAULTFIELDY;
		this.#difficulty = diff;
		this.initField();
		this.#fieldInitialising = true;
		this.#gameScore = 0;
		this.#playerDyingCallback = dyingCallback;
		this.#audioContext = new (window.AudioContext || window.webkitAudioContext);
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

	playDestroyDirt() {
		/*
			First tone
				30ms, 3 cycles, 100Hz for 30ms
			Second tone
				26ms, 13 cycles, 500Hz for 26ms
			Third tone
				50ms, 1 cycle, 20Hz for 50ms
			Fourth tone
				4ms, 2 cycles, 500Hz for 4ms
			Fifth tone
				40ms, 2 cycles, 50Hz for 60ms
			Total time: 170ms
		*/
		let osc = new OscillatorNode(this.#audioContext);
		osc.connect(this.#audioContext.destination);
		osc.type = 'square';

		osc.frequency.setValueAtTime(100, this.#audioContext.currentTime);
		osc.frequency.setValueAtTime(500, this.#audioContext.currentTime + 0.030);
		osc.frequency.setValueAtTime(20, this.#audioContext.currentTime + 0.056);
		osc.frequency.setValueAtTime(500, this.#audioContext.currentTime + 0.106);
		osc.frequency.setValueAtTime(50, this.#audioContext.currentTime + 0.110);

		this.startTone(osc);
		setTimeout(disconnectOscillator.bind(this), 170);

		function disconnectOscillator() {
			osc.disconnect(this.#audioContext.destination);
		}
	}

	playStoneFall() {
		/*
			Rock fall
			(frequency calc only)
			7 square wave cycles in 23ms
			T = 23/7
			f = 1/T = 7/.023 = 304Hz
			
			304Hz for 25ms
			Silence for 48ms
			
			(frequency calc only)
			7 square wave cycles in 80ms
			f = 7/0.08 = 87.5Hz

			87.5Hz for 87ms
		*/
		let osc = new OscillatorNode(this.#audioContext);
		osc.connect(this.#audioContext.destination);
		osc.type = 'square';

		let gainNode = this.#audioContext.createGain();

		// Play first freq
		gainNode.gain.value = 1;
		osc.frequency.setValueAtTime(304, this.#audioContext.currentTime);

		// After 25ms mute
		gainNode.gain.setValueAtTime(0, this.#audioContext.currentTime + 0.025);
		// After 30ms switch frequency
		osc.frequency.setValueAtTime(87.5, this.#audioContext.currentTime + 0.03);
		// After 25+48ms unmute
		gainNode.gain.setValueAtTime(1, this.#audioContext.currentTime + 0.073);

		this.startTone(osc);
		// Stop after 25+48+87ms
		setTimeout(disconnectOscillator.bind(this), 160);

		function disconnectOscillator() {
			osc.disconnect(this.#audioContext.destination);
		}
	}

	startTone(osc) {
		if (osc.start) {
			osc.start(0);
		} else {
			osc.noteOn(0);
		}
	}

	stopTone(osc) {
		if (osc.stop) {
			osc.stop(0);
		} else {
			osc.noteOff(0);
		}
	}

	// Taking audio code from here
	// https://stackoverflow.com/a/13194241/5329728
	beep(duration, type) {
		if (!(window.AudioContext || window.webkitAudioContext)) {
			throw Error('Your browser does not support Audio Context.');
		}
	
		duration = +duration;
	
		// Only 0-4 are valid types.
		//type = (type % 5) || 0;
	
		var ctx = new (window.AudioContext || window.webkitAudioContext);
		var osc = ctx.createOscillator();
	
		osc.type = type;
	
		osc.connect(ctx.destination);
		if (osc.start) {
			osc.start(0);
		} else {
			osc.noteOn(0);
		}
	
		setTimeout(function() {
			if (osc.stop) {
				osc.stop(0);
			} else {
				osc.noteOff(0);
			}
		}, duration);
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
		this.#targetScore = Math.floor(this.#availableScore * this.#targetScoreFactor);

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
				}
			}

			if (!obj.gravity)
				continue;

			// Deal with items on the bottom row
			if (this.checkEdgeBottom(c)) {
				// If item is falling and explosive
				if (obj.isFalling) {
					obj.isFalling = false;

					if (obj.isExplosive) {
						changes = true;
						this.createExplosion(c);
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
					continue;
				}
				// If item below is dozer, die
				else if (objBelow == this.#dozer) {
					this.#playerDyingCallback('You got crushed!');
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
			}
			// Else check if item below is uneven and it can fall left (cell left and below left are empty)
			// If we move item to the left, skip it (decrement the counter) so it doesn't get processed twice
			else if (!this.checkEdgeLeft(c) && objBelow.isUneven && !this.#grid[c - 1] && !this.#grid[c - 1 + this.#fieldX]) {
				changes = true;
				this.#grid[c - 1] = obj;
				this.#grid[c] = spriteEnum.BLANK;
				c--;
			}
			// Else check if item below is uneven and it can fall right (cell right and below right are empty)
			else if (!this.checkEdgeRight(c) && objBelow.isUneven && !this.#grid[c + 1] && !this.#grid[c + 1 + this.#fieldX]) {
				changes = true;
				this.#grid[c + 1] = obj;
				this.#grid[c] = spriteEnum.BLANK;
			}
			// Else check if item below is solid (can't be crushed) to disable falling.
			else if (obj.isFalling) {
				changes = true;
				obj.isFalling = false;
			}
		}

		if (this.#fieldInitialising && !changes)
			this.finaliseField();
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
		return { x: n % this.#fieldX, y: Math.floor(n / this.#fieldX) };
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
					// TODO Deal with death here
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
		let desiredQty = Math.round(difficultyDistribution[this.#difficulty][t] * scale);

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

			// "sine", "square", "sawtooth", "triangle"
			case '1':
				this.beep(1000, 'sine');
				break;

			case '2':
				this.beep(1000, 'square');
				break;

			case '3':
				this.beep(1000, 'sawtooth');
				break;

			case '4':
				this.beep(1000, 'triangle');
				break;
			
			case '5':
				this.playStoneFall();
				break;
			
			case '6':
				this.playDestroyDirt();
				break;
		}

		let newPosObj = this.#grid[this.#dozer.pos];

		if ((newPosObj instanceof Grenade) && !(newPosObj instanceof DroppedGrenade)) {
			this.#dozer.pickupGrenade();
		} else if (newPosObj instanceof Gem) {
			this.#gameScore += newPosObj.score;
			console.log(`Ate a gem, score ${this.#gameScore}/${this.#targetScore} (${this.getRemainingScore()} remaining)`);
		}

		// Set grid location to dozer, unless a grenade was dropped
		if (!(newPosObj instanceof DroppedGrenade)) {
			this.#grid[this.#dozer.pos] = this.#dozer;
		}

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
		this.#ctx.fillStyle = '#000000';
		this.#ctx.fillRect(x, y, s, s);
	}

	renderField() {
		this.#grid.forEach((e, i) => {
			if (!e)
				return;

			let x = EmeraldHunt.SPRITESIZE * (i % this.#fieldX);
			let y = EmeraldHunt.SPRITESIZE * Math.floor(i / this.#fieldX);
			this.#ctx.drawImage(e.image, x, y);
		});
	}
}

export { Field };