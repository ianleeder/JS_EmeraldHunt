'use strict';

import {stateEnum, difficultyEnum} from './enums.js';
import {Field} from './field.js';
import {loadImagesFromUrlAsync, loadImagesFromFileAsync} from './huntio.js';
import {MenuController} from './menu.js';

/*
	TODO:

	Save/load game
	Dynamic reload sprites from menu
	Help screen
	Add a timer and highscores per difficulty (like minesweeper)
	Add favicon (base64 data?)
	Style hosting page
*/

class EmeraldHunt {
	// DOM Canvas element.  Required for scaling.
	#canvas;
	
	// Drawing context on canvas
	#ctx;

	// Current game state enum
	#gameState;

	// Target FPS
	#fps = 5;

	// Field instance for playing the game
	#gameField;

	// Menu instance
	#menu;

	// Array of preloaded images
	static #images;

	// Constants
	// #########

	// Default horizontal field size
	static #defaultFieldX = 40;

	// Default vertical field size
	static #defaultFieldY = 20;

	// Sprite pixel size (determined by objects data file)
	static #spriteSize = 16;

	// Path to default image object file
	static #defaultImageUrl = 'resources/OBJECTS.DAT';

	// Font details
	// https://int10h.org/oldschool-pc-fonts/fontlist/font?dos-v_twn16#-
	static #fontUrl = 'resources/Px437_DOS-V_TWN16.ttf';
	static #font = '16px dos';
	static #fontHeight = 20;

	static #startVolume = 0.1;

	constructor(c) {
		this.#canvas = c;
		this.#ctx = this.#canvas.getContext('2d');
		this.scaleGame(1);
		this.#menu = new MenuController(c, this.newGame.bind(this), this.exitToMenu.bind(this), this.setVolume.bind(this));
	}

	// Create a static property
	static get IMAGES() {
		return EmeraldHunt.#images;
	}

	static get DEFAULTFIELDX() {
		return EmeraldHunt.#defaultFieldX;
	}

	static get DEFAULTFIELDY() {
		return EmeraldHunt.#defaultFieldY;
	}

	static get SPRITESIZE() {
		return EmeraldHunt.#spriteSize;
	}

	static get DEFAULTIMAGEURL() {
		return EmeraldHunt.#defaultImageUrl;
	}

	static get FONT() {
		return EmeraldHunt.#font;
	}

	static get FONTHEIGHT() {
		return EmeraldHunt.#fontHeight;
	}

	static get STARTVOLUME() {
		return EmeraldHunt.#startVolume;
	}

	async init() {
		addEventListener('keydown', this.handleInput.bind(this));
		addEventListener('keyup', (e) => {
			// Use graceful degradation of keyCode deprecation:
			// https://devstephen.medium.com/keyboardevent-key-for-cross-browser-key-press-check-61dbad0a067a
			const key = e.key || e.keyCode;
			if (key === 'Escape' || key === 'Esc' || key === 27) {
				if (this.#gameState == stateEnum.RUNNING) {
					this.#gameState = stateEnum.PAUSED;
				} else if (this.#gameState == stateEnum.PAUSED) {
					this.#gameState = stateEnum.RUNNING;
				}
			}
		});

		// Start the timer ticking
		setInterval(() => {
			this.updateLoop();
			this.renderLoop();
		}, 1000/this.#fps);

		// Do this last, since it calls newGame
		await this.useImageUrl(EmeraldHunt.#defaultImageUrl);

		let f = new FontFace('dos', `url(${EmeraldHunt.#fontUrl})`);
		await f.load();
		document.fonts.add(f);

		this.exitToMenu();
	}

	setVolume(n) {
		if (this.#gameField) {
			this.#gameField.setVolume(n);
		}
	}

	exitToMenu() {
		this.#gameState = stateEnum.MENU;
		this.#gameField = new Field(this.#ctx, stateEnum.MENU, this.playerDying.bind(this), this.playerWon.bind(this));
		this.#gameField.setVolume(0);
	}

	async useImageFile(file) {
		// Load the game sprites and parse them
		const imgDataArray = await loadImagesFromFileAsync(file);
		await this.preloadAllImages(imgDataArray);
	}

	async useImageUrl(url) {
		// Download the game sprites and parse them
		const imgDataArray = await loadImagesFromUrlAsync(url);
		await this.preloadAllImages(imgDataArray);
	}

	async preloadAllImages(imgDataArray) {
		// Create Image objects from them and wait for load to complete
		const allPromises = imgDataArray.map((x) => this.preloadSingleImage(x));
		EmeraldHunt.#images = await Promise.all(allPromises);

		// Need to reload references to images
		//this.newGame();

		// This is just debug fluff
		const imageDiv = document.getElementById('imagesDiv');
		imageDiv.innerHTML = '';
		EmeraldHunt.IMAGES.forEach((item) => {
			imageDiv.appendChild(item);
		});
	}

	async resetImageSource() {
		await this.useImageUrl(EmeraldHunt.DEFAULTIMAGEURL);
	}

	scaleGame(n) {
		this.#canvas.width = EmeraldHunt.DEFAULTFIELDX * EmeraldHunt.SPRITESIZE * n;
		this.#canvas.height = (EmeraldHunt.DEFAULTFIELDY+1.5) * EmeraldHunt.SPRITESIZE * n;
		this.#ctx.setTransform(1, 0, 0, 1, 0, 0);
		this.#ctx.scale(n, n);
	}

	// Returns a promise
	preloadSingleImage(imgData) {
		const temporaryImage = new Image();

		return new Promise((resolve, reject) => {
			temporaryImage.onerror = () => {
				reject(new DOMException('Problem caching image.'));
			};

			temporaryImage.onload = () => {
				resolve(temporaryImage);
			};

			temporaryImage.src = imgData;
		});
	}

	clearCanvas() {
		this.#ctx.fillStyle = '#000000';
		this.#ctx.fillRect(0, 0, this.#canvas.width, this.#canvas.height);
	}

	handleInput(e) {
		switch (this.#gameState) {
			case stateEnum.RUNNING:
				this.#gameField.handleInput(e);
				break;

			case stateEnum.MENU:
			case stateEnum.DEAD:
			case stateEnum.PAUSED:
			case stateEnum.WON:
				this.#menu.handleInput(e, this.#gameState);
				this.#menu.renderMenu(this.#gameState);
				break;
		}
	}

	playerDying(deathMessage) {
		this.#gameState = stateEnum.DEAD;
		console.log(`player died - ${deathMessage}`);
	}

	playerWon() {
		this.#gameState = stateEnum.WON;
		console.log('Player won callback');
	}

	newGame(difficulty) {
		if (!difficulty) {
			difficulty = difficultyEnum.HARD;
		}
		this.#gameState = stateEnum.RUNNING;
		this.#gameField = new Field(this.#ctx, difficulty, this.playerDying.bind(this), this.playerWon.bind(this));
	}

	updateLoop() {
		if (!this.#gameField) {
			return;
		}

		switch (this.#gameState) {
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

		switch (this.#gameState) {
			case stateEnum.MENU:
			case stateEnum.DEAD:
			case stateEnum.PAUSED:
			case stateEnum.WON:
				this.#menu.renderMenu(this.#gameState);
				break;
		}
	}
}

export {EmeraldHunt};
