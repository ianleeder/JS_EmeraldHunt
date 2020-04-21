'use strict';

import {EmeraldHunt} from "./hunt.js";

class BaseObject {
	// ES2019 allows private fields!
	// https://www.sitepoint.com/javascript-private-class-fields/
	#gravity = false;
	#canBeCrushed = false;
	#canPassThrough = false;
	#isFalling = false;
	#isUneven = false;
	#isPushable = false;
	#isExplosive = false;
	#canBeDestroyed = false;
	#image;

	// Neato way to provide "named" parameters:
	// https://2ality.com/2011/11/keyword-parameters.html
	constructor(options) {
		this.#image = options.image;

		if(options.gravity) this.#gravity = options.gravity;
		if(options.canBeCrushed) this.#canBeCrushed = options.canBeCrushed;
		if(options.canPassThrough) this.#canPassThrough = options.canPassThrough;
		if(options.isFalling) this.#isFalling = options.isFalling;
		if(options.isUneven) this.#isUneven = options.isUneven;
		if(options.isPushable) this.#isPushable = options.isPushable;
		if(options.isExplosive) this.#isExplosive = options.isExplosive;
		if(options.canBeDestroyed) this.#canBeDestroyed = options.canBeDestroyed;
	}

	get gravity() { return this.#gravity; }
	get canBeCrushed() { return this.#canBeCrushed; }
	get canPassThrough() { return this.#canPassThrough;	}
	get isFalling() { return this.#isFalling; }
	get isUneven() { return this.#isUneven;	}
	get isPushable() { return this.#isPushable; }
	get isExplosive() { return this.#isExplosive; }
	get canBeDestroyed() { return this.#canBeDestroyed; }
	get image() { return this.#image; }
}

class Gem extends BaseObject {
	constructor(options) {
		options.gravity = true;
		options.canPassThrough = true;
		options.isUneven = true;
		options.canBeDestroyed = true;
		super(options);
	}
}

class Emerald extends Gem {
	constructor() {
		super({image: EmeraldHunt.IMAGES[spriteEnum.EMERALD]});
	}
}

class Diamond extends Gem {
	constructor() {
		super({canBeCrushed: true, image: EmeraldHunt.IMAGES[spriteEnum.EMERALD]});
	}
}

class Dirt extends BaseObject {
	constructor() {
		super({canPassThrough: true, canBeDestroyed: true, image: EmeraldHunt.IMAGES[spriteEnum.DIRT]});
	}
}

class Rock extends BaseObject {
	constructor() {
		super({gravity: true, isUneven: true, isPushable: true, canBeDestroyed: true, image: EmeraldHunt.IMAGES[spriteEnum.ROCK]});
	}
}

class Brick extends BaseObject {
	constructor() {
		super({image: EmeraldHunt.IMAGES[spriteEnum.BRICK]});
	}
}

class Bomb extends BaseObject {
	constructor() {
		super({gravity: true, isUneven: true, isPushable: true, isExplosive: true, canBeDestroyed: true, image: EmeraldHunt.IMAGES[spriteEnum.BOMB]});
	}
}

class Exit extends BaseObject {
	constructor() {
		super({isUneven: true, canBeDestroyed: true, image: EmeraldHunt.IMAGES[spriteEnum.EXIT]});
	}
}

class Dozer extends BaseObject {
	#pos = 0;
	constructor(p, img) {
		super({canBeCrushed: true, canBeDestroyed: true, image: EmeraldHunt.IMAGES[spriteEnum.DOZER]});
	}

	get pos() { return this.#pos; }
}

class Cobblestone extends BaseObject {
	constructor() {
		super({isUneven: true, canBeDestroyed: true, image: EmeraldHunt.IMAGES[spriteEnum.COBBLE]});
	}
}

class Bug extends BaseObject {
	constructor() {
		super({isExplosive: true, image: EmeraldHunt.IMAGES[spriteEnum.BUG]});
	}
}

class Explosion extends BaseObject {
	#isNewExplosion = true;
	constructor() {
		super({isExplosive: true, image: EmeraldHunt.IMAGES[spriteEnum.EXPLOSION]});
	}

	get isNewExplosion() { return this.#isNewExplosion; }
}

class Grenade extends BaseObject {
	constructor(options) {
		var o = options || {};
		o.isExplosive = true;
		o.canBeDestroyed = true;
		o.image = EmeraldHunt.IMAGES[spriteEnum.GRENADE];

		// Check if we are are the superclass of DroppedGrenade
		// If so, don't override canPassThrough
		if(!options)
			o.canPassThrough = true;
		super(o);
	}
}

class DroppedGrenade extends Grenade {
	#timer = 10;
	constructor() {
		super({image: EmeraldHunt.IMAGES[spriteEnum.GRENADE]});
	}

	get timer() { return this.#timer; }
}

const spriteEnum = {
	BLANK: 0,
	DIRT: 1,
	ROCK: 2,
	EMERALD: 3,
	BRICK: 4,
	BOMB: 5,
	EXIT: 6,
	DOZER: 7,
	COBBLE: 8,
	BUG: 9,
	DIAMOND: 10,
	SLIME: 11,
	EXPLOSION: 12,
	GRENADE: 13,
	NOTUSED: 14,
	ALTDOZER: 15
}

const classArray = [
	0,
	Dirt,
	Rock,
	Emerald,
	Brick,
	Bomb,
	Exit,
	Dozer,
	Cobblestone,
	Bug,
	Diamond,
	0,
	Explosion,
	Grenade,
	0,
	0
];

export {Emerald, Diamond, Dirt, Rock, Brick, Bomb, Exit, Dozer, Cobblestone, Bug, Explosion, Grenade, DroppedGrenade, spriteEnum, classArray};