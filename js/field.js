'use strict';

import {stateEnum, difficultyEnum} from "./enums.js";
import {Emerald, Diamond, Dirt, Rock, Brick, Bomb, Exit, Dozer, Cobblestone, Bug, Explosion, Grenade, DroppedGrenade, spriteEnum, classArray} from "./objects.js";
import {EmeraldHunt} from "./hunt.js";

// Types are stored in the same array order as the sprites]
let difficultyDistribution = {};
difficultyDistribution[difficultyEnum.EASY] =		[0,100,60,150,50,0,0,0,50,0,0,0,0,20,0,0];
difficultyDistribution[difficultyEnum.MEDIUM] =		[0,100,60,150,50,0,0,0,50,0,0,0,0,20,0,0];
difficultyDistribution[difficultyEnum.HARD] =		[0,100,60,150,50,0,0,0,50,0,0,0,0,20,0,0];
difficultyDistribution[difficultyEnum.HARDER] =		[0,100,60,150,50,0,0,0,50,0,0,0,0,20,0,0];
difficultyDistribution[difficultyEnum.HARDEST] =	[0,100,60,150,50,0,0,0,50,0,0,0,0,20,0,0];

class Field {
	#ctx;
	#fieldX;
	#fieldY;
	#difficulty;
	#grid;
	#dozer;
	#newGame;

	constructor(c, diff) {
		this.#ctx = c;
		this.#fieldX = EmeraldHunt.DEFAULTFIELDX;
		this.#fieldY = EmeraldHunt.DEFAULTFIELDY;
		this.#difficulty = diff;
		this.initField();
		this.#newGame = true;
	}

