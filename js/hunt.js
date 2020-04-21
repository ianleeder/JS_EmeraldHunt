"use strict"

class BaseObject {
	constructor(imgIndex) {
		this._gravity = true;
		this._canBeCrushed = false;
	    this._canPassThrough = true;
	    this._isFalling = false;
		this._isUneven = true;
		this._isPushable = false;
		this._isExplosive = false;
		this._canBeDestroyed = true;
		this._imageIndex = imgIndex;
	}

	get gravity() { return this._gravity; }
	get canBeCrushed() { return this._canBeCrushed; }
	get canPassThrough() { return this._canPassThrough;	}
	get isFalling() { return this._isFalling; }
	get isUneven() { return this._isUneven;	}
	get isPushable() { return this._isPushable; }
	get isExplosive() { return this._isExplosive; }
	get canBeDestroyed() { return this._canBeDestroyed; }
	get imageIndex() { return this._image; }
}

class Gem extends BaseObject {
	constructor(img) {
		super(img);
		this._gravity = true;
		this._canPassThrough = true;
	}
}

class Dirt extends BaseObject {
	constructor() {
		super(spriteEnum.DIRT);
		this._gravity = false;
		this._isUneven = false;
	}
}

class Rock extends BaseObject {
	constructor() {
		super(spriteEnum.ROCK);
		this._canPassThrough = false;
		this._isPushable = true;
	}
}

class Emerald extends Gem {
	constructor() {
		super(spriteEnum.EMERALD);
	}
}

class Brick extends BaseObject {
	constructor() {
		super(spriteEnum.BRICK);
		this._gravity = false;
		this._canPassThrough = false;
		this._canBeDestroyed = false;
		this._isUneven = false;
	}
}

class Bomb extends BaseObject {
	constructor() {
		super(spriteEnum.BOMB);
		this._isExplosive = true;
		this._canPassThrough = false;
		this._canBeCrushed = true;
		this._isPushable = true;
	}
}

class Exit extends BaseObject {
	constructor() {
		super(spriteEnum.EXIT);
	}
}

class Dozer extends BaseObject {
	constructor(x, y) {
		super(spriteEnum.DOZER);
		this._gravity = false;
		this._canBeCrushed = true;
		this._isUneven = false;

		this._xPos = x;
		this._yPost = y;
	}

	get xPos() { return this._xPos; }
	get yPos() { return this._yPos; }
}

class Cobblestone extends BaseObject {
	constructor() {
		super(spriteEnum.COBBLE);
		this._gravity = false;
		this._canPassThrough = false;
	}
}

class Bug extends BaseObject {
	constructor(img) {
		super(spriteEnum.BUG);
		this._gravity = false;
		this._canBeCrushed = true;
	    this._canPassThrough = false;
		this._isExplosive = true;
		this._canBeDestroyed = true;
	}
}

class Diamond extends Gem {
	constructor() {
		super(spriteEnum.DIAMOND);
		this._canBeCrushed = true;
	}
}

class Explosion extends BaseObject {
	constructor() {
		super(spriteEnum.EXPLOSION);
		this._canPassThrough = false;
		this._isNewExplosion = true;
	}

	get isNewExplosion() { return this._isNewExplosion; }
}

class Grenade extends BaseObject {
	constructor() {
		super(spriteEnum.GRENADE);
		this._gravity = false;
		this._isExplosive = true;
	}
}

class DroppedGrenade extends Grenade {
	constructor() {
		super(spriteEnum.GRENADE);
		this._canPassThrough = false;
		this._timer = 10;
	}

	get timer() { return this._timer; }
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
	constructor(c, diff) {
		this._ctx = c;
		this._fieldX = defaultFieldX;
		this._fieldY = defaultFieldY;
		this._difficulty = diff;
		this.initField();
	}

