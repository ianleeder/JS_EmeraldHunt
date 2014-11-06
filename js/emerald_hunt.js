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

// Dozer image
var dozerReady = false;
var dozerImage = new Image();
dozerImage.onload = function () {
	dozerReady = true;
};
dozerImage.src = "images/dozer.png";

// Dirt image
var dirtReady = false;
var dirtImage = new Image();
dirtImage.onload = function () {
	dirtReady = true;
};
dirtImage.src = "images/dirt.png";

// Rock image
var rockReady = false;
var rockImage = new Image();
rockImage.onload = function () {
	rockReady = true;
};
rockImage.src = "images/rock.png";

// Emerald image
var emeraldReady = false;
var emeraldImage = new Image();
emeraldImage.onload = function () {
	emeraldReady = true;
};
emeraldImage.src = "images/emerald.png";

// Sapphire image
var sapphireReady = false;
var sapphireImage = new Image();
sapphireImage.onload = function () {
	sapphireReady = true;
};
sapphireImage.src = "images/sapphire.png";

// Declare some classes
function BaseObject(xPos, yPos, gravity, canBeCrushed, canPassThrough) {
    this.xPos = xPos;
    this.yPos = yPos;
    this.gravity = gravity;
    this.canBeCrushed = canBeCrushed;
    this.canPassThrough = canPassThrough;
    this.isFalling = false;
	this.isUneven = true;
}

function Dirt(xPos, yPos) {
	this.xPos = xPos;
    this.yPos = yPos;
    this.gravity = false;
    this.canBeCrushed = false;
    this.canPassThrough = true;
	this.image = dirtImage;
	this.isUneven = false;
}

function Rock(xPos, yPos) {
	this.xPos = xPos;
    this.yPos = yPos;
    this.gravity = true;
    this.canBeCrushed = false;
    this.canPassThrough = false;
    this.image = rockImage;
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
    this.image = emeraldImage;
}

function Sapphire(xPos, yPos) {
	this.xPos = xPos;
    this.yPos = yPos;
    this.canBeCrushed = true;
	this.image = sapphireImage;
}

// set up the prototype chain
Dirt.prototype = new BaseObject();
Rock.prototype = new BaseObject();
Gem.prototype = new BaseObject();
Emerald.prototype = new Gem();
Sapphire.prototype = new Gem();

// Game objects
var dozer = {
	speed: 256 // movement in pixels per second
};

addEventListener("keydown", function (e) {
	switch(e.keyCode) {
		case 38:
			if(dozer.y > 0)
				dozer.y -= 1;
			break;

		case 40:
			if(dozer.y < FIELD_Y-1)
				dozer.y += 1;
			break;

		case 37:
			if(dozer.x > 0)
				dozer.x -= 1;
			break;

		case 39:
			if(dozer.x < FIELD_X-1)
				dozer.x += 1;
			break;
	}
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

			var rnd = Math.floor(Math.random()*6);
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
var update = function () {
	// We get ordering issues when moving items around.
	// If we do a single pass through the field, items can be updated twice (two movements in one tick of time)
	// If an item moves to the right (in order to fall down), and we are iterating left-to-right,
	// it will be updated twice (right and down)
	
	// Iterate through field in reverse
	for(var i=GRID.length-1;i>=0;i--) {
		// No point starting on bottom row, start 1 up
		for(var j=GRID[i].length-2;j>=0;j--) {
			// Check if cell is populated, AND is affected by gravity
			if(GRID[i][j] && GRID[i][j].gravity) {
				// Check if cell below is empty, OR if item is falling and item below can be crushed
				if(!GRID[i][j+1] || (GRID[i][j].isFalling && GRID[i][j+1].canBeCrushed)) {
    				GRID[i][j+1] = GRID[i][j];
					GRID[i][j+1].isFalling = true;
    				GRID[i][j] = 0;
				}
				// Else check if item below is uneven and it can fall left (cell left and below left are empty)
				else if(i>0 && GRID[i][j+1].isUneven && !GRID[i-1][j] && !GRID[i-1][j+1]) {
					GRID[i-1][j] = GRID[i][j];
    				GRID[i][j] = 0;
				}
				// Else check if item below is uneven and it can fall right (cell right and below right are empty)
				else if(i<=GRID.length-2 && GRID[i][j+1].isUneven && !GRID[i+1][j] && !GRID[i+1][j+1]) {
					GRID[i+1][j] = GRID[i][j];
    				GRID[i][j] = 0;
				}
				// Else check if item below is solid (can't be crushed) to disable falling.
				else if(GRID[i][j+1] && !GRID[i][j+1].canBeCrushed) {
					GRID[i][j].isFalling = false;
				}
			}
		}
	}
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
		canvasContext.drawImage(dozerImage, dozer.x*TILE_SIZE, dozer.y*TILE_SIZE);
	}
};

// The main game loop
var main = function () {
	var fps = 1;
    
    var game = this;
    var gameloop = setInterval(function() {
    	update();
    	render();
    }, 1000 / fps);
};

// Cross-browser support for requestAnimationFrame
var w = window;
requestAnimationFrame = w.requestAnimationFrame || w.webkitRequestAnimationFrame || w.msRequestAnimationFrame || w.mozRequestAnimationFrame;

// Let's play this game!
reset();
main();