	initField() {
		// Move to storing the field in a 1D array
		this.#grid = new Array(this.#fieldX * this.#fieldY).fill(spriteEnum.BLANK);

		// If this field is being used for a menu background, leave it blank
		// It will self-populate
		if(this.#difficulty === stateEnum.MENU)
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
		let emptyCells = this.findAllCellsOfType(spriteEnum.BLANK);
		let rnd = Math.floor(Math.random() * emptyCells.length);
		let index = emptyCells.splice(rnd, 1);
		this.#dozer = new Dozer(index);

		rnd = Math.floor(Math.random() * emptyCells.length);
		index = emptyCells.splice(rnd, 1);
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
		for(let c=this.#grid.length-1;c>=0;c--) {
			let obj = this.#grid[c];

			if(obj === spriteEnum.BLANK)
				continue;

			// Check if cell is an explosion
			if(obj instanceof Explosion) {
				if(obj.newExplosion) {
					obj.newExplosion = false;
				} else {
					this.#grid[cell] = spriteEnum.BLANK;
				}
				continue;
			}

			// Check if cell is a DroppedGrenade
			if(obj instanceof DroppedGrenade) {
				if(--obj.timer <= 0) {
					createExplosion(c);
				}
			}

			if(!obj.gravity)
				continue;

			// Deal with items on the bottom row
			if(this.checkEdgeBottom(c)) {
				// If item is falling and explosive
				if(obj.isFalling) {
					obj.isFalling = false;

					if(obj.isExplosive)
						createExplosion(i, j);
				}

				// Don't bother checking other items on bottom row
				continue;
			}

			let cellBelow = c + this.#fieldX;
			let objBelow = this.#grid[cellBelow];
			// Check if cell below is empty, OR if item is falling and item below can be crushed
			if(!objBelow || obj.isFalling && objBelow.canBeCrushed) {
				// If item below is explosive, go bang!
				if(objBelow && objBelow.isExplosive) {
					createExplosion(cellBelow);
					continue;
				}
				// If item below is dozer, die
				else if(objBelow==this.#dozer) {
					deathMessage = "You got crushed!";
					gameState = DYING;
				}

				// Propogate item down
				obj.isFalling = true;
				this.#grid[cellBelow] = obj;
				this.#grid[c] = spriteEnum.BLANK;
			}
			// Else check if item is falling and explosive (already ruled out empty cell below)
			else if(obj.isFalling && obj.isExplosive) {
				createExplosion(c);
			}
			// Else check if item below is uneven and it can fall left (cell left and below left are empty)
			// If we move item to the left, decrement the counter so it doesn't get processed twice
			else if(!this.checkEdgeLeft(c) && objBelow.isUneven && !this.#grid[c-1] && !this.#grid[c-1+this.#fieldX]) {
				this.#grid[c-1] = obj;
				this.#grid[c] = spriteEnum.BLANK;
				c--;
			}
			// Else check if item below is uneven and it can fall right (cell right and below right are empty)
			else if(!this.checkEdgeRight(c) && objBelow.isUneven && !this.#grid[c+1] && !this.#grid[c+1+this.#fieldX]) {
				this.#grid[c+1] = obj;
				this.#grid[c] = spriteEnum.BLANK;
			}
			// Else check if item below is solid (can't be crushed) to disable falling.
			else if(!objBelow.canBeCrushed) {
				obj.isFalling = false;
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

	convertTupleToSingle(x,y) {
		return (y*this.#fieldX)+x;
	}

	convertSingleToTuple(n) {
		return [n%this.#fieldX, Math.floor(n/this.#fieldX)];
	}

	createExplosion(cellNum) {
		// Clear center square contents (eg grenade/bomb) to avoid infinite recursion.
		this.#grid[cellNum] = 0;

		let rStart = this.checkEdgeTop(cellNum) ? 0 : -1;
		let rEnd = this.checkEdgeBottom(cellNum) ? 0 : 1;
		let cStart = this.checkEdgeLeft(cellNum) ? 0 : -1;
		let cEnd = this.checkEdgeRight(cellNum) ? 0 : 1;

		// Create a 3x3 explosion grid
		for(let r=rStart;r<=rEnd;r++) {
			for(let c=cStart;c<=cEnd;c++) {
				let checkCell = (r * this.#fieldX) + c;
				
				// Can't check grid, since if we sit on a dropped grenade we don't exist in the grid
				// If it contains dozer, die
				if(checkCell === this.#dozer.pos)	{
					// TODO Deal with death here
				}

				if(this.#grid[checkCell] && this.#grid[checkCell].isExplosive) {
					this.createExplosion(checkCell);
					continue;
				}

				if(this.#grid[checkCell] && this.#grid[checkCell].canBeDestroyed) {
					this.#grid[checkCell] = new Explosion();
				}
			}
		}
	}

	populateFieldWithType(t) {
		let placed = 0;
		let emptyCells = this.findAllCellsOfType(spriteEnum.BLANK);

		//console.log("Populating type " + t + ", should be " + difficultyDistribution[this.#difficulty][t]);

		for(let i=0;i<difficultyDistribution[this.#difficulty][t];i++) {
			let rnd = Math.floor(Math.random() * emptyCells.length);
			let index = emptyCells.splice(rnd, 1); 
			this.#grid[index] = new classArray[t]();
			//console.log("Placed object " + i + " in index " + index);
			//console.log(this.#grid[index]);
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

	handleGameInput(e) {
		let dozerPos = this.#dozer.pos;
		let sittingOnGrenade = this.#grid[dozerPos] instanceof DroppedGrenade;

		switch(e.keyCode) {
			// Up key
			case 38:
				e.preventDefault();
				// If we're on the top edge already, give up
				if(this.checkEdgeTop(dozerPos))
					continue;
				
				let objAbove = this.#grid[dozerPos-this.#fieldX];
				// Check if cell above is either empty or can pass through
				if(!objAbove || objAbove.canPassThrough) {
					if(!sittingOnGrenade) {
						this.#grid[dozerPos] = spriteEnum.BLANK;
					}
					this.#dozer.pos -= this.#fieldX;
				}
				break;
	
			// Down key
			case 40:
				e.preventDefault();
				// If we're on the bottom edge already, give up
				if(this.checkEdgeBottom(dozerPos))
					continue;
				
				let objBelow = this.#grid[dozerPos+this.#fieldX];
				// Check if cell is either empty or can pass through
				if(!objBelow || objBelow.canPassThrough) {
					if(!sittingOnGrenade) {
						this.#grid[dozerPos] = spriteEnum.BLANK;
					}
					this.#dozer.pos += this.#fieldX;
				}
				break;
	
			// Left key
			case 37:
				e.preventDefault();
				// If we're on the left edge already, give up
				if(this.checkEdgeLeft(dozerPos))
					continue;

				let objLeft = this.#grid[dozerPos-1];
				// Check if cell is either empty or can pass through
				if(!objLeft || objLeft.canPassThrough) {
					if(!sittingOnGrenade) {
						this.#grid[dozerPos] = spriteEnum.BLANK;
					}
					this.#dozer.pos -= 1;
				}
				// If we are at least 2 squares from left edge (square to our left is not the edge)
				// and item to left is pushable AND item to left of that is empty
				else if(!this.checkEdgeLeft(dozerPos-1) && objLeft.isPushable && !this.#grid[dozerPos-2]) {
					// Push the item left
					this.#grid[dozerPos-2] = this.#grid[dozerPos-1];
					if(!sittingOnGrenade) {
						this.#grid[dozerPos] = spriteEnum.BLANK;
					}
					this.#dozer.pos -= 1;
				}
				break;
	
			// Right key
			case 39:
				e.preventDefault();
				// If we're on the right edge already, give up
				if(this.checkEdgeRight(dozerPos))
					continue;

				let objRight = this.#grid[dozerPos+1];
				// Check if cell is either empty or can pass through
				if(!objRight || objRight.canPassThrough) {
					if(!sittingOnGrenade) {
						this.#grid[dozerPos] = spriteEnum.BLANK;
					}
					this.#dozer.pos += 1;
				}
				// If we are at least 2 squares from right edge (square to our right is not the edge)
				// and item to right is pushable AND item to right of that is empty
				else if(!this.checkEdgeRight(dozerPos+1) && objRight.isPushable && !this.#grid[dozerPos+2]) {
					// Push the item right
					this.#grid[dozerPos+2] = this.#grid[dozerPos+1];
					if(!sittingOnGrenade) {
						this.#grid[dozerPos] = spriteEnum.BLANK;
					}
					this.#dozer.pos += 1;
				}
				break;
	
			// Space key
			case 32:
				e.preventDefault();
				if(this.#dozer.hasGrenades()) {
					this.#dozer.useGrenade();
					this.#grid[dozerPos] = new DroppedGrenade();
				}
				break;
		}
		
		// HANDLE PICKUPS AND SCORE
		if(Grenade.prototype.isPrototypeOf(this.#grid[dozer.x][dozer.y]) && !DroppedGrenade.prototype.isPrototypeOf(this.#grid[dozer.x][dozer.y])) {
			dozer.numGrenades++;
		} else if (this.#grid[dozer.x][dozer.y].hasOwnProperty("score")) {
			gameScore += this.#grid[dozer.x][dozer.y].score;
		}
		
		// Set grid location to dozer, unless a grenade was dropped
		if(!DroppedGrenade.prototype.isPrototypeOf(this.#grid[dozer.x][dozer.y])) {
			this.#grid[dozer.x][dozer.y] = dozer;
		}
	
		render();
	}

	renderField() {
		this.#grid.forEach((e, i) => {
			if(!e)
				return;

			let x = EmeraldHunt.SPRITESIZE * (i%this.#fieldX);
			let y = EmeraldHunt.SPRITESIZE * Math.floor(i/this.#fieldX);
			this.#ctx.drawImage(e.image, x, y);
		});
	}
}

export {Field};