	initField() {
		console.log("initing field");
		// Move to storing the field in a 1D array
		this._grid = new Array(this._fieldX * this._fieldY).fill(spriteEnum.BLANK);

		// If this field is being used for a menu background, leave it blank
		// It will self-populate
		if(this._difficulty === gameStates.MENU)
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

	populateFieldWithType(t) {
		let placed = 0;
		let emptyCells = this.findAllCellsOfType(spriteEnum.BLANK);

		console.log("Populating type " + t + ", should be " + fieldDifficultyDistribution[this._difficulty][t]);

		for(let i=0;i<fieldDifficultyDistribution[this._difficulty][t];i++) {
			let rnd = Math.floor(Math.random() * emptyCells.length);
			let index = emptyCells.splice(rnd, 1); 
			this._grid[index] = new classArray[t];
			console.log("Placed object " + i + " in index " + index);
			//console.log(this._grid[index]);
		}
	}

	findAllCellsOfType(t) {
		// https://stackoverflow.com/a/41271541/5329728
		// e for element, i for index
		return this._grid.map((e, i) => e === t ? i : '').filter(String);
	}

	handleGameInput(e) {
		console.log("Field received game input");
		console.log(e);
	}
}

// https://www.sohamkamani.com/blog/2017/08/21/enums-in-javascript/#enumerations-with-objects
// "Since it does not make a difference as to what values we use for the enums,
// we are using string names. This can provide a more usefull message while debugging,
// as compared to using numbers, which are the more conventional choice when using enums"
const gameStates = {
	LOADING: 'loading',
	MENU: 'menu',
	RUNNING: 'running',
	PAUSED: 'paused',
	DYING: 'dying',
	DEAD: 'dead'
}

const gameDifficulties = {
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
let fieldDifficultyDistribution = {};
fieldDifficultyDistribution[gameDifficulties.EASY] =	[0,100,60,150,50,0,0,0,50,0,0,0,0,20,0,0];
fieldDifficultyDistribution[gameDifficulties.MEDIUM] =	[0,100,60,150,50,0,0,0,50,0,0,0,0,20,0,0];
fieldDifficultyDistribution[gameDifficulties.HARD] =	[0,100,60,150,50,0,0,0,50,0,0,0,0,20,0,0];
fieldDifficultyDistribution[gameDifficulties.HARDER] =	[0,100,60,150,50,0,0,0,50,0,0,0,0,20,0,0];
fieldDifficultyDistribution[gameDifficulties.HARDEST] =	[0,100,60,150,50,0,0,0,50,0,0,0,0,20,0,0];

const defaultFieldX = 40;
const defaultFieldY = 20;
const spriteSize = 16;

class EmeraldHunt {

	constructor(c) {
		this._canvas = c;
		this._ctx = this._canvas.getContext("2d");
		this._images = null;
		this._gameState = gameStates.LOADING;
	}

	init() {
		// When we pass a callback it breaks the THIS reference, we need to bind it
		// https://stackoverflow.com/questions/20279484/how-to-access-the-correct-this-inside-a-callback
		// https://stackoverflow.com/questions/46618945/cannot-set-property-value-of-undefined-inside-es6-class
		readObjectsUrl('http://www.ianleeder.com/OBJECTS.DAT', this.imagesLoaded.bind(this));
		addEventListener("keydown", this.handleInput.bind(this));
		addEventListener("keyup", function(e) {
			if(e.keyCode==27) {
				console.log("Received ESC");
				if(this._gameState == gameStates.RUNNING) {
					this._gameState = gameStates.PAUSED;
				} else if(this._gameState == gameStates.AUSED) {
					this._gameState = gameStates.RUNNING;
				}
			}
		});
	}

	imagesLoaded(imgs) {
		this._images = imgs;
		this._gameState = gameStates.MENU;

		// This is just debug fluff
		this._images.forEach(function(item, index) {
			let img = document.createElement("img");
			img.src = item;
			document.getElementById("imagesDiv").appendChild(img);
		});

		// Again debug fluff
		this.newGame();
	}

	handleInput(e) {
		switch(this._gameState) {
			case gameStates.RUNNING:
				this._gameField.handleGameInput(e);
				break;
	
			case gameStates.MENU:
				handleMenuInput(e, true, menuButtons);
				break;
	
			case gameStates.DEAD:
				handleMenuInput(e, true, deathButtons);
				break;
	
			case gameStates.PAUSED:
				handleMenuInput(e, true, pauseButtons);
				break;
		}
	}

	handleMenuInput(e) {
		console.log("menu input received");
	}

	newGame() {
		this._gameScore = 0;
		this._gameState = gameStates.RUNNING;
		this._gameField = new Field(this._ctx, gameDifficulties.EASY);
	}
}