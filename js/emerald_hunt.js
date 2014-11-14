// Author: Ian Leeder
// Date: 07 November 2014
// This game is a clone/port of a game I fondly remember playing as a child.
// I have been unable to track down the original (PC) game, so at this time I am unable
// to 100% verify gameplay.  What is implemented is from memory, and (PocketPC) screenshots
// I have found on the web.

// To-do:
// (See review at http://www.svpocketpc.com/reviews/emeraldhunt/EmeraldHunt.html for more details of gameplay)
// Implement proper image pre-loading (possibly display loading progress bar)
// Implement bombs and explosions
// Implement grenades
// Implement all menu items
// Implement ESC menu from gameplay to allow restart when stuck
// Improve score/status display to show emeralds/sapphires/grenades/total score
// Add (rock and/or brick) walls
// Review/investigate/improve level generation algorithm
// Add page Favicon
// Implement difficulty settings:
// 	 Easy		Rocks, emeralds, bombs
// 	 Medium		Easy + sapphires
// 	 Hard		Medium + bugs
// Track statistics
// Show win screen
// Details of death on lose screen (crushed/exploded)
// Find original sprite files, or improve resolution (redraw) existing ones
// Set canvas size from javascript directly?  Better or worse than setting in HTML?


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
var GAMESTATE = MENU;
var menuButtons;
var deathButtons;
generateButtons();

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

// Skull image
var skullReady = false;
var skullImage = new Image();
skullImage.onload = function () {
	skullReady = true;
};
skullImage.src = "images/skull.png";

// Declare some classes
function BaseObject(gravity, canBeCrushed, canPassThrough) {
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

function Dirt() {
    this.gravity = false;
    this.canBeCrushed = false;
    this.canPassThrough = true;
	this.image = dirtImage;
	this.isUneven = false;
}

function Rock() {
    this.gravity = true;
    this.canBeCrushed = false;
    this.canPassThrough = false;
    this.isPushable = true;
    this.image = rockImage;
}

function Gem() {
    this.gravity = true;
    this.canPassThrough = true;
}

function Emerald() {
    this.canBeCrushed = false;
    this.image = emeraldImage;
	this.score = 1;
}

function Sapphire() {
    this.canBeCrushed = true;
	this.image = sapphireImage;
	this.score = 5;
}

function Button(x, y, w, h, isHighlighted, text, text2, font, action) {
	this.x = x;
	this.y = y;
	this.w = w;
	this.h = h;
	this.isHighlighted = isHighlighted;
	this.text = text;
	this.action = action;
	this.text2 = text2;
}

// set up the prototype chain
Dozer.prototype = new BaseObject();
Dirt.prototype = new BaseObject();
Rock.prototype = new BaseObject();
Gem.prototype = new BaseObject();
Emerald.prototype = new Gem();
Sapphire.prototype = new Gem();

// Add a class function to Button
Button.prototype.draw = function() {
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

// Game objects
var dozer = new Dozer(0, 0);

addEventListener("keydown", function (e) {

	switch(GAMESTATE) {
		case RUNNING:
			handleGameInput(e);
			break;

		case MENU:
			handleMenuInput(e);
			break;

		case DEAD:
			handleDeathInput(e);
			break;
	}
}, false);

function findHighlightedButton(a) {
	for(var i=0;i<a.length;i++)
		if(a[i].isHighlighted)
			return i;
}

function setHighlightedButton(a, n) {
	for(var i=0;i<a.length;i++)
		a[i].isHighlighted = false;
	a[n].isHighlighted = true;
}

function handleMenuInput(e) {
	// Find current highlighted button
	var h = findHighlightedButton(menuButtons);

	switch(e.keyCode) {
		// Up key
		case 38:
			e.preventDefault();
			menuButtons[h].isHighlighted = false;
			if(h==0)
				h=menuButtons.length;
			menuButtons[--h].isHighlighted = true;
			break;

		// Down key
		case 40:
			e.preventDefault();
			menuButtons[h].isHighlighted = false;
			h = ++h%menuButtons.length;
			menuButtons[h].isHighlighted = true;
			break;

		// Left key
		case 37:
			e.preventDefault();
			break;

		// Right key
		case 39:
			e.preventDefault();
			break;

		// Enter key
		case 13:
		// Space key
		case 32:
			e.preventDefault();
			setHighlightedButton(menuButtons, 0);
			menuButtons[h].action();
			break;
	}
}

function handleDeathInput(e) {
	// Find current highlighted button
	var h = findHighlightedButton(deathButtons);

	switch(e.keyCode) {
		// Up key
		case 38:
			e.preventDefault();
			break;

		// Down key
		case 40:
			e.preventDefault();
			break;

		// Left key
		case 37:
			e.preventDefault();
			deathButtons[h].isHighlighted = false;
			if(h==0)
				h=deathButtons.length;
			deathButtons[--h].isHighlighted = true;
			break;

		// Right key
		case 39:
			e.preventDefault();
			deathButtons[h].isHighlighted = false;
			h = ++h%deathButtons.length;
			deathButtons[h].isHighlighted = true;
			break;

		// Enter key
		case 13:
		// Space key
		case 32:
			e.preventDefault();
			setHighlightedButton(deathButtons, 0);
			deathButtons[h].action();
			break;
	}
}

function handleGameInput(e) {
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
}

// Initialise the board to a pretty moving background for the menu
function initFieldForMenu() {
	GRID = new Array(FIELD_X);

	// Create empty array for grid
	for (var i = 0; i < GRID.length; i++) {
		GRID[i] = new Array(FIELD_Y);
	}
}

// Initialise the board for a new game
function newGame() {
	SCORE = 0;
	GAMESTATE = RUNNING;

	GRID = new Array(FIELD_X);

	// Create empty array for grid
	for (var i = 0; i < GRID.length; i++) {
		GRID[i] = new Array(FIELD_Y);
	}

	// Generata a random start position for the dozer
	var rnd = Math.floor(Math.random()*FIELD_X);
	dozer.x = rnd;
	dozer.y = 0;

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
					val = new Dirt();
					break

				case 3:
					val = new Rock();
					break

				case 4:
					val = new Emerald();
					break

				case 5:
					val = new Sapphire();
					break
			}
			GRID[i][j]=val;
		}
	}
};

