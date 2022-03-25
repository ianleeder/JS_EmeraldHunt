'use strict';

class ScreenshotAnalyser {
	// DOM Canvas element.  Required for scaling.
	#canvas;
	
	constructor(c) {
		this.#canvas = c;
	}
}

export {ScreenshotAnalyser};
