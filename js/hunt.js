"use strict"

class BaseObject {
	// ES2019 allows private fields!
	// https://www.sitepoint.com/javascript-private-class-fields/
	#gravity = false;
	#canBeCrushed = false;
	#canPassThrough = false;
	#isFalling = false;
	#isUneven = false;
	#isPushable = false;
	#isExplosive = false;
	#canBeDestroyed = false;
	#image;

	// Neato way to provide "named" parameters:
	// https://2ality.com/2011/11/keyword-parameters.html
	constructor(options) {
		this.#image = options.image;

		if(options.gravity) this.#gravity = options.gravity;
		if(options.canBeCrushed) this.#canBeCrushed = options.canBeCrushed;
		if(options.canPassThrough) this.#canPassThrough = options.canPassThrough;
		if(options.isFalling) this.#isFalling = options.isFalling;
		if(options.isUneven) this.#isUneven = options.isUneven;
		if(options.isPushable) this.#isPushable = options.isPushable;
		if(options.isExplosive) this.#isExplosive = options.isExplosive;
		if(options.canBeDestroyed) this.#canBeDestroyed = options.canBeDestroyed;
	}

	get gravity() { return this.#gravity; }
	get canBeCrushed() { return this.#canBeCrushed; }
	get canPassThrough() { return this.#canPassThrough;	}
	get isFalling() { return this.#isFalling; }
	get isUneven() { return this.#isUneven;	}
	get isPushable() { return this.#isPushable; }
	get isExplosive() { return this.#isExplosive; }
	get canBeDestroyed() { return this.#canBeDestroyed; }
	get image() { return this.#image; }
}

class Gem extends BaseObject {
	constructor(options) {
		options.gravity = true;
		options.canPassThrough = true;
		options.isUneven = true;
		options.canBeDestroyed = true;
		super(options);
	}
}

class Emerald extends Gem {
	constructor(img) {
		super({image: img[spriteEnum.EMERALD]});
	}
}

class Diamond extends Gem {
	constructor(img) {
		super({canBeCrushed: true, image: img[spriteEnum.EMERALD]});
	}
}

class Dirt extends BaseObject {
	constructor(img) {
		super({canPassThrough: true, canBeDestroyed: true, image: img[spriteEnum.DIRT]});
	}
}

class Rock extends BaseObject {
	constructor(img) {
		super({gravity: true, isUneven: true, isPushable: true, canBeDestroyed: true, image: img[spriteEnum.ROCK]});
	}
}

class Brick extends BaseObject {
	constructor(img) {
		super({image: img[spriteEnum.BRICK]});
	}
}

class Bomb extends BaseObject {
	constructor(img) {
		super({gravity: true, isUneven: true, isPushable: true, isExplosive: true, canBeDestroyed: true, image: img[spriteEnum.BOMB]});
	}
}

class Exit extends BaseObject {
	constructor(img) {
		super({isUneven: true, canBeDestroyed: true, image: img[spriteEnum.EXIT]});
	}
}

class Dozer extends BaseObject {
	#pos = 0;
	constructor(p, img) {
		super({canBeCrushed: true, canBeDestroyed: true, image: img[spriteEnum.DOZER]});
	}

	get pos() { return this.#pos; }
}

class Cobblestone extends BaseObject {
	constructor(img) {
		super({isUneven: true, canBeDestroyed: true, image: img[spriteEnum.COBBLE]});
	}
}

class Bug extends BaseObject {
	constructor(img) {
		super({isExplosive: true, image: img[spriteEnum.BUG]});
	}
}

class Explosion extends BaseObject {
	#isNewExplosion = true;
	constructor(img) {
		super({isExplosive: true, image: img[spriteEnum.EXPLOSION]});
	}

	get isNewExplosion() { return this.#isNewExplosion; }
}

class Grenade extends BaseObject {
	constructor(options) {
		var img = options.image || options[spriteEnum.GRENADE]
		super({isUneven: true, isExplosive: true, canBeDestroyed: true, image: img});
	}
}

class DroppedGrenade extends Grenade {
	#timer = 10;
	constructor(img) {
		super({canPassThrough: false, image: img});
	}

	get timer() { return this.#timer; }
}

class Button {
	constructor(x, y, w, h, isHighlighted, text, text2, font, action) {
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
		this.isHighlighted = isHighlighted;
		this.text = text;
		this.text2 = text2;
		this.action = action;
		this.font = font;
	}

	draw() {
		var radius = 8;
		var lineWidth = 5;
		var gradient=canvasContext.createRadialGradient((this.w/2)+this.x,(this.h/2)+this.y,Math.max(this.w, this.h)/10,(this.w/2)+this.x,(this.h/2)+this.y,Math.max(this.w, this.h));

		if(this.isHighlighted) {
			// light blue
			gradient.addColorStop(0, '#2985E2');
			// dark blue
			gradient.addColorStop(1, '#0300F9');
			canvasContext.strokeStyle = "#0500A7";
		}
		else {
			// light green
			gradient.addColorStop(0, '#46EE3A');
			// dark green
			gradient.addColorStop(1, '#195508');
			canvasContext.strokeStyle = "#1A5A0F";
		}

		// Draw shape
		canvasContext.beginPath();
		canvasContext.moveTo(this.x + radius, this.y);
		canvasContext.lineTo(this.x + this.w - radius, this.y);
		canvasContext.quadraticCurveTo(this.x + this.w, this.y, this.x + this.w, this.y + radius);
		canvasContext.lineTo(this.x + this.w, this.y + this.h - radius);
		canvasContext.quadraticCurveTo(this.x + this.w, this.y + this.h, this.x + this.w - radius, this.y + this.h);
		canvasContext.lineTo(this.x + radius, this.y + this.h);
		canvasContext.quadraticCurveTo(this.x, this.y + this.h, this.x, this.y + this.h - radius);
		canvasContext.lineTo(this.x, this.y + radius);
		canvasContext.quadraticCurveTo(this.x, this.y, this.x + radius, this.y);
		canvasContext.closePath();

		// Draw outline around path (rounded rectangle)
		canvasContext.lineWidth=lineWidth;
		canvasContext.stroke();

		// Fill with gradient
		canvasContext.fillStyle=gradient;
		canvasContext.fill();

		// Write text
		canvasContext.fillStyle = "#FFFFFF";
		canvasContext.font = this.font;
		canvasContext.textAlign = "center";
		canvasContext.textBaseline = "middle";
		if(this.text2) {
			canvasContext.fillText(this.text, this.x + (this.w/2), this.y + (this.h/2)-10);
			canvasContext.fillText(this.text2, this.x + (this.w/2), this.y + (this.h/2)+10);
		}
		else
			canvasContext.fillText(this.text, this.x + (this.w/2), this.y + (this.h/2));

		if(this.isHighlighted)
			canvasContext.drawImage(dozerImage, this.x+5, this.y+((this.h-TILE_SIZE)/2));
	}
}

class CyclingButton extends Button {
	constructor(x, y, w, h, isHighlighted, text, text2, font, action, textArray) {
		super(this, x, y, w, h, isHighlighted, text, text2, font, action);
		this.textArray = textArray;
		this.index = 0;
		this.text2 = this.textArray[this.index];
	}
}

class Field {
	#ctx;
	#images;
	#fieldX;
	#fieldY;
	#difficulty;
	#grid;
	#dozer;
	#exit;

	constructor(c, i, diff) {
		this.#ctx = c;
		this.#images = i;
		this.#fieldX = defaultFieldX;
		this.#fieldY = defaultFieldY;
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
					this.#grid[checkCell] = new Explosion(this.#images);
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
			this.#grid[index] = new classArray[t](this.#images);
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
		this.#grid[rnd] = new Diamond(this.#images);
	}

	handleGameInput(e) {
		console.log("Field received game input");
		console.log(e);
	}

	renderField() {
		this.#grid.forEach((e, i) => {
			if(!e)
				return;

			let x = spriteSize * (i%this.#fieldX);
			let y = spriteSize * Math.floor(i/this.#fieldX);
			this.#ctx.drawImage(e.image, x, y);
		});
	}
}

// https://www.sohamkamani.com/blog/2017/08/21/enums-in-javascript/#enumerations-with-objects
// "Since it does not make a difference as to what values we use for the enums,
// we are using string names. This can provide a more usefull message while debugging,
// as compared to using numbers, which are the more conventional choice when using enums"
const stateEnum = {
	LOADING: 'loading',
	MENU: 'menu',
	RUNNING: 'running',
	PAUSED: 'paused',
	DYING: 'dying',
	DEAD: 'dead'
}

const difficultyEnum = {
	EASY: 'Easy',
	MEDIUM: 'Medium',
	HARD: 'Hard',
	HARDER: 'Harder',
	HARDEST: 'Hardest'
}

const spriteEnum = {
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
}

const classArray = [
	0,
	Dirt,
	Rock,
	Emerald,
	Brick,
	Bomb,
	Exit,
	Dozer,
	Cobblestone,
	Bug,
	Diamond,
	0,
	Explosion,
	Grenade,
	0,
	0
];

// Types are stored in the same array order as the sprites]
let difficultyDistribution = {};
difficultyDistribution[difficultyEnum.EASY] =		[0,100,60,150,50,0,0,0,50,0,0,0,0,20,0,0];
difficultyDistribution[difficultyEnum.MEDIUM] =		[0,100,60,150,50,0,0,0,50,0,0,0,0,20,0,0];
difficultyDistribution[difficultyEnum.HARD] =		[0,100,60,150,50,0,0,0,50,0,0,0,0,20,0,0];
difficultyDistribution[difficultyEnum.HARDER] =		[0,100,60,150,50,0,0,0,50,0,0,0,0,20,0,0];
difficultyDistribution[difficultyEnum.HARDEST] =	[0,100,60,150,50,0,0,0,50,0,0,0,0,20,0,0];

const defaultFieldX = 40;
const defaultFieldY = 20;
const spriteSize = 16;

class EmeraldHunt {
	#canvas;
	#ctx;
	#images;
	#gameState;
	#fps;
	#gameField;
	#gameScore;

	constructor(c) {
		this.#canvas = c;
		this.#ctx = this.#canvas.getContext("2d");
		this.#images = null;
		this.#gameState = stateEnum.LOADING;
		this.#fps = 10;
		this.scaleGame(1);
	}

	init() {
		// When we pass a callback it breaks the THIS reference, we need to bind it
		// https://stackoverflow.com/questions/20279484/how-to-access-the-correct-this-inside-a-callback
		// https://stackoverflow.com/questions/46618945/cannot-set-property-value-of-undefined-inside-es6-class
		readObjectsUrl('http://www.ianleeder.com/OBJECTS.DAT', this.preloadImages.bind(this));
		addEventListener("keydown", this.handleInput.bind(this));
		addEventListener("keyup", e => {
			if(e.keyCode==27) {
				console.log("Received ESC");
				if(this.#gameState == stateEnum.RUNNING) {
					this.#gameState = stateEnum.PAUSED;
				} else if(this.#gameState == stateEnum.AUSED) {
					this.#gameState = stateEnum.RUNNING;
				}
			}
		});
	}

	scaleGame(n) {
		this.#canvas.width = defaultFieldX * spriteSize * n;
		this.#canvas.height = defaultFieldY * spriteSize * n;
		this.#ctx.setTransform(1, 0, 0, 1, 0, 0);
		this.#ctx.scale(n, n);
	}

	preloadImages(imgs) {
		let numLoaded = 0;
		let images = new Array(imgs.length);

		// https://stackoverflow.com/questions/19707969/the-invocation-context-this-of-the-foreach-function-call
		imgs.forEach((item, index) => {
			
			images[index] = new Image();
			images[index].onload = () => {
				numLoaded++;
				if(numLoaded === imgs.length)
					this.imageLoadComplete(images);
			};
			images[index].src = item;
		}, this);
	}

	imageLoadComplete(imgs) {
		this.#images = imgs;
		this.#gameState = stateEnum.MENU;

		// Start the timer ticking
		setInterval(() => {
			this.updateLoop();
			this.renderLoop();
		}, 1000/this.#fps);

		// This is just debug fluff
		imgs.forEach(item => {
			document.getElementById("imagesDiv").appendChild(item);
		});

		// Again debug fluff
		this.newGame();
	}

	clearCanvas() {
		this.#ctx.fillStyle = "#000000";
		this.#ctx.fillRect(0, 0, this.#canvas.width, this.#canvas.height);
	}

	handleInput(e) {
		switch(this.#gameState) {
			case stateEnum.RUNNING:
				this.#gameField.handleGameInput(e);
				break;
	
			case stateEnum.MENU:
				handleMenuInput(e, true, menuButtons);
				break;
	
			case stateEnum.DEAD:
				handleMenuInput(e, true, deathButtons);
				break;
	
			case stateEnum.PAUSED:
				handleMenuInput(e, true, pauseButtons);
				break;
		}
	}

	handleMenuInput(e) {
		console.log("menu input received");
	}

	newGame() {
		this.#gameScore = 0;
		this.#gameState = stateEnum.RUNNING;
		this.#gameField = new Field(this.#ctx, this.#images, difficultyEnum.EASY);
	}

	updateLoop() {
		switch(this.#gameState) {
			case stateEnum.MENU:
				this.#gameField.addRandomDiamond();
				this.#gameField.updateField();
				break;
	
			case stateEnum.RUNNING:
				this.#gameField.updateField();
				break;
		}
	}

	renderLoop() {
		this.clearCanvas();
		this.#gameField.renderField();
	}
}