// Update game objects
function update() {
	switch(GAMESTATE) {
		case MENU:
			addRandomSapphire();
			updateField();
			break;

		case RUNNING:
			updateField();
			break;
	}
}

function addRandomSapphire() {
	var rnd = Math.floor(Math.random()*FIELD_X);
	GRID[rnd][0] = new Sapphire(rnd, 0);
}

function updateField() {
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

		case MENU:
			drawField();
			drawMenu();
			break;

		case RUNNING:
			drawField();
			break;

		// Having a "dying" game state allows for the final "crushed" move to occur
		// Otherwise death would be detected in Update step, but not drawn.
		case DYING:
			GAMESTATE = DEAD;
			drawField();
			break;

		case DEAD:
			drawEndGame();
			break;
	}
}

function drawMenu() {
	var w = 150;
	var h = 40;
	var gap = 20;

	for(var i=0;i<menuButtons.length;i++)
		menuButtons[i].draw();
}

function generateButtons() {
	var f = "18px Helvetica";
	var w = 150;
	var h = 40;
	var gap = 20;

	var x = (myCanvas.width - w)/2;
	var y = 60;

	menuButtons = [];
	menuButtons[menuButtons.length] = new Button(x, y, w, h, true, "Start", undefined, f, newGame);
	y += h + gap;
	menuButtons[menuButtons.length] = new Button(x, y, w, h, false, "Difficulty", "Easy", f);
	y += h + gap;
	menuButtons[menuButtons.length] = new Button(x, y, w, h, false, "High Scores", undefined, f);
	y += h + gap;
	menuButtons[menuButtons.length] = new Button(x, y, w, h, false, "Help", undefined, f);
	y += h + gap;
	menuButtons[menuButtons.length] = new Button(x, y, w, h, false, "About", undefined, f);

	deathButtons = [];
	f = "14px Helvetica";
	w = 80;
	h = 30;
	x = 120;
	y = 260;
	gap = 10;
	deathButtons[deathButtons.length] = new Button(x, y, w, h, true, "Retry", undefined, f, newGame);
	x += w + gap;
	deathButtons[deathButtons.length] = new Button(x, y, w, h, false, "Menu", undefined, f, showMenu);
}

function drawEndGame() {
	drawField();

	// Number of tiles to make death message
	var n = 10;
	var npx = n*TILE_SIZE;

	var x = (canvas.width - npx)/2;
	var y = (canvas.height - npx)/2;

	canvasContext.fillStyle = "#000000";
	canvasContext.fillRect(x, y, npx, npx);

	// Draw a border of skulls
	for(var i=0;i<10;i++) {
		// Draw across top
		canvasContext.drawImage(skullImage, x+(TILE_SIZE*i), y);
		// Draw down left edge
		canvasContext.drawImage(skullImage, x, y+(TILE_SIZE*i));
		// Draw down right edge
		canvasContext.drawImage(skullImage, x+(TILE_SIZE*(n-1)), y+(TILE_SIZE*i));
		// Draw across bottom edge
		canvasContext.drawImage(skullImage, x+(TILE_SIZE*i), y+(TILE_SIZE*(n-1)));
	}

	canvasContext.fillStyle = "#A00000";
	canvasContext.font = "bold 18px Helvetica";
	canvasContext.textAlign = "center";
	canvasContext.textBaseline = "middle";
	canvasContext.fillText("You died!", canvas.width/2, canvas.height/2-50);

	canvasContext.fillStyle = "#FFFFFF";
	canvasContext.font = "14px Helvetica";
	canvasContext.fillText("Score: " + SCORE, canvas.width/2, canvas.height/2);

	for(var i=0;i<deathButtons.length;i++)
		deathButtons[i].draw();
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

function showMenu() {
	GAMESTATE = MENU;
	initFieldForMenu();
}

// The main game loop
function main () {
	var fps = 10;

	showMenu();
    
    var gameloop = setInterval(function() {
    	update();
    	render();
    }, 1000 / fps);
};

// Cross-browser support for requestAnimationFrame
var w = window;
requestAnimationFrame = w.requestAnimationFrame || w.webkitRequestAnimationFrame || w.msRequestAnimationFrame || w.mozRequestAnimationFrame;

// Let's play this game!
main();