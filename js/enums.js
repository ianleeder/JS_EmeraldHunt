'use strict';

// https://www.sohamkamani.com/blog/2017/08/21/enums-in-javascript/#enumerations-with-objects
// "Since it does not make a difference as to what values we use for the enums,
// we are using string names. This can provide a more usefull message while
// debugging, as compared to using numbers, which are the more conventional
// choice when using enums"
const stateEnum = {
	LOADING: 'loading',
	MENU: 'menu',
	RUNNING: 'running',
	PAUSED: 'paused',
	DYING: 'dying',
	DEAD: 'dead'
};

const difficultyEnum = {
	EASY: 'Easy',
	MEDIUM: 'Medium',
	HARD: 'Hard',
	HARDER: 'Harder',
	HARDEST: 'Hardest'
};

export {stateEnum, difficultyEnum};