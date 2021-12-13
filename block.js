// idk how to make enums so instead i have a series of consts
const block_o = 1;
const block_j = 2;
const block_l = 3;
const block_z = 4;
const block_s = 5;
const block_t = 6;
const block_i = 7;

// these variables have to do with stuff idk they're together lol
const level_max = 100; // why would you ever make this not 100
const allowed_moves = 6; // amount of moves for move reset before it stops resetting

var win; // self-explanitory

// states for player
const STATE_MOVE = 11;
const STATE_PLACE = 12;
const STATE_DEATH = 13;

// this class is used to represent current pieces
class Block {
	
	constructor(x, y, type, player_no) {
		// initialize first time values
		this.player = player_no;
		this.color = player_no;
		this.next = 0;
		this.pnext = 0;
		this.pnext2 = 0;
		this.previous = [block_z, block_s, block_z, block_s];
		this.held = 0;
		this.holding = !hold_on;
		this.g = 0;
		this.level = 0;
		this.sublevel = 0;
		this.active = true;
		this.win = false;
		this.lock_prev = false;
		
		// shared spawn method
		this.spawn(x, y, type);
	}
	
	// create this block
	spawn(x, y, type) {
		this.x = x;
		this.y = y;
		this.type = type;
		this.g = 0; // reset g counter
		this.lock = 0; // reset lock delay
		this.step = board_height + 1; // reset steps
		this.moves = allowed_moves; // reset moves
		this.rotbuff = false; // if 180 rotate is buffered
		// orientation 0-3
		// evens are horizontal orientation
		// odds are vertical orientations
		// up, right, down, left (order)
		this.orientation = 0;
		// create collision array
		this.initializeBlocks();
	}
	
	// initialize variables related to control
	completeConstructor() {
		this.state = STATE_MOVE;
		this.state_frame = 0;
		this.up = this.down = this.left = this.right = this.lrotate = this.rrotate = this.hold = this.buffer = 0;
		
		// TODO: use rand
		this.rng = new RNG();
	}
	
	reset() {
		this.held = 0;
		this.holding = !hold_on;
		this.sublevel = 0;
		this.level = 0;
		this.win = false;
		
		// new rng
		this.previous = [block_z, block_s, block_z, block_s];
		this.rng.seed_rand(new Date().getTime() + this.player);
		this.rng.next_int(); // discard the first value
	}
	
	// changes the seed for viewing replays
	change_seed(seed) {
		this.previous = [block_z, block_s, block_z, block_s];
		this.rng.seed_rand(seed);
		this.rng.next_int(); // discard the first value
	}
	
	
	initializeBlocks() {
		// initialize array
		var b0 = [this.x, this.y];
		var b1 = [this.x, this.y];
		var b2 = [this.x, this.y];
		var b3 = [this.x, this.y];
		
		// set array by piece type
		switch (this.type) {
			case block_o:
				b0[1]++;
				b1[0]++;
				b1[1]++;
				
				b3[0]++;
				break;
			case block_j:
				// top nub
				b0[0]--;
				b0[1]++;
				
				// sides
				b1[0]--;
				b3[0]++;
				break;
			case block_l:
				// top nub
				b0[0]++;
				b0[1]++;
				
				// sides
				b1[0]--;
				b3[0]++;
				break;
			case block_t:
				// top nub
				b0[1]++;
				
				// sides
				b1[0]--;
				b3[0]++;
				break;
			case block_z:
				b0[0]--;
				b0[1]++;
				b1[1]++;
				b3[0]++;
				break;
			case block_s:
				b0[0]++;
				b0[1]++;
				b1[1]++;
				b3[0]--;
				break;
			case block_i:
				// spread out
				b0[0] += 2;
				b1[0] ++;
				b3[0] --;
				
				// shift up
				b0[1]++; b1[1]++; b2[1]++; b3[1]++; this.y++;
			break;
		}
		
		
		// finalize array
		this.coll = [b0, b1, b2, b3];
	}
	
