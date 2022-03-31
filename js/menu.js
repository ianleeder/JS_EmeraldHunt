import { colorEnum, difficultyEnum, stateEnum } from './enums.js';
import { EmeraldHunt } from './hunt.js';

class MenuController {
	// Drawing context
	#ctx;

	// Top level (home) menu to render
	#topMenu;

	// Pause menu when game is paused
	#pauseMenu;

	// Callback function to trigger a new game
	#newGame;

	// Callback function to exit to menu
	#exitToMenu;

	constructor(c, newGame, exitToMenu) {
		this.#ctx = c.getContext('2d');
		this.#newGame = newGame;
		this.#exitToMenu = exitToMenu;
		this.init();
	}
	
	init() {
		// Define the skill level menu first
		let skilllevelMenuColor = new MenuColor(colorEnum.GREEN, colorEnum.YELLOW);
		let skilllevelSelectedColor = new MenuColor(colorEnum.CYAN, colorEnum.BLACK);

		let x = 350;
		let y = 150;
		let w = 50;
		let h = 10;
		let skilllevelMenu = new Menu(this.#ctx, 320, 132, 120, 135, skilllevelMenuColor);
		skilllevelMenu.addTextItem(new MenuItem(this.#ctx, x, y, w, h, 'SKILL LEVEL', skilllevelMenuColor, skilllevelSelectedColor));
		y+= 2 * EmeraldHunt.FONTHEIGHT;
		skilllevelMenu.addMenuItem(new MenuItem(this.#ctx, x, y, w, h, 'EASY', skilllevelMenuColor, skilllevelSelectedColor, this.#newGame, difficultyEnum.EASY));
		y+= EmeraldHunt.FONTHEIGHT;
		skilllevelMenu.addMenuItem(new MenuItem(this.#ctx, x, y, w, h, 'MEDIUM', skilllevelMenuColor, skilllevelSelectedColor, this.#newGame, difficultyEnum.MEDIUM));
		y+= EmeraldHunt.FONTHEIGHT;
		skilllevelMenu.addMenuItem(new MenuItem(this.#ctx, x, y, w, h, 'HARD', skilllevelMenuColor, skilllevelSelectedColor, this.#newGame, difficultyEnum.HARD));
		y+= EmeraldHunt.FONTHEIGHT;
		skilllevelMenu.addMenuItem(new MenuItem(this.#ctx, x, y, w, h, 'HARDER', skilllevelMenuColor, skilllevelSelectedColor, this.#newGame, difficultyEnum.HARDER));
		y+= EmeraldHunt.FONTHEIGHT;
		skilllevelMenu.addMenuItem(new MenuItem(this.#ctx, x, y, w, h, 'HARDEST', skilllevelMenuColor, skilllevelSelectedColor, this.#newGame, difficultyEnum.HARDEST));
		y+= 2 * EmeraldHunt.FONTHEIGHT;
		skilllevelMenu.addTextItem(new MenuItem(this.#ctx, x, y, w, h, 'ESC = Cancel', skilllevelMenuColor, skilllevelSelectedColor));

		// Now define the top-level menu
		let menuColor = new MenuColor(colorEnum.LIGHT_GRAY, colorEnum.BLACK);
		let selectedColor = new MenuColor(colorEnum.BLACK, colorEnum.WHITE);

		x = 260;
		y = 115;
		w = 75;
		this.#topMenu = new Menu(this.#ctx, 200, 100, 200, 100, menuColor);
		this.#topMenu.addTextItem(new MenuItem(this.#ctx, x, y, w, h, 'MAIN MENU', menuColor, selectedColor));
		y+= 2 * EmeraldHunt.FONTHEIGHT;
		this.#topMenu.addMenuItem(new MenuItem(this.#ctx, x, y, w, h, 'NEW GAME', menuColor, selectedColor, skilllevelMenu));
		y+= EmeraldHunt.FONTHEIGHT;
		this.#topMenu.addMenuItem(new MenuItem(this.#ctx, x, y, w, h, 'SAVED GAME', menuColor, selectedColor));
		y+= EmeraldHunt.FONTHEIGHT;
		this.#topMenu.addMenuItem(new MenuItem(this.#ctx, x, y, w, h, 'SOUND (ON)', menuColor, selectedColor));
		y+= EmeraldHunt.FONTHEIGHT;
		this.#topMenu.addMenuItem(new MenuItem(this.#ctx, x, y, w, h, 'EXIT', menuColor, selectedColor));

		// Define a pause menu
		let pauseMenuColor = new MenuColor(colorEnum.BLUE, colorEnum.YELLOW);
		let pauseSelectedColor = new MenuColor(colorEnum.YELLOW, colorEnum.BLUE);

		x = 260;
		y = 115;
		w = 75;
		this.#pauseMenu = new Menu(this.#ctx, 200, 100, 200, 100, pauseMenuColor);
		this.#pauseMenu.addTextItem(new MenuItem(this.#ctx, x, y, w, h, 'PAUSED', pauseMenuColor, pauseSelectedColor));
		y+= 2 * EmeraldHunt.FONTHEIGHT;
		this.#pauseMenu.addMenuItem(new MenuItem(this.#ctx, x, y, w, h, 'VOLUME', pauseMenuColor, pauseSelectedColor));
		y+= EmeraldHunt.FONTHEIGHT;
		this.#pauseMenu.addMenuItem(new MenuItem(this.#ctx, x, y, w, h, 'EXIT', pauseMenuColor, pauseSelectedColor, this.#exitToMenu));
		y+= 2 * EmeraldHunt.FONTHEIGHT;
		this.#pauseMenu.addTextItem(new MenuItem(this.#ctx, x, y, w, h, 'ESC = Unpause', pauseMenuColor, pauseMenuColor));
	}

	handleInput(e, gameState) {
		if (gameState === stateEnum.MENU) {
			this.#topMenu.handleInput(e);
		} else if (gameState === stateEnum.PAUSED) {
			this.#pauseMenu.handleInput(e);
		}
		
		this.renderMenu();
	}

	renderMenu(gameState) {
		if (gameState === stateEnum.MENU) {
			this.#topMenu.renderMenu();
		} else if (gameState === stateEnum.PAUSED) {
			this.#pauseMenu.renderMenu();
		}
	}
}

class Menu {
	// Drawing context
	#ctx;

	// MenuItems that can be selected
	#menuitems = [];

	// MenuItems that are for display only (eg Title)
	#textItems = [];

	// X Position of menu
	#x;

	// Y Position of menu
	#y;

	// Width
	#w;

	// Height
	#h;

	// MenuItemColor object for normal color
	#color;

	// Store the index of the currently selected menu item
	#selectedIndex = 0;

	// If a submenu has been activated, store it here to render and handle input
	#activeSubMenu;

	constructor(ctx, x, y, w, h, c) {
		this.#ctx = ctx;
		this.#x = x;
		this.#y = y;
		this.#w = w;
		this.#h = h;
		this.#color = c;
	}

	addMenuItem(item) {
		this.#menuitems.push(item);
	}

	addTextItem(item) {
		this.#textItems.push(item);
	}

	handleInput(e) {
		// First check if the escape key was pressed.
		// If so, escape out of the subment
		// NOTE: This restricts us to two levels of menu, no more.
		const key = e.key || e.keyCode;
		if (key === 'Escape' || key === 'Esc' || key === 27) {
			if (this.#activeSubMenu) {
				this.#activeSubMenu = null;
				return;
			}
		}

		// If the active submenu is not null
		if (this.#activeSubMenu) {
			this.#activeSubMenu.handleInput(e);

			// If a submenu item was selected, clear the submenu so we can get back to top leve
			if (key === 'Enter') {
				this.#activeSubMenu = null;
			}
			return;
		}

		switch (key) {
			// Up key
			case 'ArrowUp':
			case 38:
				e.preventDefault();
				// Decrement selected index, and wrap by menuitem length
				// Javascript modulo negative number is still negative
				// https://stackoverflow.com/a/4467559/5329728
				this.#selectedIndex = ((--this.#selectedIndex % this.#menuitems.length) + this.#menuitems.length) % this.#menuitems.length;
				break;

			// Down key
			case 'ArrowDown':
			case 40:
				e.preventDefault();
				// Increment selected index, and wrap by menuitem length
				this.#selectedIndex = ++this.#selectedIndex % this.#menuitems.length;
				break;
			
			// Enter key
			case 'Enter':
				e.preventDefault();
				var mi = this.#menuitems[this.#selectedIndex];
				var action = mi.Action;

				if (action instanceof Menu) {
					this.#activeSubMenu = action;
				} else if (typeof action === 'function') {
					mi.callAction();
				}
				break;
		}
	}

	renderMenu() {
		// Paint the background 
		this.#ctx.fillStyle = this.#color.background;
		this.#ctx.fillRect(this.#x, this.#y, this.#w, this.#h);

		// Draw border
		this.#ctx.strokeStyle = this.#color.foreground;
		this.#ctx.strokeRect(this.#x+3, this.#y+3, this.#w-6, this.#h-6);

		// Draw menu and text items
		this.#menuitems.forEach((item, index) => item.renderItem(index === this.#selectedIndex));
		this.#textItems.forEach(item => item.renderItem());

		// If the active submenu is not null
		if (this.#activeSubMenu) {
			this.#activeSubMenu.renderMenu();
		}
	}
}

class MenuItem {
	// Drawing context
	#ctx;

	// X Position of item
	#x;

	// Y Position of item
	#y;

	// Width
	#w;

	// Height
	#h;

	// Text to display
	#text;

	// MenuItemColor object for normal color
	#color;

	// MenuItemColor object when selected
	#selectedColor;

	// This could contain a callback to a function to execute, or another (sub)Menu
	#action;

	// If the action is a callback function, pass this parameters
	#actionParameter;

	constructor(ctx, x, y, w, h, text, c, sc, action, actionParameter) {
		this.#ctx = ctx;
		this.#x = x;
		this.#y = y;
		this.#w = w;
		this.#h = h;
		this.#text = text;
		this.#color = c;
		this.#selectedColor = sc;
		this.#action = action;
		this.#actionParameter = actionParameter;
	}

	get Action() {
		return this.#action;
	}

	callAction() {
		this.#action(this.#actionParameter);
	}

	renderItem(selected) {
		let color = selected ? this.#selectedColor : this.#color;

		if (selected) {
			// Paint the background 
			this.#ctx.fillStyle = color.background;
			this.#ctx.fillRect(this.#x, this.#y-this.#h+4, this.#w, this.#h+1);
		}

		// Write the text
		this.#ctx.fillStyle = color.foreground;
		this.#ctx.font = EmeraldHunt.FONT;
		this.#ctx.fillText(this.#text, this.#x+2, this.#y+2);
	}
}

class MenuColor {
	// Background color
	#background;

	// Foreground color
	#foreground;

	constructor(bg, fg) {
		this.#background = bg;
		this.#foreground = fg;
	}

	get background() {
		return this.#background;
	}

	get foreground() {
		return this.#foreground;
	}
}

export { Menu, MenuController };