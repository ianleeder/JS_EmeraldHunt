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
	#exit;

	constructor(c, diff) {
		this.#ctx = c;
		this.#fieldX = EmeraldHunt.DEFAULTFIELDX;
		this.#fieldY = EmeraldHunt.DEFAULTFIELDY;
		this.#difficulty = diff;
		this.initField();
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

	updateField() {
		// We get ordering issues when moving items around.
		// If we do a single pass through the field, items can be updated twice (two movements in one tick of time)
		// If an item moves to the right (in order to fall down), and we are iterating left-to-right,
		// it will be updated twice (right and down)

		// Iterate through bottom to top
		for(let r=this.#fieldY-1;r>=0;r--) {
			// Iterate through columns left to right
			for(let c=0;c<this.#fieldX;c++) {
				let cellNum = (r*this.#fieldX)+c;
				let cellVal = this.#grid[cellNum];

				if(cellVal === spriteEnum.BLANK)
					continue;

				// Check if cell is an explosion
				if(cellVal instanceof Explosion) {
					if(cellVal.newExplosion) {
						cellVal.newExplosion = false;
					} else {
						this.#grid[cell] = spriteEnum.BLANK;
					}
					continue;
				}

				// Check if cell is a DroppedGrenade
				if(cellVal instanceof DroppedGrenade) {
					if(--cellVal.timer <= 0) {
						createExplosion(cellNum);
					}
				}
			}
		}
	}

	createExplosion(cellNum) {
		// Clear center square contents (eg grenade/bomb) to avoid infinite recursion.
		this.#grid[cellNum] = 0;

		// Create a 3x3 explosion grid
		for(let r=-1;r<=1;r++) {
			for(let c=-1;c<=1;c++) {
				// Check if we hit left edge
				if((cellNum % this.#fieldX) + c < 0)
					continue;
				
				// Check if we hit left edge
				if((cellNum % this.#fieldX) + c >= this.#fieldX)
					continue;
				
				// Check if we hit top edge
				if(Math.Floor(cellNum / this.#fieldX) + r < 0)
					continue;
				
				// Check if we hit bottom edge
				if(Math.Floor(cellNum / this.#fieldX) + r >= this.#fieldY)
					continue;

				// Cell is valid, continue checks
				let checkCell = (r * this.#fieldX) + c;
				
				// Can't check gamegrid, since if we sit on a dropped grenade we don't exist in the grid
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
		console.log("Field received game input");
		console.log(e);
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