	// returns a duplicate for drawing ghost
	clone() {
		var clone = new Block(this.x, this.y, this.type, this.player);
		// duplicate necessary values
		clone.orientation = this.orientation;
		clone.color = this.color;
		clone.y = this.y;
		clone.active = false; // clone counts as inactive by default
		for (let i = 0; i < 4; ++i) {
			clone.coll[i][0] = this.coll[i][0];
			clone.coll[i][1] = this.coll[i][1];
		}
		clone.step = -1;
		clone.moves = -1;
		
		// return duplicate
		return clone;
	}

	// returns the gravity relative to the level
	get_gravity() {
		// 20g modes
		if (mode == DEMON || mode == DEMON_PRE) {
			return 2000;
		}
		if (mode == TETRIS_EX) {
			if (difficulty == 2) {
				switch (this.level) {
				case 0: return Math.trunc(this.sublevel / 2) + 1; // g 1/100 -> 50/100
				case 1: if (this.sublevel < 50) return Math.trunc(this.sublevel * 1.8) + 1; else return 100; // g 1 -> 89/100
				case 2: if (this.sublevel < 30) return 200; if (this.sublevel < 60) return 300; else return 400; // 1g -> 4g
				case 3: return 500; // 5g
				default: return 2000;
				} 
			} else if (difficulty == 3) return 2000;
		}
		// gravity curve for PLUS mode is a bit meaner
		if (mode == TETRIS_P) {
			switch (this.level) {
			case 0: return Math.trunc(this.sublevel / 4) + 1; // g 1/100 -> 25/100
			case 1: return Math.trunc(this.sublevel / 4) + 31; // g 31 -> 55/100
			case 2: if (this.sublevel < 50) return Math.trunc(this.sublevel * 1.8) + 1; else return 100; // g 1 -> 89/100
			case 3: if (this.sublevel < 30) return 200; if (this.sublevel < 60) return 300; else return 400; // 1g -> 4g
			case 4: return 500; // 5g
			default: return 2000;
			}
		}
		if (mode == TETRIS && special) return 2000;
		// easier speed curve for easy mode
		if (mode == TETRIS && difficulty == EASY) {
			switch (this.level) {
			case 0: return Math.trunc(this.sublevel / 20) + 1; // g 1/100 -> 5/100
			case 1: if (this.sublevel < 50) return Math.trunc(this.sublevel / 15) + 1; else return Math.trunc(this.sublevel / 5) + 1; // g 1 -> 10/100
			case 2: if (this.sublevel < 50) return Math.trunc(this.sublevel / 3) + 1; else return Math.trunc(this.sublevel / 4) + 5; // g 1 -> 25/100
			case 3: return Math.trunc(this.sublevel / 2) + 5; // g 5 -> 54
			case 4: if (this.sublevel < 50) return Math.trunc(this.sublevel / 2) + 65; else return 100; // g65 -> 1g
			case 5: return 200; // 2g
			default: return 1; // min gravity
			}
		}
		// standard speed curve
		switch (this.level) {
		case 0: return Math.trunc(this.sublevel / 20) + 1; // g 1/100 -> 5/100
		case 1: if (this.sublevel < 50) return Math.trunc(this.sublevel / 15) + 1; else return Math.trunc(this.sublevel / 5) + 1; // g 1 -> 10/100
		case 2: if (this.sublevel < 50) return Math.trunc(this.sublevel / 3) + 1; else return Math.trunc(this.sublevel / 4) + 5; // g 1 -> 25/100
		case 3: if (this.sublevel < 50) return 100; return 200; // 1g, 2g 
		case 4: return Math.trunc(this.sublevel / 20) * 100 + 5; // 5/100, 1g, 2g, 3g, 4g
		default: return 2000;
		}
		return 1; // failsafe (min gravity)
	}
	
