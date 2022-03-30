'use strict';

// https://www.sohamkamani.com/blog/2017/08/21/enums-in-javascript/#enumerations-with-objects
// "Since it does not make a difference as to what values we use for the enums,
// we are using string names. This can provide a more usefull message while
// debugging, as compared to using numbers, which are the more conventional
// choice when using enums"
const stateEnum = {
	// Used while images are pre-loading
	LOADING: 'loading',
	// Indicates the menu is displayed
	MENU: 'menu',
	// The game is in progress
	RUNNING: 'running',
	// The game is paused
	PAUSED: 'paused',
	// Show the explosion/crush frame that caused death
	DYING: 'dying',
	// Display a death screen
	DEAD: 'dead',
	// Display "You Won!"
	WON: 'won'
};

const difficultyEnum = {
	EASY: 'Easy',
	MEDIUM: 'Medium',
	HARD: 'Hard',
	HARDER: 'Harder',
	HARDEST: 'Hardest'
};

const colorEnum = {
	BLACK:			'#000000',
	BLUE:			'#0000AA',
	GREEN:			'#00AA00',
	CYAN:			'#00AAAA',
	RED:			'#AA0000',
	MAGENTA:		'#AA00AA',
	BROWN:			'#AA5500',
	LIGHT_GRAY:		'#AAAAAA',
	DARK_GRAY:		'#555555',
	LIGHT_BLUE:		'#5555FF',
	LIGHT_GREEN:	'#55FF55',
	LIGHT_CYAN:		'#55FFFF',
	LIGHT_RED:		'#FF5555',
	LIGHT_MAGENTA:	'#FF55FF',
	YELLOW:			'#FFFF55',
	WHITE:			'#FFFFFF'
};

export {stateEnum, difficultyEnum, colorEnum};