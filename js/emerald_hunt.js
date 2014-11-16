// Author: Ian Leeder
// Date: 07 November 2014
// This game is a clone/port of a game I fondly remember playing as a child.
// I have been unable to track down the original (PC) game, so at this time I am unable
// to 100% verify gameplay.  What is implemented is from memory, and (PocketPC) screenshots
// I have found on the web.

// To-do:
// (See review at http://www.svpocketpc.com/reviews/emeraldhunt/EmeraldHunt.html for more details of gameplay)
// Implement proper image pre-loading (possibly display loading progress bar)
// Implement all menu items
// Add (rock and/or brick) walls
// Implement difficulty settings:
// DONE	 Easy		Rocks, emeralds, bombs
// DONE	 Medium		Easy + sapphires
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
// Array will be populated as follows (after items created)
// [empty, dirt, rock, emerald, bomb, grenade, sapphire]
var DIFFICULTY_TILE_TYPE;
var DIFFICULTY_EASY = [20, 30, 20, 20, 5, 1, 0];
var DIFFICULTY_MEDIUM = [20, 40, 20, 10, 5, 1, 10];
var DIFFICULTY_HARD;

var MENU = 1;
var RUNNING = 2;
var DYING = 3;
var DEAD = 4;
var PAUSED = 5;

// Declare variables
var difficulty = DIFFICULTY_EASY;
var gameGrid;
var gameState = MENU;
var gameScore = 0;
var menuButtons;
var deathButtons;
var pauseButtons;
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

// Bomb image
var bombReady = false;
var bombImage = new Image();
bombImage.onload = function () {
	bombReady = true;
};
bombImage.src = "images/bomb.png";

// Grenade image
var grenadeReady = false;
var grenadeImage = new Image();
grenadeImage.onload = function () {
	grenadeReady = true;
};
grenadeImage.src = "images/grenade.png";

// Explosion image
var explosionReady = false;
var explosionImage = new Image();
explosionImage.onload = function () {
	explosionReady = true;
};
explosionImage.src = "images/explosion.png";

// Declare some classes
function BaseObject() {
    this.gravity = true;
    this.canBeCrushed = false;
    this.canPassThrough = true;
    this.isFalling = false;
	this.isUneven = true;
	this.isPushable = false;
	this.isExplosive = false;
}

function Dozer(xPos, yPos) {
	this.xPos = xPos;
    this.yPos = yPos;
    this.gravity = false;
    this.canBeCrushed = true;
    this.canPassThrough = false;
	this.image = dozerImage;
	this.isUneven = false;
	this.numGrenades = 0;
}

function Dirt() {
    this.gravity = false;
	this.image = dirtImage;
	this.isUneven = false;
}