	get_lock_delay() {
		if (mode == TETRIS_EX) {
			if (difficulty == 2) {
				switch (this.level) {
				case 0: case 1: case 2: case 3: return 32;
				case 4: return 28;
				case 5: return 26;
				case 6: return 23;
				case 7: return 20;
				case 8: case 9: case 10: return 17;
				case 11: return 15;
				default: return 14;
				}
			} else if (difficulty == 3) {
				switch (this.level) {
				case 0: return 20;
				case 1: case 2: return 18;
				case 3: case 4: return 16;
				case 5: case 6: return 14;
				case 7: case 8: return 12;
				case 9: case 10: return 10;
				case 11: case 12: case 13: return 8;
				default: return 25;
				}
			}
		}
		if (mode == DEMON_PRE || mode == DEMON) {
			switch (this.level) {
				case 0: return 32;
				case 1: return 31;
				case 2: return 30;
				case 3: return 29;
				case 4: return 28;
				case 5: return 18;
				case 6: return 17;
				case 7: return 16;
				case 8: case 9: return 15;
				case 10: return 14;
				case 11: return 13;
				case 12: return 12;
				case 13: return 11;
				case 14: case 15: case 16: case 17: case 18: case 19: return 10;
				default: return 8;
			}
		}
		if (mode == TETRIS_P) {
			switch (this.level) {
			case 8: if (ex_rank < 8) return 30; return 26;
			case 9: if (ex_rank < 9) return 17; return 22;
			case 10: return 18;
			case 11: case 12: case 13: case 14: case 15: case 16: return 15;
			default: return 30;
			}
		}
		// standard speed curve
		switch (this.level) {
			case 0: case 1: case 2: case 3: case 4: return 32;
			case 5: case 6: return 28;
			case 7: return 24;
			case 8: return 20;
			case 9: return 16;
			default: return 10;
		}
		return 32; // failsafe (default)
	}
	
	getDAS() {
		if (mode == DEMON || mode == DEMON_PRE) {
			if (this.level < 5) return 7;
			else if (this.level < 10) return 6;
			else if (this.level < 20) return 4;
			else return 3;
		}
		if (mode == TETRIS_P) {
			if (this.level < 5) return 14;
			else if (this.level < 8) return 8;
			else return 6;
		}
		if (mode == TETRIS_EX) {
			switch (difficulty) {
			case 2:
				if (this.level == 0) return 14;
				else if (this.level < 4) return 8;
				else if (this.level < 8) return 7;
				else if (this.level < 12) return 6;
				else return 4;
				break;
			case 3:
				if (this.level == 0) return 8;
				else if (this.level < 7) return 6;
				else if (this.level < 9) return 5;
				else if (this.level < 11) return 4;
				else return 3;
			default:
				if (this.level < 5) return 14;
				else if (this.level < 8) return 8;
				else if (this.level < 13) return 6;
				else if (this.level < 16) return 4;
				break;
			}
		}
		if (mode == TETRIS && difficulty == EASY) return 10;
		// default
		return 7;
	}
	
	get_entry_delay() {
		if (mode == TETRIS_EX) {
			switch (difficulty) {
			case 2:
				switch (this.level) {
				case 0: return 32;
				case 1: return 30;
				case 2: return 27;
				case 3: return 25;
				case 4: return 20;
				case 5: return 18;
				case 6: return 16;
				case 7: case 8: return 14;
				case 9: return 10;
				case 10: case 11: return 6;
				default: return 4;
			} break;
			case 3:
				switch (this.level) {
				case 0: return 12;
				case 1: case 2: return 10;
				case 3: case 4: return 8;
				case 5: case 6: return 6;
				default: return 4;
			} break;
			}
		}
		if (mode == DEMON || mode == DEMON_PRE) {
			switch (this.level) {
			case 0: return 20;
			case 1: return 18;
			case 2: return 16;
			case 3: return 14;
			case 4: case 5: return 12;
			case 6: return 10;
			case 7: return 8;
			case 8: case 9: case 10: case 11: case 12: case 13: case 14: return 6;
			case 15: case 16: case 17: case 18: case 19: return 4;
			default: return 3;
			}
		}
		// plus mode
		if (mode == TETRIS_P) {
			switch (this.level) {
			case 5: return 27;
			case 6: return 25;
			case 7: return 18;
			case 8: return 14;
			case 9: if (ex_rank < 8) return 14; return 11;
			case 10: return 8;
			case 11: case 12: case 13: case 14: case 15: case 16: return 6;
			default: return 30;
			}
		}
		// default
		return 20;
	}
	
