// Created using tutorials from:
// http://www.lostdecadegames.com/how-to-make-a-simple-html5-canvas-game/
// http://manuel.kiessling.net/2012/04/02/tutorial-developing-html5-canvas-games-for-facebook-with-javascript-part-1/

// Declare constants
var TILE_SIZE = 24;
var ANIMATION_SPEED = 100;
var FIELD_X = 10;
var FIELD_Y = 10;
var GRID;

// Get the canvas context
var canvas = document.getElementById('myCanvas');
var canvasContext = canvas.getContext('2d');

// Declare some classes
function BaseObject(xPos, yPos, gravity, canBeCrushed, canPassThrough) {
    this.xPos = xPos;
    this.yPos = yPos;
    this.gravity = gravity;
    this.canBeCrushed = canBeCrushed;
    this.canPassThrough = canPassThrough;
    this.imageReady = false;
    this.image = new Image();
	this.image.onload = function () {
		console.log("Image loaded "+this.image.src);
		this.imageReady = true;
	};
}

function Dirt(xPos, yPos) {
	this.xPos = xPos;
    this.yPos = yPos;
    this.gravity = false;
    this.canBeCrushed = false;
    this.canPassThrough = true;
	this.image.src = "images/dirt.png";
}

function Rock(xPos, yPos) {
	this.xPos = xPos;
    this.yPos = yPos;
    this.gravity = true;
    this.canBeCrushed = false;
    this.canPassThrough = false;
    this.image.src = "images/rock.png";
}

function Gem(xPos, yPos) {
	this.xPos = xPos;
    this.yPos = yPos;
    this.gravity = true;
    this.canPassThrough = true;
}

function Emerald(xPos, yPos) {
	this.xPos = xPos;
    this.yPos = yPos;
    this.canBeCrushed = false;
    this.image.src = "images/emerald.png";
}

function Sapphire(xPos, yPos) {
	this.xPos = xPos;
    this.yPos = yPos;
    this.canBeCrushed = true;
    this.image.src = "images/sapphire.png";
}

// set up the prototype chain
Dirt.prototype = new BaseObject();
Rock.prototype = new BaseObject();
Gem.prototype = new BaseObject();
Emerald.prototype = new Gem();
Sapphire.prototype = new Gem();

// Dozer image
var dozerReady = false;
var dozerImage = new Image();
dozerImage.onload = function () {
	dozerReady = true;
};
dozerImage.src = "images/dozer.png";

// Game objects
var dozer = {
	speed: 256 // movement in pixels per second
};

// Handle keyboard controls
var keysDown = {};

addEventListener("keydown", function (e) {
	keysDown[e.keyCode] = true;
}, false);

addEventListener("keyup", function (e) {
	delete keysDown[e.keyCode];
}, false);

// Reset the game when the player catches a monster
var reset = function () {
	dozer.x = 0;
	dozer.y = 0;

	GRID = new Array(FIELD_X);

	// Create empty array for grid
	for (var i = 0; i < GRID.length; i++) {
		GRID[i] = new Array(FIELD_Y);
	}
	
	for(var i=0;i<GRID.length;i++) {
		for(var j=0;j<GRID[i].length;j++) {

			if(i==0 && j==0)
				continue;

			var rnd = Math.floor(Math.random()*5);
			var val;
			switch(rnd) {
				case 0:
				case 1:
					val = 0;
					break;

				case 2:
					val = new Dirt(i,j);
					break

				case 3:
					val = new Rock(i,j);
					break

				case 4:
					val = new Emerald(i,j);
					break

				case 5:
					val = new Sapphire(i,j);
					break
			}
			GRID[i][j]=val;
		}
	}
};

// Update game objects
var update = function (modifier) {
	if (38 in keysDown) { // Player holding up
		dozer.y -= dozer.speed * modifier;
	}
	if (40 in keysDown) { // Player holding down
		dozer.y += dozer.speed * modifier;
	}
	if (37 in keysDown) { // Player holding left
		dozer.x -= dozer.speed * modifier;
	}
	if (39 in keysDown) { // Player holding right
		dozer.x += dozer.speed * modifier;
	}

	// Are they touching?
	/*
	if (
		dozer.x <= (monster.x + 32)
		&& monster.x <= (dozer.x + 32)
		&& dozer.y <= (monster.y + 32)
		&& monster.y <= (dozer.y + 32)
		) {
		++monstersCaught;
		reset();
	}
	*/
};

// Draw everything
var render = function () {
	canvasContext.fillStyle = "#000000";
	canvasContext.fillRect(0, 0, canvas.width, canvas.height);

	for(var i=0;i<GRID.length;i++) {
		for(var j=0;j<GRID[i].length;j++) {
			if(GRID[i][j])// && GRID[i][j].imageReady)
				canvasContext.drawImage(GRID[i][j].image, TILE_SIZE*i, TILE_SIZE*j);
		}
	}

	if (dozerReady) {
		canvasContext.drawImage(dozerImage, dozer.x, dozer.y);
	}
};

// The main game loop
var main = function () {
	var now = Date.now();
	var delta = now - then;

	update(delta / 1000);
	render();

	then = now;

	// Request to do this again ASAP
	requestAnimationFrame(main);
};

// Cross-browser support for requestAnimationFrame
var w = window;
requestAnimationFrame = w.requestAnimationFrame || w.webkitRequestAnimationFrame || w.msRequestAnimationFrame || w.mozRequestAnimationFrame;

// Let's play this game!
var then = Date.now();
reset();
main();