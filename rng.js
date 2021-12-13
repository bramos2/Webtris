const RNG_max = 4294967296; // manual overflow
const RNG_increment = 1;
const RNG_multiplier = 69069;
const rerolls = 4; // number of attempts to generate new piece

class RNG {
	
	constructor() {
		this.seed_rand(0);
	}
	
	seed_rand(seed){
		seed %= RNG_max
		this.seed = seed;
		this.out = seed;
		this.position = 0;
	}
	
	// advances the RNG to the next position and returns the result
	next_int() {
		this.out = (RNG_multiplier * this.out + RNG_increment) % RNG_max;
		this.position++;
		return this.out;
	}
	
	// advances the RNG to the specified position
	// does not return anything
	seek_rand(to) {
		while (this.position < to) {
			next_int();
		}
	}
	
	// tests the rng with 70k values to see if it is "fair"
	// only used to debug
	test() {
		var out = [0,0,0,0,0,0,0];
		for (let i = 0; i < 70000; ++i){
			out[this.next_int() % 7]++;
		}
 		debug.innerHTML = out;
	}
}