function Rock() {
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

function Bomb() {
	this.isExplosive = true;
	this.canPassThrough = false;
	this.canBeCrushed = true;
	this.isPushable = true;
	this.image = bombImage;
}

function Explosion() {
	this.canPassThrough = false;
	this.image = explosionImage;
	this.newExplosion = true;
}

function Grenade() {
	this.gravity = false;
	this.isExplosive = true;
	this.image = grenadeImage;
}

function DroppedGrenade() {
	this.canPassThrough = false;
	this.timer = 10;
}

function Button(x, y, w, h, isHighlighted, text, text2, font, action) {
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

// set up the prototype chain
Dozer.prototype = new BaseObject();
Dirt.prototype = new BaseObject();
Rock.prototype = new BaseObject();
Bomb.prototype = new BaseObject();
Grenade.prototype = new BaseObject();
Gem.prototype = new BaseObject();
Emerald.prototype = new Gem();
Sapphire.prototype = new Gem();
DroppedGrenade.prototype = new Grenade();

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
DIFFICULTY_TILE_TYPE = [0, Dirt, Rock, Emerald, Bomb, Grenade, Sapphire];

// Add key listeners
// keypress doesn't detect arrow keys
// keydown detects arrow, but detects multiple ESC events
// ESC only triggers a single keyup

// Add a key listener to handle input
addEventListener("keydown", function (e) {
	switch(gameState) {
		case RUNNING:
			handleGameInput(e);
			break;

		case MENU:
			handleMenuInput(e, true, menuButtons);
			break;

		case DEAD:
			handleMenuInput(e, false, deathButtons);
			break;

		case PAUSED:
			handleMenuInput(e, true, pauseButtons);
			break;
	}
}, false);

// Add another key listener for ESC
addEventListener("keyup", function(e) {
	if(e.keyCode==27) {
		console.log("ESC pressed");
		if(gameState == RUNNING) {
			gameState = PAUSED;
		} else if(gameState == PAUSED) {
			gameState = RUNNING;
		}
	}
});

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

function handleMenuInput(e, vertical, buttonArray) {
	// Find current highlighted button
	var h = findHighlightedButton(buttonArray);

	switch(e.keyCode) {
		// Up key
		case 38:
			e.preventDefault();
			if(vertical) {
				buttonArray[h].isHighlighted = false;
				if(h==0)
					h=buttonArray.length;
				buttonArray[--h].isHighlighted = true;
			}
			break;

		// Down key
		case 40:
			e.preventDefault();
			if(vertical) {
				buttonArray[h].isHighlighted = false;
				h = ++h%buttonArray.length;
				buttonArray[h].isHighlighted = true;
			}
			break;

		// Left key
		case 37:
			e.preventDefault();
			if(!vertical) {
				buttonArray[h].isHighlighted = false;
				if(h==0)
					h=buttonArray.length;
				buttonArray[--h].isHighlighted = true;
			}
			break;

		// Right key
		case 39:
			e.preventDefault();
			if(!vertical) {
				buttonArray[h].isHighlighted = false;
				h = ++h%buttonArray.length;
				buttonArray[h].isHighlighted = true;
			}
			break;

		// Enter key
		case 13:
		// Space key
		case 32:
			e.preventDefault();
			setHighlightedButton(buttonArray, 0);
			buttonArray[h].action();
			break;
	}
}

function handleGameInput(e) {
	var droppedItem = DroppedGrenade.prototype.isPrototypeOf(gameGrid[dozer.x][dozer.y]);

	switch(e.keyCode) {
		// Up key
		case 38:
			e.preventDefault();
			// If we're not on top edge AND cell is either empty or can pass through
			if(dozer.y > 0 && (!gameGrid[dozer.x][dozer.y-1] || gameGrid[dozer.x][dozer.y-1].canPassThrough)) {
				if(!droppedItem) {
					gameGrid[dozer.x][dozer.y] = 0;
				}
				dozer.y -= 1;
			}
			break;

		// Down key
		case 40:
			e.preventDefault();
			// If we're not on bottom edge AND cell is either empty or can pass through
			if(dozer.y < FIELD_Y-1 && (!gameGrid[dozer.x][dozer.y+1] || gameGrid[dozer.x][dozer.y+1].canPassThrough)) {
				if(!droppedItem) {
					gameGrid[dozer.x][dozer.y] = 0;
				}
				dozer.y += 1;
			}
			break;

		// Left key
		case 37:
			e.preventDefault();
			// If we're not on left edge AND cell is either empty or can pass through
			if(dozer.x > 0 && (!gameGrid[dozer.x-1][dozer.y] || gameGrid[dozer.x-1][dozer.y].canPassThrough)) {
				if(!droppedItem) {
					gameGrid[dozer.x][dozer.y] = 0;
				}
				dozer.x -= 1;
			}
			// If we are at least 2 squares from left edge, item to left is rock AND item to left of that is empty
			else if(dozer.x > 1 && gameGrid[dozer.x-1][dozer.y] && gameGrid[dozer.x-1][dozer.y].isPushable && !gameGrid[dozer.x-2][dozer.y]) {
				gameGrid[dozer.x-2][dozer.y] = gameGrid[dozer.x-1][dozer.y];
				if(!droppedItem) {
					gameGrid[dozer.x][dozer.y] = 0;
				}
				dozer.x -= 1;
			}
			break;

		// Right key
		case 39:
			e.preventDefault();
			// If we're not on bottom edge AND cell is either empty or can pass through
			if(dozer.x < FIELD_X-1 && (!gameGrid[dozer.x+1][dozer.y] || gameGrid[dozer.x+1][dozer.y].canPassThrough)) {
				if(!droppedItem) {
					gameGrid[dozer.x][dozer.y] = 0;
				}
				dozer.x += 1;
			}
			// If we are at least 2 squares from right edge, item to right is rock AND item to right of that is empty
			else if(dozer.x < FIELD_Y-2 && gameGrid[dozer.x+1][dozer.y] && gameGrid[dozer.x+1][dozer.y].isPushable && !gameGrid[dozer.x+2][dozer.y]) {
				gameGrid[dozer.x+2][dozer.y] = gameGrid[dozer.x+1][dozer.y];
				if(!droppedItem) {
					gameGrid[dozer.x][dozer.y] = 0;
				}
				dozer.x += 1;
			}
			break;

		// Space key
		case 32:
			e.preventDefault();
			if(dozer.numGrenades > 0) {
				dozer.numGrenades--;
				gameGrid[dozer.x][dozer.y] = new DroppedGrenade();
			}
			break;
	}

	if(Grenade.prototype.isPrototypeOf(gameGrid[dozer.x][dozer.y]) && !DroppedGrenade.prototype.isPrototypeOf(gameGrid[dozer.x][dozer.y])) {
		dozer.numGrenades++;
	} else if (gameGrid[dozer.x][dozer.y].hasOwnProperty("score")) {
		gameScore += gameGrid[dozer.x][dozer.y].score;
	}
	
	// Set grid location to dozer, unless a grenade was dropped
	if(!DroppedGrenade.prototype.isPrototypeOf(gameGrid[dozer.x][dozer.y])) {
		gameGrid[dozer.x][dozer.y] = dozer;
	}

	render();
}

// Initialise the board to a pretty moving background for the menu
function initFieldForMenu() {
	gameGrid = new Array(FIELD_X);

	// Create empty array for grid
	for (var i = 0; i < gameGrid.length; i++) {
		gameGrid[i] = new Array(FIELD_Y);
	}
}

// Initialise the board for a new game
function newGame() {
	gameScore = 0;
	gameState = RUNNING;

	gameGrid = new Array(FIELD_X);

	// Create empty array for grid
	for(var i = 0; i < gameGrid.length; i++) {
		gameGrid[i] = new Array(FIELD_Y);
	}

	// Generata a random start position for the dozer
	var rnd = Math.floor(Math.random()*FIELD_X);
	dozer.x = rnd;
	dozer.y = 0;

	gameGrid[rnd][0] = dozer;

	var sum = 0;
	for(var i=0;i<difficulty.length;i++) {
		sum += difficulty[i];
	}
	
	for(var i=0;i<gameGrid.length;i++) {
		for(var j=0;j<gameGrid[i].length;j++) {
			// If cell is already populated continue
			if(gameGrid[i][j])
				continue;

			var val;
			var rnd = Math.floor(Math.random()*sum);
			var cumulative=0;

			for(var k=0;k<difficulty.length;k++) {
				cumulative += difficulty[k];
				if(rnd<cumulative) {
					val = DIFFICULTY_TILE_TYPE[k];
					break;
				}
			}

			gameGrid[i][j]= val ? new val() : 0;

			// Check if item is bomb (can fall), and put dirt below it
			if(val == Bomb && j<FIELD_Y-1) {
				gameGrid[i][j+1] = new Dirt();
			}
		}
	}
};

// Update game objects
function update() {
	switch(gameState) {
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
	gameGrid[rnd][0] = new Sapphire(rnd, 0);
}

function createExplosion(x, y) {
	// Clear center square contents to avoid infinite recursion.
	gameGrid[x][y] = 0;

	// Create a 3x3 explosion grid
	for(var i=x-1; i<=x+1; i++) {
		for(var j=y-1; j<=y+1; j++) {
			// Check we are within grid boundaries
			if(i>=0 && i<FIELD_X && j>=0 && j<FIELD_Y) {
				// Check if cell we are exploding contains anything
				if(gameGrid[i][j]) {
					// Can't check gamegrid, since if we sit on a dropped grenade we don't existing in the grid
					// If it contains dozer, die
					if(i==dozer.x && j==dozer.y)
						gameState = DYING;
					// If it contains another explosive item, explode
					else if(gameGrid[i][j].isExplosive)
						createExplosion(i,j);
				}
				gameGrid[i][j] = new Explosion();
			}
		}
	}
}

function updateField() {
	// We get ordering issues when moving items around.
	// If we do a single pass through the field, items can be updated twice (two movements in one tick of time)
	// If an item moves to the right (in order to fall down), and we are iterating left-to-right,
	// it will be updated twice (right and down)

	// Iterate through bottom to top
	// No point starting on bottom row, start 1 up
	for(var j=FIELD_Y-1;j>=0;j--) {
		// Iterate through field left to right
		for(var i=0;i<FIELD_X;i++) {
			// Check if cell is empty, and bypass
			if(!gameGrid[i][j]){
				continue;
			}

			// Check if cell is an explosion
			if(Explosion.prototype.isPrototypeOf(gameGrid[i][j])) {
				if(gameGrid[i][j].newExplosion) {
					gameGrid[i][j].newExplosion = false;
				} else {
					gameGrid[i][j] = 0;
					continue;
				}
			}

			// Check if cell is a DroppedGrenade
			if(DroppedGrenade.prototype.isPrototypeOf(gameGrid[i][j])) {
				// Decrement timer and check for boom
				if(--gameGrid[i][j].timer <= 0) {
					createExplosion(i, j);
				}
			}

			// Deal with items on the bottom row
			if(j==FIELD_Y-1) {
				// If item is falling and explosive
				if(gameGrid[i][j] && gameGrid[i][j].isFalling && gameGrid[i][j].isExplosive) {
					createExplosion(i, j);
				}

				// Don't bother checking other items on bottom row
				continue;
			}

			// Check if cell is affected by gravity
			if(gameGrid[i][j].gravity) {
				// Check if cell below is empty, OR if item is falling and item below can be crushed
				if(!gameGrid[i][j+1] || (gameGrid[i][j].isFalling && gameGrid[i][j+1].canBeCrushed)) {
					// If item below is explosive, go bang!
					if(gameGrid[i][j+1] && gameGrid[i][j+1].isExplosive) {
						createExplosion(i, j+1);
						continue;
					}
					// If item below is dozer, die
					else if(gameGrid[i][j+1]==dozer) {
						gameState = DYING;
					}

					// Propogate item down
    				gameGrid[i][j+1] = gameGrid[i][j];
					gameGrid[i][j+1].isFalling = true;
    				gameGrid[i][j] = 0;
				}
				// Else check if item is falling and explosive (already ruled out empty cell below)
				else if(gameGrid[i][j].isFalling && gameGrid[i][j].isExplosive) {
					createExplosion(i, j);
				}
				// Else check if item below is uneven and it can fall left (cell left and below left are empty)
				else if(i>0 && gameGrid[i][j+1].isUneven && !gameGrid[i-1][j] && !gameGrid[i-1][j+1]) {
					gameGrid[i-1][j] = gameGrid[i][j];
    				gameGrid[i][j] = 0;
				}
				// Else check if item below is uneven and it can fall right (cell right and below right are empty)
				// If we move item to the right, advance the i counter so it doesn't get hit twice
				else if(i<=gameGrid.length-2 && gameGrid[i][j+1].isUneven && !gameGrid[i+1][j] && !gameGrid[i+1][j+1]) {
					gameGrid[i+1][j] = gameGrid[i][j];
    				gameGrid[i][j] = 0;
					i++;
				}
				// Else check if item below is solid (can't be crushed) to disable falling.
				else if(gameGrid[i][j+1] && !gameGrid[i][j+1].canBeCrushed) {
					gameGrid[i][j].isFalling = false;
				}
			}
		}
	}
};

// Draw everything
function render() {
	clearCanvas();
	drawBorder();

	switch(gameState) {

		case MENU:
			drawField();
			drawMenu();
			break;

		case RUNNING:
			drawField();
			drawScore();
			break;

		// Having a "dying" game state allows for the final "crushed" move to occur
		// Otherwise death would be detected in Update step, but not drawn.
		case DYING:
			gameState = DEAD;
			drawField();
			drawScore();
			break;

		case DEAD:
			drawField();
			drawEndGame();
			drawScore();
			break;

		case PAUSED:
			drawPauseScreen();
			break;
	}
}

function drawPauseScreen() {
	for(var i=0;i<pauseButtons.length;i++)
		pauseButtons[i].draw();
}

function drawMenu() {
	for(var i=0;i<menuButtons.length;i++)
		menuButtons[i].draw();
}

function generateButtons() {
	var f = "16px Helvetica";
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

	pauseButtons = [];
	f = "16px Helvetica";
	w = 150;
	h = 40;
	gap = 20;

	x = (myCanvas.width - w)/2;
	y = 150;
	pauseButtons[pauseButtons.length] = new Button(x, y, w, h, true, "Restart", undefined, f, newGame);
	y += h + gap;
	pauseButtons[pauseButtons.length] = new Button(x, y, w, h, false, "Menu", undefined, f, showMenu);
}

function drawEndGame() {
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
	canvasContext.fillText("Score: " + gameScore, canvas.width/2, canvas.height/2);

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
	for(var i=0;i<gameGrid.length;i++) {
		for(var j=0;j<gameGrid[i].length;j++) {
			if(gameGrid[i][j]){
				canvasContext.drawImage(gameGrid[i][j].image, TILE_SIZE*(i+1), TILE_SIZE*(j+1));
			}
		}
	}
}

function drawScore() {
	var size = 2 * TILE_SIZE / 3;

	var w = 6*size;
	var h = size;
	var x = canvas.width-(7*size);
	var y = (TILE_SIZE-size)/2;

	// Draw a black rectangle
	canvasContext.fillStyle = "#000000";
	canvasContext.fillRect(x, y, w, h);

	// Scale emerald to half size
	canvasContext.drawImage(emeraldImage, x, y, size, size);
	
	// Write teh score
	canvasContext.fillStyle = "#FFFFFF";
	canvasContext.font = "14px Helvetica";
	canvasContext.textAlign = "left";
	canvasContext.textBaseline = "top";
	canvasContext.fillText(gameScore, x+size, y);

	// Draw half size grenade
	canvasContext.drawImage(grenadeImage, x+(3*size), y, size, size);

	// Write number of grenades
	canvasContext.fillText(dozer.numGrenades, x+(4*size), y);
}

function showMenu() {
	gameState = MENU;
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