	// return the color to use when drawing current piece
	getColor() {
		switch (this.color) {
		case 1: return "rgb(240,  65,  55)"; // red
		case 2: return "rgb( 55, 220, 240)"; // cyan
		case 3: return "rgb(240, 220,  55)"; // yellow
		case 4: return "rgb(200,  55, 240)"; // purple
		case 5: return "rgb( 65,  65,  75)"; // black
		case 6: return "rgb( 75, 230,  65)"; // green
		case 7: return "rgb(240, 150,  55)"; // orange
		case 8: return "rgb(240,  85, 200)"; // pink
		case 9: return "rgb(220,  95,  45)"; // brown
		case 10:return "rgb( 65,  55, 240)"; // blue
		case 11:return "rgb(220, 220, 200)"; // white
		default:return "rgb(220, 220, 220)"; // error player
		}
	}
	
	// return the color to use when drawing ghost
	getGhostColor() {
		switch (this.color) {
		case 1: return "rgba(220,  45,  35, 0.6)"; // red
		case 2: return "rgba( 35, 200, 220, 0.6)"; // cyan
		case 3: return "rgba(220, 210,  35, 0.6)"; // yellow
		case 4: return "rgba(180,  35, 220, 0.6)"; // purple
		case 5: return "rgba( 45,  45,  35, 0.6)"; // black
		case 6: return "rgba( 45, 220,  35, 0.6)"; // green
		case 7: return "rgba(220, 130,  35, 0.6)"; // orange
		case 8: return "rgba(220,  65, 180, 0.6)"; // pink
		case 9: return "rgba(200,  75,  25, 0.6)"; // brown
		case 10:return "rgba( 45,  35, 220, 0.6)"; // blue
		case 11:return "rgba(220, 220, 200, 0.6)"; // white
		default:return "rgba(220, 220, 220, 0.6)"; // error player
		}
	}
	
	// return the color to use when drawing the hold box
	// if hold has already been used, return gray, otherwise return normal color
	getColorHold() {
		if (this.holding) return "rgb(220, 220, 220)";
		else return this.getColor();
		return "rgb(220, 220, 220)"; // failsafe return
	}
	
	// move the collision detection and the x coord to the left
	shiftLeft() {
		for (let i = 0; i < 4; ++i) { this.coll[i][0]--; }
		this.x--;
		this.rotbuff = false;
	}
	
	// move the collision detection and the x coord to the right
	shiftRight() {
		for (let i = 0; i < 4; ++i) { this.coll[i][0]++; }
		this.x++;
		this.rotbuff = false;
	}
	
	// move the collision detection and the y coord down
	shiftDown() {
		for (let i = 0; i < 4; ++i) { this.coll[i][1]--; }
		this.y--;
		this.step_reset();
		this.rotbuff = false;
	}
	
	// move the collision detection and the y coord up
	shiftUp() {
		for (let i = 0; i < 4; ++i) { this.coll[i][1]++; }
		this.y++;
		this.rotbuff = false;
	}
	
	// move the collision and the coords
	shiftBy(x, y) {
		for (let i = 0; i < 4; ++i) {
			this.coll[i][0] += x;
			this.coll[i][1] += y;
		}
		this.x += x;
		this.y += y;
		this.step_reset();
		this.rotbuff = false;
	}
	
	step_reset() {
		if (this.y < this.step) {
			this.step = this.y;
			this.lock = 0;
			// don't reset move reset
			//if (this.moves > 0 && !checkDown(this)) this.moves += 2;
		}
	}
	
