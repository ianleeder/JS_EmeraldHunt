// Author: Ian Leeder
// Date: 07 November 2014
// This game is a clone/port of a game I fondly remember playing as a child.
// I have been unable to track down the original (PC) game, so at this time I am unable
// to 100% verify gameplay.  What is implemented is from my memory, and (PocketPC) screenshots
// I have found on the web.

// To-do:
// (See review at http://www.svpocketpc.com/reviews/emeraldhunt/EmeraldHunt.html for more details of gameplay)
// Implement proper image pre-loading
// Implement bombs and explosions
// Implement grenades
// Implement a menu
// Improve score/status display to show emeralds/sapphires/grenades/total score
// Add (rock and/or brick) walls
// Review/investigate/improve level generation algorithm
// Add page Favicon
// Implement difficulty settings:
// 	Easy		Rocks, emeralds, bombs
// 	Medium	Easy + sapphires
// 	Hard		Medium + bugs
// Track statistics
// Show win screen
// Details of death on lose screen (crushed/exploded)
// Find original sprite files, or improve resolution (redraw) existing ones


// Declare constants
var TILE_SIZE = 24;
var FIELD_X = 15;
var FIELD_Y = 15;
var GRID;
var SCORE = 0;
var MENU = 1;
var RUNNING = 2;
var DYING = 3;
var DEAD = 4;
var GAMESTATE = RUNNING;

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

// Brick image
var brickReady = false;
var brickImage = new Image();
brickImage.onload = function () {
	brickReady = true;
};
brickImage.src = "images/brick.png";

// Declare some classes
function BaseObject(xPos, yPos, gravity, canBeCrushed, canPassThrough) {
    this.xPos = xPos;
    this.yPos = yPos;
    this.gravity = gravity;
    this.canBeCrushed = canBeCrushed;
    this.canPassThrough = canPassThrough;
    this.isFalling = false;
	this.isUneven = true;
	this.isPushable = false;
}

function Dozer(xPos, yPos) {
	this.xPos = xPos;
    this.yPos = yPos;
    this.gravity = false;
    this.canBeCrushed = true;
    this.canPassThrough = false;
	this.image = dozerImage;
	this.isUneven = false;
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
    this.isPushable = true;
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
	this.score = 1;
}

function Sapphire(xPos, yPos) {
	this.xPos = xPos;
    this.yPos = yPos;
    this.canBeCrushed = true;
	this.image = sapphireImage;
	this.score = 5;
}

// set up the prototype chain
Dozer.prototype = new BaseObject();
Dirt.prototype = new BaseObject();
Rock.prototype = new BaseObject();
Gem.prototype = new BaseObject();
Emerald.prototype = new Gem();
Sapphire.prototype = new Gem();

// Game objects
var dozer = new Dozer(0, 0);

addEventListener("keydown", function (e) {

	if(GAMESTATE!=RUNNING)
		return;

	switch(e.keyCode) {
		// Up key
		case 38:
			e.preventDefault();
			// If we're not on top edge AND cell is either empty or can pass through
			if(dozer.y > 0 && (!GRID[dozer.x][dozer.y-1] || GRID[dozer.x][dozer.y-1].canPassThrough)) {
				GRID[dozer.x][dozer.y] = 0;
				dozer.y -= 1;
			}
			break;

		// Down key
		case 40:
			e.preventDefault();
			// If we're not on bottom edge AND cell is either empty or can pass through
			if(dozer.y < FIELD_Y-1 && (!GRID[dozer.x][dozer.y+1] || GRID[dozer.x][dozer.y+1].canPassThrough)) {
				GRID[dozer.x][dozer.y] = 0;
				dozer.y += 1;
			}
			break;

		// Left key
		case 37:
			e.preventDefault();
			// If we're not on left edge AND cell is either empty or can pass through
			if(dozer.x > 0 && (!GRID[dozer.x-1][dozer.y] || GRID[dozer.x-1][dozer.y].canPassThrough)) {
				GRID[dozer.x][dozer.y] = 0;
				dozer.x -= 1;
			}
			// If we are at least 2 squares from left edge, item to left is rock AND item to left of that is empty
			else if(dozer.x > 1 && GRID[dozer.x-1][dozer.y] && GRID[dozer.x-1][dozer.y].isPushable && !GRID[dozer.x-2][dozer.y]) {
				GRID[dozer.x-2][dozer.y] = GRID[dozer.x-1][dozer.y];
				GRID[dozer.x][dozer.y] = 0;
				dozer.x -= 1;
			}
			break;

		// Right key
		case 39:
			e.preventDefault();
			// If we're not on bottom edge AND cell is either empty or can pass through
			if(dozer.x < FIELD_X-1 && (!GRID[dozer.x+1][dozer.y] || GRID[dozer.x+1][dozer.y].canPassThrough)) {
				GRID[dozer.x][dozer.y] = 0;
				dozer.x += 1;
			}
			// If we are at least 2 squares from right edge, item to right is rock AND item to right of that is empty
			else if(dozer.x < FIELD_Y-2 && GRID[dozer.x+1][dozer.y] && GRID[dozer.x+1][dozer.y].isPushable && !GRID[dozer.x+2][dozer.y]) {
				GRID[dozer.x+2][dozer.y] = GRID[dozer.x+1][dozer.y];
				GRID[dozer.x][dozer.y] = 0;
				dozer.x += 1;
			}
			break;
	}

	if(GRID[dozer.x][dozer.y].hasOwnProperty("score"))
		SCORE += GRID[dozer.x][dozer.y].score;
	
	GRID[dozer.x][dozer.y] = dozer;

	render();
}, false);

