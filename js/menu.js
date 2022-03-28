import { colorEnum } from './enums.js';
class Button {
	#lineWidth = 5;
	#radius = 8;
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

	draw(ctx) {
		var gradient = ctx.createRadialGradient((this.w / 2) + this.x, (this.h / 2) + this.y, Math.max(this.w, this.h) / 10, (this.w / 2) + this.x, (this.h / 2) + this.y, Math.max(this.w, this.h));

		if (this.isHighlighted) {
			// light blue
			gradient.addColorStop(0, '#2985E2');
			// dark blue
			gradient.addColorStop(1, '#0300F9');
			ctx.strokeStyle = '#0500A7';
		}
		else {
			// light green
			gradient.addColorStop(0, '#46EE3A');
			// dark green
			gradient.addColorStop(1, '#195508');
			ctx.strokeStyle = '#1A5A0F';
		}

		// Draw shape
		ctx.beginPath();
		ctx.moveTo(this.x + this.#radius, this.y);
		ctx.lineTo(this.x + this.w - this.#radius, this.y);
		ctx.quadraticCurveTo(this.x + this.w, this.y, this.x + this.w, this.y + this.#radius);
		ctx.lineTo(this.x + this.w, this.y + this.h - this.#radius);
		ctx.quadraticCurveTo(this.x + this.w, this.y + this.h, this.x + this.w - this.#radius, this.y + this.h);
		ctx.lineTo(this.x + this.#radius, this.y + this.h);
		ctx.quadraticCurveTo(this.x, this.y + this.h, this.x, this.y + this.h - this.#radius);
		ctx.lineTo(this.x, this.y + this.#radius);
		ctx.quadraticCurveTo(this.x, this.y, this.x + this.#radius, this.y);
		ctx.closePath();

		// Draw outline around path (rounded rectangle)
		ctx.lineWidth = this.#lineWidth;
		ctx.stroke();

		// Fill with gradient
		ctx.fillStyle = gradient;
		ctx.fill();

		// Write text
		ctx.fillStyle = '#FFFFFF';
		ctx.font = this.font;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		if (this.text2) {
			ctx.fillText(this.text, this.x + (this.w / 2), this.y + (this.h / 2) - 10);
			ctx.fillText(this.text2, this.x + (this.w / 2), this.y + (this.h / 2) + 10);
		}
		else
			ctx.fillText(this.text, this.x + (this.w / 2), this.y + (this.h / 2));

		if (this.isHighlighted)
			ctx.drawImage(dozerImage, this.x + 5, this.y + ((this.h - TILE_SIZE) / 2));
	}
}

class CyclingButton extends Button {
	constructor(x, y, w, h, isHighlighted, text, text2, font, action, textArray) {
		super(x, y, w, h, isHighlighted, text, text2, font, action);
		this.textArray = textArray;
		this.index = 0;
		this.text2 = this.textArray[this.index];
	}
}

class MenuController {
	// Drawing context
	#ctx;

	// Top level menu to render
	#topMenu;

	#difficultyMenu;

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
		let menuColor = new MenuColor(colorEnum.LIGHT_GRAY, colorEnum.BLACK);
		let selectedColor = new MenuColor(colorEnum.BLACK, colorEnum.WHITE);
		let menuTitle = new MenuItem(this.#ctx, 240, 115, 60, 10, 'MAIN MENU', menuColor, selectedColor);
		this.#topMenu = new Menu(this.#ctx, 200, 100, 200, 100, menuColor, menuTitle);

		let y = 135;
		this.#topMenu.addMenuItem(new MenuItem(this.#ctx, 240, y, 60, 10, 'NEW GAME', menuColor, selectedColor));
		y+= MenuController.#menuTextHeight;
		this.#topMenu.addMenuItem(new MenuItem(this.#ctx, 240, y, 60, 10, 'SAVED GAME', menuColor, selectedColor));
		y+= MenuController.#menuTextHeight;
		this.#topMenu.addMenuItem(new MenuItem(this.#ctx, 240, y, 60, 10, 'SOUND (ON)', menuColor, selectedColor));
		y+= MenuController.#menuTextHeight;
		this.#topMenu.addMenuItem(new MenuItem(this.#ctx, 240, y, 60, 10, 'EXIT', menuColor, selectedColor));

		let difficultyMenuColor = new MenuColor(colorEnum.GREEN, colorEnum.YELLOW);
		let difficultySelectedColor = new MenuColor(colorEnum.CYAN, colorEnum.BLACK);

		let difficultyMenuTitle = new MenuItem(this.#ctx, 350, 150, 60, 10, 'SKILL LEVEL', difficultyMenuColor, difficultySelectedColor);
		this.#difficultyMenu = new Menu(this.#ctx, 320, 125, 120, 130, difficultyMenuColor, difficultyMenuTitle);

		y = 175;
		this.#difficultyMenu.addMenuItem(new MenuItem(this.#ctx, 350, y, 60, 10, 'EASY', difficultyMenuColor, difficultyMenuTitle));
		y+= MenuController.#menuTextHeight;
		this.#difficultyMenu.addMenuItem(new MenuItem(this.#ctx, 350, y, 60, 10, 'MEDIUM', difficultyMenuColor, difficultyMenuTitle));
		y+= MenuController.#menuTextHeight;
		this.#difficultyMenu.addMenuItem(new MenuItem(this.#ctx, 350, y, 60, 10, 'HARD', difficultyMenuColor, difficultyMenuTitle));
		y+= MenuController.#menuTextHeight;
		this.#difficultyMenu.addMenuItem(new MenuItem(this.#ctx, 350, y, 60, 10, 'HARDER', difficultyMenuColor, difficultyMenuTitle));
		y+= MenuController.#menuTextHeight;
		this.#difficultyMenu.addMenuItem(new MenuItem(this.#ctx, 350, y, 60, 10, 'HARDEST', difficultyMenuColor, difficultyMenuTitle));
	}

	handleInput() {

	}

	renderMenu() {
		this.#topMenu.renderMenu();
		this.#difficultyMenu.renderMenu();
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

	handleInput() {

	}

	renderMenu() {
		// Paint the background 
		this.#ctx.fillStyle = this.#color.background;
		this.#ctx.fillRect(this.#x, this.#y, this.#w, this.#h);

		// Draw border
		this.#ctx.strokeStyle = this.#color.foreground;
		this.#ctx.strokeRect(this.#x+3, this.#y+3, this.#w-6, this.#h-6);

		this.#title.renderItem();

		this.#items.forEach(item => item.renderItem());
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

	// Boolean flag whether this item is selected
	#selected;

	constructor(ctx, x, y, w, h, text, c, sc) {
		this.#ctx = ctx;
		this.#x = x;
		this.#y = y;
		this.#w = w;
		this.#h = h;
		this.#text = text;
		this.#color = c;
		this.#selectedColor = sc;
		this.#selected = false;
	}

	set selected(value) {
		this.#selected = value;
	}

	renderItem() {
		let color = this.#selected ? this.#selectedColor : this.#color;

		if (this.#selected) {
			// Paint the background 
			this.#ctx.fillStyle = color.background;
			this.#ctx.fillRect(this.#x, this.#y, this.#w, this.#h);
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

export { Button, CyclingButton, Menu, MenuController };