	move_reset() {
		this.rotbuff = false;
		
		// only run if still have moves,
		// step reset will not trigger,
		// and the piece is on the floor
		if (this.moves > 0 && this.y >= this.step && !checkDown(this)) {
			this.lock = 0;
			this.moves--;
			return true;
		}
		return false;
	}
	
	// returns: if a new level was reached
	upLevel(amount, line_cleared) {
		if (this.win) return;
		this.sublevel += amount;
		
		// level increased
		if (this.sublevel >= level_max) {
			// when a line clear is needed to advance level
			if (line_cleared || !(this.level_stop())) {
				// level up!
				this.sublevel %= level_max;
				this.level++;
				
				if (mode == DEMON || mode == DEMON_PRE) {
					rank++;
					play(se_rankup);
				}
				
				if (mode == DEMON_PRE && this.level == 1) {
					demon_transition();
				}
				
				// bg change comes before win detection
				if (bg_no < this.level) {
					bg_no = this.level;
					updateBG();
				}
				
				// cool detection comes before win detection
				cool(this);
				
				s_frame = 0;
				s_quadruples = 0;
				
				// win hte game
				if (winlevel() != false && this.level >= winlevel()) {
					this.sublevel = 0;
					this.win = true;
					
					// jump to win screen
					if (mode < TETRIS_D) {
						if (max_rank(rank + 1) && time_requirement(this)) {
							rank++;
							play(se_rankmax);
						} else play(se_gamewin);
						bgm_play(7);
						win = true;
						e_time = new Date().getTime();
						
						// TODO: make this not a timeout you idiot
						setTimeout(restart, 50000);
					} else {
						// try to win
						if (!try_win()) {
							// level up sfx plays if didn't win
							play(se_levelup);
						} 
						
					}
					return;
				}
				// sfx for levelup
				play(se_levelup);
				
				// bgm change
				bgm_change(this.level);
			} else this.sublevel = 99;
		} else if (this.level_stop() && this.sublevel == 99) play(se_levelstop);
	}
	
	// checks to see if level needs to be stopped at this level
	level_stop() {
		if (mode == TETRIS_P || mode == TETRIS_EX || mode == DEMON || mode == DEMON_PRE) return true;
		if (this.level == 2 && difficulty == EASY && mode == TETRIS) return false; // delete levelstop for easy lv3
		if (this.level == 14 && difficulty == HARD && mode == TETRIS) return true; // install levelstop for hard final level
		if (this.level == 2 || this.level == 4 || this.level == 6 || this.level == 9) return true;
		return false;
	}
	
	// advances to the next piece in the rng
	set_next() {
		// loop for history based randomizer
		var checks = 0;
		let rerollz = rerolls;
		if (mode == TETRIS_P) rerollz = 6; // extra rerolls for PLUS
		for (let i = 0; i < rerollz; ++i) {
			this.next = this.rng.next_int() % 7 + 1;
			
			// cross-examine generated piece against previous pieces
			for (let j = 0; j < this.previous.length; ++j) {
				if (this.next != this.previous[j]) checks++;
			}
			
			// successfully generated a unique piece, stop generating pieces
			if (checks == this.previous.length) break;
			else checks = 0;
		}
		
		// push back history
		for (let i = this.previous.length - 1; i > 0 ; --i) {
			this.previous[i] = this.previous[i - 1];
		}
		
		// prepend previous piece to history
		this.previous[0] = this.next;
		
		// deal with provisionary nexts
		if (mode == DEMON || mode == TETRIS_EX) {
			let pnext_s = this.next;
			this.next = this.pnext;
			this.pnext = this.pnext2;
			this.pnext2 = pnext_s;
		}
	}
}

/*
	origin of all blocks:
	jlt: center
	i: 2rd block from bottom or left
	o: bottom left
	sz: "middle" bottom block
*/