// Reset the game when the player catches a monster
var reset = function () {
	dozer.x = 0;
	dozer.y = 0;
	SCORE = 0;

	GRID = new Array(FIELD_X);

	// Create empty array for grid
	for (var i = 0; i < GRID.length; i++) {
		GRID[i] = new Array(FIELD_Y);
	}

	// Generata a random start position for the dozer
	var rnd = Math.floor(Math.random()*FIELD_X);
	dozer.x = rnd;
	GRID[rnd][0] = dozer;
	
	for(var i=0;i<GRID.length;i++) {
		for(var j=0;j<GRID[i].length;j++) {

			if(GRID[i][j] == dozer)
				continue;

			var rnd = Math.floor(Math.random()*6);
			var val;
			switch(rnd) {
				case 0:
					val = 0;
					break;
				
				case 1:
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
	
	// Iterate through bottom to top
	// No point starting on bottom row, start 1 up
	for(var j=FIELD_Y-2;j>=0;j--) {
		// Iterate through field left to right
		for(var i=0;i<FIELD_X;i++) {
			// Check if cell is populated, AND is affected by gravity
			if(GRID[i][j] && GRID[i][j].gravity) {
				// Check if cell below is empty, OR if item is falling and item below can be crushed
				if(!GRID[i][j+1] || (GRID[i][j].isFalling && GRID[i][j+1].canBeCrushed)) {
					if(GRID[i][j+1]==dozer) {
						GAMESTATE = DYING;
					}

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
				// If we move item to the right, advance the i counter so it doesn't get hit twice
				else if(i<=GRID.length-2 && GRID[i][j+1].isUneven && !GRID[i+1][j] && !GRID[i+1][j+1]) {
					GRID[i+1][j] = GRID[i][j];
    				GRID[i][j] = 0;
					i++;
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
function render() {
	clearCanvas();
	drawBorder();

	switch(GAMESTATE) {
		case RUNNING:
			drawField();
			break;

		case DYING:
			GAMESTATE = DEAD;
			drawField();
			break;

		case DEAD:
			drawEndGame();
			break;
	}
	//drawMenu();
}

function drawMenu() {
	var w = 150;
	var h = 40;
	var gap = 20;

	drawButton(10,10,w,h,true);
	drawButton(10,60,w,h,false);
	drawButton(10,110,w,h,false);
}

function drawButton(x, y, width, height, highlight) {
	var radius = 8;
	var lineWidth = 5;
	var gradient=canvasContext.createRadialGradient((width/2)+x,(height/2)+y,Math.max(width, height)/10,(width/2)+x,(height/2)+y,Math.max(width, height));

	if(highlight) {
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
	canvasContext.moveTo(x + radius, y);
	canvasContext.lineTo(x + width - radius, y);
	canvasContext.quadraticCurveTo(x + width, y, x + width, y + radius);
	canvasContext.lineTo(x + width, y + height - radius);
	canvasContext.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
	canvasContext.lineTo(x + radius, y + height);
	canvasContext.quadraticCurveTo(x, y + height, x, y + height - radius);
	canvasContext.lineTo(x, y + radius);
	canvasContext.quadraticCurveTo(x, y, x + radius, y);
	canvasContext.closePath();

	// Draw outline around path (rounded rectangle)
	canvasContext.lineWidth=lineWidth;
	canvasContext.stroke();

	// Fill with gradient
	canvasContext.fillStyle=gradient;
	canvasContext.fill();
}

function drawEndGame() {
	drawField();
	canvasContext.fillStyle = "#000000";
	canvasContext.fillRect(75, 75, canvas.width-150, canvas.height-150);

	canvasContext.fillStyle = "#FFFFFF";
	canvasContext.font = "14px Helvetica";
	canvasContext.textAlign = "center";
	canvasContext.textBaseline = "top";
	canvasContext.fillText("You died!", canvas.width/2, canvas.height/2-20);
	canvasContext.fillText("Score: " + SCORE, canvas.width/2, canvas.height/2);
}

function clearCanvas() {
	canvasContext.fillStyle = "#000000";
	canvasContext.fillRect(0, 0, canvas.width, canvas.height);
}

function drawBorder() {
	// Draw a pretty brick border
	for(var i=0;i<FIELD_X+2;i++) {
		// Draw across top
		canvasContext.drawImage(brickImage, TILE_SIZE*i, 0);
		// Draw down left edge
		canvasContext.drawImage(brickImage, 0, TILE_SIZE*i);
		// Draw down right edge
		canvasContext.drawImage(brickImage, TILE_SIZE*(FIELD_X+1), TILE_SIZE*i);
		// Draw across bottom edge
		canvasContext.drawImage(brickImage, TILE_SIZE*i, TILE_SIZE*(FIELD_X+1));
	}
}

function drawField() {
	for(var i=0;i<GRID.length;i++) {
		for(var j=0;j<GRID[i].length;j++) {
			if(GRID[i][j])
				canvasContext.drawImage(GRID[i][j].image, TILE_SIZE*(i+1), TILE_SIZE*(j+1));
		}
	}

	// Draw a black rectangle
	canvasContext.fillStyle = "#000000";
	canvasContext.fillRect(canvas.width-88, canvas.height-20, 88, 20);
	
	// Write score over the top of it.
	canvasContext.fillStyle = "#FFFFFF";
	canvasContext.font = "14px Helvetica";
	canvasContext.textAlign = "left";
	canvasContext.textBaseline = "top";
	canvasContext.fillText("Score: " + SCORE, canvas.width-88, canvas.height-20);
}

// The main game loop
var main = function () {
	var fps = 10;
    
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