'use strict';

import {EmeraldHunt} from './hunt.js';

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

	set isFalling(f) { this.#isFalling = f; }
}

class Gem extends BaseObject {
	#score;

	constructor(options, s) {
		options.gravity = true;
		options.canPassThrough = true;
		options.isUneven = true;
		options.canBeDestroyed = true;
		super(options);

		this.#score = s;
	}

	get score() { return this.#score; }
}

class Emerald extends Gem {
	constructor() {
		super({image: EmeraldHunt.IMAGES[spriteEnum.EMERALD]}, 1);
	}
}

class Diamond extends Gem {
	constructor() {
		super({canBeCrushed: true, image: EmeraldHunt.IMAGES[spriteEnum.DIAMOND]}, 5);
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
		super({gravity: true, canBeCrushed: true, isUneven: true, isPushable: true, isExplosive: true, canBeDestroyed: true, image: EmeraldHunt.IMAGES[spriteEnum.BOMB]});
	}
}

class Exit extends BaseObject {
	constructor() {
		super({isUneven: true, canBeDestroyed: true, image: EmeraldHunt.IMAGES[spriteEnum.EXIT]});
	}
}

class Dozer extends BaseObject {
	#pos = 0;
	#numGrenades;
	constructor(p) {
		super({canBeCrushed: true, canBeDestroyed: true, image: EmeraldHunt.IMAGES[spriteEnum.DOZER]});
		this.#numGrenades = 1;
		this.#pos = p;
	}

	get pos() { return this.#pos; }
	set pos(p) { this.#pos = p; }
	get numGrenades() { return this.#numGrenades; }

	useGrenade() {
		if(this.#numGrenades <= 0)
			throw new Error('Cheating!  You don\'t have any more grenades');
		
		this.#numGrenades--;
	}

	pickupGrenade() {
		this.#numGrenades++;
	}

	hasGrenades() {
		return this.#numGrenades > 0;
	}
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
		super({isExplosive: false, image: EmeraldHunt.IMAGES[spriteEnum.EXPLOSION]});
	}

	get isNewExplosion() { return this.#isNewExplosion; }
	set isNewExplosion(n) { this.#isNewExplosion = n; }
}

class Grenade extends BaseObject {
	constructor(options) {
		var o = options || {};
		o.isExplosive = true;
		o.canBeDestroyed = true;
		o.isUneven = true;
		o.image = EmeraldHunt.IMAGES[spriteEnum.GRENADE];

		// Check if we are are the superclass of DroppedGrenade
		// If so, don't override canPassThrough
		if(!options)
			o.canPassThrough = true;
		super(o);
	}
}

class DroppedGrenade extends Grenade {
	#timer = 3;
	constructor() {
		super({image: EmeraldHunt.IMAGES[spriteEnum.GRENADE]});
	}

	tick() {
		return --this.#timer <= 0;
	}
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
};

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

export {Emerald, Diamond, Gem, Dirt, Rock, Brick, Bomb, Exit, Dozer, Cobblestone, Bug, Explosion, Grenade, DroppedGrenade, spriteEnum, classArray};