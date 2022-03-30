import { colorEnum } from './enums.js';

class MenuController {
	// Drawing context
	#ctx;

	// Top level menu to render
	#topMenu;

	static #menuTextFont = '10px courier new bold';
	static #menuTextHeight = 13;

	constructor(c) {
		this.#ctx = c.getContext('2d');
		this.init();
	}

	static get MenuTextFont() {
		return MenuController.#menuTextFont;
	}

	static get MenuTextHeight() {
		return MenuController.#menuTextHeight;
	}

	init() {
		// Define the skill level menu first
		let skilllevelMenuColor = new MenuColor(colorEnum.GREEN, colorEnum.YELLOW);
		let skilllevelSelectedColor = new MenuColor(colorEnum.CYAN, colorEnum.BLACK);

		let y = 150;
		let skilllevelMenuTitle = new MenuItem(this.#ctx, 350, y, 60, 10, 'SKILL LEVEL', skilllevelMenuColor, skilllevelSelectedColor);
		let skilllevelMenu = new Menu(this.#ctx, 320, 125, 120, 130, skilllevelMenuColor, skilllevelMenuTitle);

		y+= 2 * MenuController.#menuTextHeight;
		skilllevelMenu.addMenuItem(new MenuItem(this.#ctx, 350, y, 60, 10, 'EASY', skilllevelMenuColor, skilllevelSelectedColor));
		y+= MenuController.#menuTextHeight;
		skilllevelMenu.addMenuItem(new MenuItem(this.#ctx, 350, y, 60, 10, 'MEDIUM', skilllevelMenuColor, skilllevelSelectedColor));
		y+= MenuController.#menuTextHeight;
		skilllevelMenu.addMenuItem(new MenuItem(this.#ctx, 350, y, 60, 10, 'HARD', skilllevelMenuColor, skilllevelSelectedColor));
		y+= MenuController.#menuTextHeight;
		skilllevelMenu.addMenuItem(new MenuItem(this.#ctx, 350, y, 60, 10, 'HARDER', skilllevelMenuColor, skilllevelSelectedColor));
		y+= MenuController.#menuTextHeight;
		skilllevelMenu.addMenuItem(new MenuItem(this.#ctx, 350, y, 60, 10, 'HARDEST', skilllevelMenuColor, skilllevelSelectedColor));

		// Now define the top-level menu
		let menuColor = new MenuColor(colorEnum.LIGHT_GRAY, colorEnum.BLACK);
		let selectedColor = new MenuColor(colorEnum.BLACK, colorEnum.WHITE);

		y = 115;
		let menuTitle = new MenuItem(this.#ctx, 240, y, 60, 10, 'MAIN MENU', menuColor, selectedColor);
		this.#topMenu = new Menu(this.#ctx, 200, 100, 200, 100, menuColor, menuTitle);
		
		y+= 2 * MenuController.#menuTextHeight;
		this.#topMenu.addMenuItem(new MenuItem(this.#ctx, 240, y, 75, 10, 'NEW GAME', menuColor, selectedColor, skilllevelMenu));
		y+= MenuController.#menuTextHeight;
		this.#topMenu.addMenuItem(new MenuItem(this.#ctx, 240, y, 75, 10, 'SAVED GAME', menuColor, selectedColor));
		y+= MenuController.#menuTextHeight;
		this.#topMenu.addMenuItem(new MenuItem(this.#ctx, 240, y, 75, 10, 'SOUND (ON)', menuColor, selectedColor));
		y+= MenuController.#menuTextHeight;
		this.#topMenu.addMenuItem(new MenuItem(this.#ctx, 240, y, 75, 10, 'EXIT', menuColor, selectedColor));
	}

	handleInput(e) {
		this.#topMenu.handleInput(e);
		this.renderMenu();
	}

	renderMenu() {
		this.#topMenu.renderMenu();
	}
}

class Menu {
	// Drawing context
	#ctx;

	// Special case MenuItem containing Title text (can't be selected)
	#title;

	// MenuItem array
	#items = [];

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

	constructor(ctx, x, y, w, h, c, title) {
		this.#ctx = ctx;
		this.#x = x;
		this.#y = y;
		this.#w = w;
		this.#h = h;
		this.#color = c;
		this.#title = title;
	}

	addMenuItem(item) {
		this.#items.push(item);
	}

	handleInput(e) {
		// If the active submenu is not null
		if (this.#activeSubMenu) {
			this.#activeSubMenu.handleInput(e);
			return;
		}

		var key = e.key || e.keyCode;
		switch (key) {
			// Up key
			case 'ArrowUp':
			case 38:
				e.preventDefault();
				// Decrement selected index, and wrap by menuitem length
				// Javascript modulo negative number is still negative
				// https://stackoverflow.com/a/4467559/5329728
				this.#selectedIndex = ((--this.#selectedIndex % this.#items.length) + this.#items.length) % this.#items.length;
				break;

			// Down key
			case 'ArrowDown':
			case 40:
				e.preventDefault();
				// Increment selected index, and wrap by menuitem length
				this.#selectedIndex = ++this.#selectedIndex % this.#items.length;
				break;
			
			// Enter key
			case 'Enter':
				e.preventDefault();
				var mi = this.#items[this.#selectedIndex];
				var action = mi.Action;

				if (action instanceof Menu) {
					this.#activeSubMenu = action;
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

		this.#title.renderItem();

		this.#items.forEach((item, index) => item.renderItem(index === this.#selectedIndex));

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

	constructor(ctx, x, y, w, h, text, c, sc, action) {
		this.#ctx = ctx;
		this.#x = x;
		this.#y = y;
		this.#w = w;
		this.#h = h;
		this.#text = text;
		this.#color = c;
		this.#selectedColor = sc;
		this.#action = action;
	}

	get Action() {
		return this.#action;
	}

	renderItem(selected) {
		let color = selected ? this.#selectedColor : this.#color;

		if (selected) {
			// Paint the background 
			this.#ctx.fillStyle = color.background;
			this.#ctx.fillRect(this.#x, this.#y-this.#h+1, this.#w, this.#h+4);
		}

		// Write the text
		this.#ctx.fillStyle = color.foreground;
		this.#ctx.font = MenuController.MenuTextFont;
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