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
difficultyDistribution[difficultyEnum.MEDIUM] =  [0, 80, 60, 150, 50, 0, 0, 0, 50, 0, 20, 0, 0, 20, 0, 0];
difficultyDistribution[difficultyEnum.HARD] =    [0, 80, 60, 150, 50, 0, 0, 0, 50, 0, 20, 0, 0, 20, 0, 0];
difficultyDistribution[difficultyEnum.HARDER] =  [0, 100, 60, 150, 50, 0, 0, 0, 50, 0, 0, 0, 0, 20, 0, 0];
difficultyDistribution[difficultyEnum.HARDEST] = [0, 100, 60, 150, 50, 0, 0, 0, 50, 0, 0, 0, 0, 20, 0, 0];

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
	#targetScoreFactor = 0.8;

	// TODO: Add callbacks for changing game state (dying, dead)
	constructor(c, diff) {
		this.#ctx = c;
		this.#fieldX = EmeraldHunt.DEFAULTFIELDX;
		this.#fieldY = EmeraldHunt.DEFAULTFIELDY;
		this.#difficulty = diff;
		this.initField();
		this.#fieldInitialising = true;
		this.#gameScore = 0;
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

	finaliseField() {
		this.#fieldInitialising = false;

		let emptyCells = this.findAllCellsOfType(spriteEnum.BLANK);
		let rnd = Math.floor(Math.random() * emptyCells.length);
		let index = emptyCells.splice(rnd, 1)[0];

		this.#dozer = new Dozer(index);
		this.#grid[index] = this.#dozer;

		rnd = Math.floor(Math.random() * emptyCells.length);
		index = emptyCells.splice(rnd, 1)[0];
		this.#grid[index] = new Exit();
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
					deathMessage = 'You got crushed!';
					gameState = DYING;
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
				if (checkCell === this.#dozer.pos) {
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
		return this.#grid.map((e, i) => e === t ? i : '').filter(String);
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
		}

		let newPosObj = this.#grid[this.#dozer.pos];

		if ((newPosObj instanceof Grenade) && !(newPosObj instanceof DroppedGrenade)) {
			this.#dozer.pickupGrenade();
		} else if (newPosObj instanceof Gem) {
			this.#gameScore += newPosObj.score;
			console.log(`Ate a gem, new score ${this.#gameScore}`);
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