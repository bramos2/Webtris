// global consts exclusive to game logic
const arr = -2; // negative value denotes fractional arr
const are = 20;
const g_denominator = 100;
const spark_gravity = 0.2;

// wall kicks
// standard kick
const kick = [[0, 0], [0, -1], [1, -1], [-1, -1], [1, 0], [-1, 0], [-1, -2], [0, 1]];
// kick for orientation 0
const kick_flat = [[0, 0], [0, -1], [-1, -2], [0, 1], [1, 0], [-1, 0], [1, -1], [-1, -1]];
// extra wallkicks for i block
const kick_i = [[2, 0], [-2, 0]];
const kick_i_flat = [[0, 0], [0, 1], [0, -1], [1, -2], [1, 0], [-1, 0], [1, -1], [-1, -1]];
// kicks for 180 rotate
const kick_180 = [[0, 0], [0, 1], [1, 0], [1, 1]];

// global variables exclusive to game logic
var players;
var timec; // time of current frame
var timep; // time of previous frame
var special; // cheat toggle

// runs when the page is loaded, just doing some basic setup
function main() {
	time = new Date(); // initialize the clock first
	
	state = STATE_MENU;
	win = false;
	end = 0;
	end_x = 0;
	end_y = 0;
	viewing_replay = false;
	loaded_replay = false;
	replay_file = null;
	drawrate = 1;
	frameskip = true;
	special = false;
	vfx_rng = new RNG();
	vfx_rng.seed_rand(new Date().getTime());
	vfx_rng.next_int(); // discard the first value
	
	// load sound
	init_audio();
	
	// initialize some draw variables
	all_clear = 0;
	canvas_blur = [];
	loadBG();
	underlay_drawn = false;
	timec = 0;
	timep = 0;
	
	// set some html elements as variables
	mt = document.getElementById("tetris");
	ctx = mt.getContext("2d");
	debug = document.getElementById("debug");
	info = document.getElementById("info");
	settings = document.getElementById("settings");
	replay_d = document.getElementById("replay");
	selected_field = false; // default field not selected
	ctx.imageSmoothingEnabled = false;
	
	// add a key listener to listen to your keys
	window.addEventListener('keydown', this.keyPress, false);
	window.addEventListener('keyup', this.keyRelease, false);
	
	// set the framerate timer
	setInterval(frameUpdate, framerate);
	
	// initialize settings
	draw_grid = false;
	draw_outline = true;
	draw_ghost = true;
	draw_vfx = true;
	draw_bg = true;
	draw_underlay = true;
	autoresize = false;
	toggle_sdrop = true;
	toggle_hold = true;
	toggle_ezpre = false;
	
	initialize_players(1);
	initialize_controls(); // sets to default
	set_preset(0, 0); // sets to default
	set_preset(4, 1); // sets to default
	reset_controls_div(0); // loads p1 config into viewer
	remap_pno = 0;
	clear_preset();
	
	// draw the initial canvas
	refreshCanvasSize(); // this calls the redraw method, so don't have to here
	set_canvas_size();
	set_tilesize();
	
	mode = TETRIS;
	menu_option = 0;
	menu_max = 4;
	player_num = 1;
	create_board();
	
	// start all frame timers
	state_frame = 0;
	frame = 0;
	frame_replay = 0;
	frame_game = 0;
	s_frame = 0;
	
	// finish writing the HTML for the settings box
	document.getElementById("se_button").value = play_se ? "On" : "Off";
	document.getElementById("bgm_button").value = play_bgm ? "On" : "Off";
	document.getElementById("grid_button").value = draw_grid ? "On" : "Off";
	document.getElementById("outline_button").value = draw_outline ? "On" : "Off";
	document.getElementById("vfx_button").value = draw_vfx ? "On" : "Off";
	document.getElementById("ghost_button").value = draw_ghost ? "On" : "Off";
	document.getElementById("bg_button").value = draw_bg ? "On" : "Off";
	document.getElementById("underlay_button").value = draw_underlay ? "On" : "Off";
	document.getElementById("resize_button").value = autoresize ? "On" : "Off";
	document.getElementById("t-sdrop_button").value = toggle_sdrop ? "On" : "Off";
	document.getElementById("t-hold_button").value = toggle_hold ? "On" : "Off";
	document.getElementById("t-ezpre_button").value = toggle_ezpre ? "On" : "Off";
	document.getElementById("remap-p1").disabled = true; // bugfix idk
	// replay menu bugfix
	document.getElementById("file_in").value = null;
	document.getElementById("playback").disabled = true;
	
	
	updateBG();
	
	cookie_allowSaving = true;
	loadCookies();
	
	start();
}

function initialize_players(num_players) {
	players = [];
	for (let i = 0; i < num_players; ++i) {
		players.push(new Block(playercoordx(i + 1), 18, 0, i + 1));
		players[i].completeConstructor();
	}
}

// go to top menu
function start() {
	state = STATE_MENU;
	win = false;
	
	// start bgm
	bgm[0].volume = 1; // volume fix
	bgm_play(0);
	
	// fix bg
	bg_no = 0;
	updateBG();
}

// when win, sets the death animation
function restart() {
	if (!win) return;
	state = STATE_END;
	state_frame = 0;
	end = 0;
	end_x = board_width / 2;
	end_y = -board_width;
}

// actually start a new game
function new_game() {
	if (players[0].hold > 3) special = true; 
	// stop showing windows >:(
	replay_d.style.display = "none"
	settings.style.display = "none";
	// set settings
	sdrop_on = toggle_sdrop;
	hold_on = toggle_hold;
	ez_pre = toggle_ezpre;
	
	// set score and such
	score = 0;
	rank = 0;
	ex_rank = 0;
	
	// reset bgm lv
	bgm_lv = 0;
	bgm_slv = 0;
	
	clear_canvas();
	create_board();
	drawBoard();
	state = STATE_READY;
	state_frame = 0;
	frame = 0;
	s_frame = 0;
	s_quadruples = 0;
	c_quadruples = 0;
	frame_replay = 0;
	win = false;
	message = MSG_NONE;
	message_frame = 0;
	
	// color fix
	if (mode == TETRIS) {
		players[0].color = player_num;
	}
	
	// ready player one
	for (let i = 0; i < players.length; ++i) {
		players[i].reset();
		spawn_first(players[i]);
		drawNext(players[i]);
	}
	
	// load replay
	if (viewing_replay) {
		// set settings from replay
		sdrop_on = replay.sdrop;
		hold_on = replay.hold;
		ez_pre = replay.ezpre;
		special = replay.special;
		
		// initialize key game settings
		initialize_players(replay.no_players);
		mode = replay.mode;
		difficulty = replay.difficulty;
		
		// color fix (again)
		if (mode == TETRIS) players[0].color = player_num;
		
		clear_canvas();
		create_board();
		drawBoard();
		
		for (let i = 0; i < players.length; ++i) {
			players[i].change_seed(replay.rng_seed[i]);
			spawn_first(players[i]);
			drawNext(players[i]);
			
			// set input index to start just in case
			replay.input_index[i] = 0;
		}
	// new replay
	} else {
		replay = new Replay(players, version, mode, difficulty, special, toggle_sdrop, toggle_hold, toggle_ezpre);
		if (special) play(se_prehold);
		
		// tells the game that we should be writing a replay and not waiting on the world to change
		loaded_replay = false;
		// fix the replay menu so that nothing dumb happens
		document.getElementById("replay_name").innerHTML = "Now recording...";
		document.getElementById("replay_name").style.color = "initial";
		document.getElementById("playback").disabled = true;
	}
	
	// settings overrride for various modes
	if (mode == TETRIS_EX && difficulty == 1) {
		mode = TETRIS_P;
	}
	if (mode == TETRIS_P) {
		hold_on = false;
		players[0].holding = true;
	}
	
	if (difficulty == HARD && mode == TETRIS && special) {
		mode = TETRIS_EX;
		difficulty = 4;
	}
	if (mode == TETRIS_EX) {
		if (difficulty == 4) {
			mode = DEMON_PRE;
			hold_on = false;
			players[0].holding = true;
		} else {
			// throwaway a bunh of values lol
			players[0].set_next();
			players[0].set_next();
			players[0].set_next();
			players[0].set_next();
		}
	}
	
	// ensure bgm
	if (mode == TETRIS_EX) {
		bgm_fade(0);
	}
	if (difficulty == HARD && mode == TETRIS) {
		bgm_fade(0);
		players[0].level = 5;
		bg_no = 5;
		updateBG();
	} else bgm_play(0);
	
	if (special && mode == TETRIS_P) {
		bgm_fade(0);
		players[0].level = 11;
		bg_no = 11;
		updateBG();
		ex_rank = 16;
	}
}

function create_board() {
	if (mode < TETRIS_D) {
		board = new Array(10);
	} else {
		// set the board size relative to the amount of players on the board
		board = new Array(2 + players.length * 6);
	}
	board_width = board.length;
	board_height = 22;
	board_fs = new Array(board.length);
	
	// set every tile on the board to empty
	for (let x = 0; x < board.length; x++) {
		board[x] = new Array(board_height);
		board_fs[x] = new Array(board_height);
		for (let y = 0; y < board[x].length; y++) {
			board[x][y] = 0; // no tile ocupying this spot
			board_fs[x][y] = new Floorspark(-1, 0); // no fs ocupying this spot
		}
	}
	spinsparks = [];
}
	
// the update function that is called every frame (16.69ms)
function frameUpdate() {
	update(); // update the game logic
	requestAnimationFrame(drawUpdate, framerate);
	//redraw(); // redraw the screen
}

function drawUpdate() {
	update_ac();
	redraw();
}

// game logic
function update() {
	// increment frame counters
	state_frame++;
	frame_game++;
	// cap frame counters
	state_frame %= Number.MAX_SAFE_INTEGER;
	frame_game %= Number.MAX_SAFE_INTEGER;
	s_frame++;
	if (message_frame > 0) {
		message_frame--;
		if (message_frame == 0) message = MSG_NONE;
	}
	// update the list of spark animations
	update_spinsparks();
	
	// update input
	update_buttons();
	
	// update current state
	update_state();
}

// applies gravity and velocity to spinsparks
function update_spinsparks() {
	for (let i = 0; i < spinsparks.length; ++i) {
		spinsparks[i][0] += spinsparks[i][2]; // increment x position
		spinsparks[i][1] += spinsparks[i][3]; // increment y position
		spinsparks[i][3] += spark_gravity; // update gravity
		
		// check if spark is out of bounds to delete
		if (spinsparks[i][0] < 0 || spinsparks[i][0] > w ||
		spinsparks[i][1] < 0 || spinsparks[i][1] > h) {
			spinsparks.splice(i, 1);
			i--; // this is supposed to not make the game crash
		}
	}
}

// increment the button variables, and do any frame by frame button processing
function update_buttons() {
	switch (state) {
	// TETRIS menu
	case STATE_MENU:
		// navigate menu
		if (check_arr(players[0].up)) {
			menu_option = menu_option == 0 ? menu_max - 1 : menu_option - 1;
			play(se_menuselect);
		}
		if (check_arr(players[0].down)) {
			menu_option = menu_option == menu_max - 1 ? 0 : menu_option + 1;
			play(se_menuselect);
		}
		
		// swap modes
		if (check_arr(players[0].left) || check_arr(players[0].right)) {
			if (check_arr(players[0].right)) {
				switch (mode) {
				case TETRIS: mode = TETRIS_EX; break;
				case TETRIS_P: mode = TETRIS_EX; break;
				case TETRIS_EX: mode = TETRIS_D; break;
				case TETRIS_D: mode = TETRIS; break;
				}
			} else {
				switch (mode) {
				case TETRIS: mode = TETRIS_D; break;
				case TETRIS_P: mode = TETRIS; break;
				case TETRIS_EX: mode = TETRIS; break;
				case TETRIS_D: mode = TETRIS_EX; break;
				}
			}
			if (mode == TETRIS_D) {
				initialize_players(2);
				document.getElementById("pcolor").style.display = "none";
			} else { // 1p
				initialize_players(1);
				document.getElementById("pcolor").style.display = "initial";
			}
			play(se_menuselect);
		}
		
		// confirm selection
		if (players[0].lrotate == 1 || players[0].rrotate == 1) {
			play(se_menuconfirm);
			difficulty = menu_option + 1;
			new_game();
		} break;
	case STATE_INGAME:
		for (let i = 0; i < players.length; ++i) {
			update_buttons_player(players[i]);
		} break;
	case STATE_VICTORY: case STATE_LOSE:
		for (let i = 0; i < players.length; ++i) {
			if ((players[i].hold == 1 || players[i].lrotate == 1 || players[i].rrotate == 1) && state_frame < 600) state_frame = 600;
		} break;
		
	}
	
	// increment button variables per player
	for (let i = 0; i < players.length; ++i) {
		increment_buttons(players[i]);
	}
}

function update_state(){
	switch (state) {
	case STATE_MENU:
		break;
	case STATE_READY:
		if (state_frame == 1) {
			play(se_ready);
			draw_ready();
		}
		if (state_frame == 41) {
			draw_ready();
		}
		if (state_frame == 81) {
			play(se_go);
			draw_ready();
		}
		if (state_frame >= 120) {
			// difficulty bgm change insert
			if (difficulty == HARD && mode == TETRIS) {
				bgm_play(2);
			}
			if (special && mode == TETRIS_P) {
				bgm_play(6);
			}
			if (mode == TETRIS_EX) {
				switch (difficulty) {
					case 3: bgm_play(14); break;
					default: bgm_play(12); break;
				}
			}
			
			// replays buffered inputs
			for (let i = 0; i < players.length; ++i) {
				// load buffers
				if (viewing_replay) {
					players[i].up = replay.start_buffer[i][0];
					players[i].down = replay.start_buffer[i][1];
					players[i].left = replay.start_buffer[i][2];
					players[i].right = replay.start_buffer[i][3];
					players[i].lrotate = replay.start_buffer[i][4];
					players[i].rrotate = replay.start_buffer[i][5];
					players[i].hold = replay.start_buffer[i][7];
				// save buffers
				} else if (!loaded_replay) { 
					replay.start_buffer.push([players[i].up, players[i].down, players[i].left, players[i].right,
						players[i].lrotate, players[i].rrotate, 0, players[i].hold]);
				}
			}
			
			// open the game
			for (let i = 0; i < players.length; ++i) {
				spawn_next(players[i]);
				players[i].state = STATE_MOVE;
				players[i].state_frame = 0;
			}
			
			// reset timer
			frame = 0;
			s_frame = 0;
			s_time = new Date().getTime();
			
			state = STATE_INGAME;
			state_frame = 0;
		} break;
	case STATE_INGAME:
		for (let i = 0; i < players.length; ++i) {
			update_state_player(players[i]);
			players[i].state_frame++;
			// TODO:? multiple breaks on death
			if (state != STATE_INGAME) break;
		}
		
		// TIMER
		if (!win) {
			frame++;
			frame %= Number.MAX_SAFE_INTEGER;
		}
		frame_replay++;
		frame_replay %= Number.MAX_SAFE_INTEGER;
		break;
	case STATE_END:
		// exit
		if (state_frame >= board_height * board_width) {
			if (win) state = STATE_VICTORY;
			else state = STATE_LOSE;
			state_frame = 0;
		}
		end += 2;
		
		// refresh
		clear_canvas();
		drawBoard();
		break;
	case STATE_VICTORY: case STATE_LOSE:
		// new game
		if (state_frame > 600) {
			/*if (special && (mode == DEMON || mode == DEMON_PRE) && difficulty == 4) {
				mode = TETRIS;
				difficulty = HARD;
			}*/
			if (mode == TETRIS_P) {
				mode = TETRIS_EX;
				difficulty = 1;
			}
			special = false;
			start();
			if (viewing_replay) initialize_players(players.length);
			else if (!loaded_replay) save_replay(replay);
			if (mode == DEMON || mode == DEMON_PRE) {
				mode = TETRIS_EX;
			}
			
			// make sure this is reenabled
			document.getElementById("playback").disabled = false;
			// make sure we don't spam watch replays
			viewing_replay = false;
			updateBG()
		}
		
		// draw whatever message you get for endgame
		if (state_frame == 1) drawGUI();
		break;
	}
}

function update_buttons_player(curr) {
	// replay processing. obviously only happens when replays.
	if (viewing_replay && (state == STATE_INGAME || state == STATE_READY)) {
		// don't go past the input list length, because that crashes the game lol
		// also checks to see if there is an input at this frame
		while (replay.input_index[curr.player - 1] < replay.input_list[curr.player - 1].length && 
				frame_replay == replay.input_list[curr.player - 1][replay.input_index[curr.player - 1]][2]) {
			// execute this frame's input
			switch (replay.input_list[curr.player - 1][replay.input_index[curr.player - 1]][0]) {
				case 0: curr.up = replay.input_list[curr.player - 1][replay.input_index[curr.player - 1]][1]; break;
				case 1: curr.down = replay.input_list[curr.player - 1][replay.input_index[curr.player - 1]][1]; break;
				case 2: curr.left = replay.input_list[curr.player - 1][replay.input_index[curr.player - 1]][1]; break;
				case 3: curr.right = replay.input_list[curr.player - 1][replay.input_index[curr.player - 1]][1]; break;
				case 4: curr.lrotate = replay.input_list[curr.player - 1][replay.input_index[curr.player - 1]][1]; break;
				case 5: curr.rrotate = replay.input_list[curr.player - 1][replay.input_index[curr.player - 1]][1]; break;
				case 7: curr.hold = replay.input_list[curr.player - 1][replay.input_index[curr.player - 1]][1]; break;
			}
			
			// increment replay input index
			replay.input_index[curr.player - 1]++;
		}
	}
	
	switch (curr.state) {
	case STATE_MOVE: // actual processing for buttons pressed
		// hold before anything else
		if (curr.hold == 1) {
			if (!curr.holding) {
				hold_block(curr);
			}
		}
	
		// rotate is always processed first
		if (curr.lrotate == 1 && curr.rrotate == 1) rotate180(curr);
		else if (curr.lrotate == 1) rotateL(curr);
		else if (curr.rrotate == 1) rotateR(curr);
		
		// move is processed second
		if (check_arr2(curr.left, curr) && curr.right == 0) {
			if (arr < 0 && curr.left > curr.getDAS()) {
				for (let shifts = arr * -1; shifts > 0; shifts--) {
					if (shiftLeft(curr)) {
					// TODO: to ensure move reset is only executed once properly, this may need to be rewritten
						if (shifts == 1) curr.move_reset();
						
						// process gravity between shifts in 20g
						if (curr.get_gravity() >= 2000 && checkDown(curr, false)) process_gravity(curr);
						// generate the "floorspark" vfx, if on floor
						if (draw_vfx) checkDownSpark(curr, -1);
					}
				}
			} else {
				if (shiftLeft(curr)) curr.move_reset();
			}
		}
		
		if (check_arr2(curr.right, curr) && curr.left == 0) {
			if (arr < 0 && curr.right > curr.getDAS()) {
				for (let shifts = arr * -1; shifts > 0; shifts--) {
					if (shiftRight(curr)) {
					// TODO: to ensure move reset is only executed once properly, this may need to be rewritten
						if (shifts == 1) curr.move_reset();
						
						// process gravity between shifts in 20g
						if (curr.get_gravity() >= 2000 && checkDown(curr, false)) process_gravity(curr);
						// generate the "floorspark" vfx, if on floor
						if (draw_vfx) checkDownSpark(curr, 1);
					}
				}
			} else {
				if (shiftRight(curr)) curr.move_reset();
			}
		}
		
		// special/instant drop
		if (curr.up == 1) {
			if (sdrop_on) {
				special_drop(curr, true);
			} else {
				instant_drop(curr);
			}
		}
		
		// this method will check the down variable before running
		fastDrop(curr);
		break;
	case STATE_PLACE:
		// the only thing that happens during the "place" state is processing for ez prerotate
		if (ez_pre) {
			if (curr.state_frame < are) {
				if (curr.hold == 1) curr.buffer |= 1;
				if (curr.lrotate == 1) curr.buffer |= 2;
				if (curr.rrotate == 1) curr.buffer |= 4;
			}
		} break;
	}
}

function increment_buttons(curr) {
	// increment buttons
	if (curr.up > 0) curr.up++;
	if (curr.down > 0) curr.down++;
	if (curr.left > 0) curr.left++;
	if (curr.right > 0) curr.right++;
	
	if (curr.lrotate > 0) curr.lrotate++;
	if (curr.rrotate > 0) curr.rrotate++;
	if (curr.hold > 0) curr.hold++;
}

function update_state_player(curr) {
	switch (curr.state) {
	case STATE_MOVE: 
		process_gravity(curr);
		break;
	case STATE_PLACE:
		if (curr.state_frame == 1) {
			// instantly shave any lines cleared
			check_line_clear(curr);
			// BUG-LP: there is port priority on line clears, last player gets priority
		}
		// when piece delay finishes
		if (curr.state_frame > curr.get_entry_delay()) {
			// spawn new block
			if (spawn_next(curr)) {
				// set back to move state
				curr.state = STATE_MOVE;
				curr.state_frame = 0;
			}
		}
		break;
	}
}

function update_ac() {
	// all clear animation not active
	if (all_clear == 0) return;
	
	// increment counter
	if (all_clear > 0) all_clear++;
	
	// animation finished
	if (all_clear == 80) all_clear = 0;
}

// attempts to set a quickblur for the current piece
function update_quickblur(curr) {
	// 20g blur
	if (draw_vfx && curr.get_gravity() >= 2000) {
		let w = 3;
		let x = curr.x;
		
		// width correction
		// width correction for i block
		if (curr.type == block_i) {
			if (curr.orientation % 2 == 0) w = 4;
			else { // vertical orientation
				w = 1;
				x++;
			}
		// width correction for o block
		} else if (curr.type == block_o) w = 2;
		// width correction for right orientation
		else if (curr.orientation == 1) {
			w = 2;
			// offset correction for s block
			if (curr.type == block_s) x--;
		// width correction for left orientation
		} else if (curr.orientation == 3) {
			w = 2;
			// offset correction for non-z block
			if (curr.type != block_z) x--;
		}
		
		// finally, add
		add_quickblur(x, curr.y, w, curr.color);
	}
}

// spawn the very first piece in the game
function spawn_first(curr){
	// put the block!
	curr.spawn(playercoordx(curr.player), 18, curr.rng.out % 7 + 1);
	// the last number rngenerated is used just to spawn the piece, but is immediately discarded
	
	// make sure the first block is not szo
	while (curr.rng.out % 7 + 1 == block_s || curr.rng.out % 7 + 1 == block_z || curr.rng.out % 7 + 1 == block_o) curr.rng.next_int();
	curr.next = curr.rng.out % 7 + 1; // set as starting piece
	curr.previous[0] = curr.next; // prepend to history
}


function spawn_next(curr){
	// spawn piece from next
	curr.spawn(playercoordx(curr.player), 18, curr.next);
	
	// override move reset counter
	if (!(mode == TETRIS && difficulty == EASY)) curr.moves = 0;
	if (mode >= TETRIS_D) curr.moves = players.length + 2; // 2 extra resets in multiplayer\
	
	// attempt to spawn piece
	for (let i = 0; i < players.length; ++i) {
		if (players[i].player == curr.player || !players[i].active) continue;
		for (let j = 0; j < 4; ++j) {
			for (let k = 0; k < 4; ++k) {
				if (curr.coll[j][0] == players[i].coll[k][0] && curr.coll[j][1] == players[i].coll[k][1]) {
					// failed to spawn piece
					curr.coll = [-1, -1, -1, -1];
					return false;
				}
			}
		}
	}
	
	curr.set_next();
	try_prerotate(curr);
	
	if (curr.held > 0) curr.holding = !hold_on; // allow hold
	// try to prerotate or prehold
	if ((curr.hold > 0 || (curr.buffer & 1)) && !curr.holding) {
		hold_block(curr);
		play(se_prehold);
	} else {
		// play sfx
		play(se_block[curr.next - 1]);
	}
	
	// death check
	if (!check(curr)) {
		lock(curr);
		curr.state = STATE_END; // don't do anything pls
		
		state = STATE_END;
		state_frame = 0;
		
		// set variables for death anim
		end = 0;
		end_x = curr.x;
		end_y = curr.y;
		e_time = new Date().getTime();	
		
		// don't sfx
		stop(se_block[curr.next - 1]);
		stop(se_prerotate);
		stop(se_prehold);
		stop(se_rotatefail);
		
		// go se and bgm fade out, if dead
		if (!win) {
			play(se_gameover);
			if (bgm_no != 0) bgm_fade(bgm_no);
		}
		return false;
	}
	
	// apply gravity
	if (checkDown(curr, false))	{
		process_gravity(curr);
		
		update_quickblur(curr);
	} else curr.step_reset();
	curr.upLevel(1, false);
	
	// see if we need to change bgm or fade
	update_bgm(curr);
	
	// reset buffer
	curr.buffer = 0;
	return true;
}

function playercoordx(player) {
	switch (mode) {
	case TETRIS: case TETRIS_P: case TETRIS_SP: case TETRIS_EX: case DEMON: case DEMON_PRE: return 4; break;
	case MULTITET: default: return (player * 6) - 3; break;
	}
	return 0; // failsafe
}

function process_gravity(curr) {
	// apply gravity
	curr.g += curr.get_gravity();
	
	// already on floor
	if (!checkDown(curr, true)) {
		curr.g %= g_denominator;
		if (curr.lock == 0) play(se_reset);
		curr.lock++;
		
		// automatic lock
		if (curr.lock > curr.get_lock_delay()) {
			lock(curr);
			curr.state_frame--; // bugfix for no line clear on autolock
			play(se_lock);
		}
	// not on floor
	} else {
		// gravity caused block to move down a cell
		while (curr.g >= g_denominator && checkDown(curr, false)) {
			curr.g -= g_denominator;
			curr.shiftDown();
		}
		curr.g %= g_denominator;
	}
}

function check_line_clear(curr) {
	// variable to contain lines to clear
	var lines = [];
	var already_in = false; // variable for if the current line is already in the line clear array
	
	// increment through collision array
	for (let i = 0; i < 4; ++i) {
		// check if line is completed
		for (let j = 0; j < board_width; ++j) {
			if (board[j][curr.coll[i][1]] == 0) break;
			// line was completed
			if (j == board_width - 1) {
				// make sure line isn't already in array, then add it
				for (let k = 0; k < lines.length; ++k) {
					if (lines[k] == curr.coll[i][1]) {
						alreadyin = true;
					}
				}
				// don't duplicate lines
				if (!alreadyin) lines[lines.length] = curr.coll[i][1];
			}
		}
		alreadyin = false;
	}
	
	// if lines were actually cleared
	if (lines.length > 0) {
		// needs to be sorted to clear properly
		lines.sort(function(a, b){return b - a});
		if (lines.length == 4) {
			c_quadruples++;
			s_quadruples++;
			if (mode == DEMON && s_quadruples == 3) {
				message = MSG_WICKED;
				message_frame = 240;
				play(se_mes_excellent);
			} else if (c_quadruples % 3 == 0) {
				message = MSG_COOL;
				message_frame = 240;
				play(se_mes_cool);
			}
		} else c_quadruples = 0;
		
		// grading
		// bugfix: score must be incremented before level so that you get score on game clear
		// BUG-LP: do not get extra level point on new level
		if (mode < TETRIS_D && !win) {
			score_up(lines.length);
		}
		
		// up the level by lines cleared
		if (mode == DEMON || mode == DEMON_PRE) {
			curr.upLevel(Math.trunc(lines.length * (lines.length + 1) * 0.5), true);
		} else curr.upLevel(lines.length, true);
		
		
		// delete any lines that were cleared
		for (let i = 0; i < lines.length; ++i) {
			for (let j = 0; j < board_width; ++j) {
				for (let k = lines[i]; k < board_height; ++k) {
					if (k == board_height - 1) board[j][k] = 0;
					else board[j][k] = board[j][k + 1];
				}
			}
		}
		
		// play the line clear sfx for the amount of lines cleared
		play(se_clear[lines.length - 1]);
		
		// BUG-LP: ac is not counted on win
		// check for all clear
		var ac = 0;
		
		// we can be sneaky and make it only check the bottom row of the board, tbh
		for (let i = 0; i < board_width; ++i) {
			if (board[i][0] > 0) break;
			ac++;
		}
		
		// all clear get
		if (ac == board_width) {
			play(se_clearall);
			// TODO: increment level of all players
			
			// score and level up again
			if (mode < TETRIS_D && !win) {
				score_up(lines.length);
			}
			curr.upLevel(lines.length, true);
			
			// start ac animation
			all_clear = 1;
		}
	} else c_quadruples = 0;
	
	// redraw all
	if (lines.length > 0) redraw();
}

// increments score and also changes rank, if applicable
// for 1p only
function score_up(lines_cleared) {
	score += 5 * (lines_cleared + 1) * lines_cleared;
	
	score += players[0].level * lines_cleared * (lines_cleared - 1);
	if (score >= get_next_points(rank) && get_next_points(rank) > 0) {
		while (score >= get_next_points(rank) && get_next_points(rank) > 0) rank++;
		if (max_rank(rank)) play(se_rankmax);
		else play(se_rankup);
		// TODO: grade up animation
	}
}

function cool(curr) {
	// PLUS mode
	if (mode == TETRIS_P) {
		if (ex_rank == 11) return; // don't display "cool" on reaching lv11
		if (s_frame < section_time(curr.level - 1)) { // checks the section time requirement
			if (s_quadruples >= sq_requirement(curr.level - 1)) { // checks the quadruples requirement
				if (ex_rank == curr.level - 1) { // only increments hidden rank if no cools were missed
					if (torikan()) ex_rank = curr.level; 
					if (ex_rank == 11) {
						message = MSG_OUTSTANDING;
						message_frame = 240;
						play(se_mes_outstanding);
						return;
					}
				}
				if (ex_rank == 8) {
					message = MSG_EXCELLENT;
					message_frame = 240;
					play(se_mes_excellent);
					return;
				}
				if (ex_rank == 11) return; // don't display "cool" on reaching lv11
				message = MSG_COOL;
				message_frame = 240;
				play(se_mes_cool);
			}
		}
	}
}


// checks if you will get torikan'd here
// returns TRUE if torikan passed
// returns FALSE if torikan NOT passed
function torikan() {
	if (mode == TETRIS_P) {
		if (ex_rank != 7 && ex_rank != 10) return true;
		if (ex_rank == 7 && frame < 27000 && rank >= 14) return true; // 7:30
		if (ex_rank == 10 && frame < 32700) return true; // 9:05
	}
	return false;
}

// returns if you are at the maximum rank achievable for the current game mode
function max_rank(in_rank) {
	if (mode == TETRIS_P) {
		if (in_rank == 24) return true;
		return false;
	}
	if (mode != TETRIS) return false;
	switch (difficulty) {
		case EASY: if (in_rank == 10) return true; break;
		case NORMAL: if (in_rank == 20) return true; break;
		case HARD: if (in_rank == 29) return true; break;
	}
	return false;
}

// returns if the time requirement for the difficulty mode has been met
function time_requirement(in_block) {
	if (mode == TETRIS_P && in_block.level == 16) return true;
	if (mode != TETRIS) return false;
	switch (difficulty) {
		case EASY: if (frame < 25200) return true; break; // 7:00
		case NORMAL: if (frame < 32340) return true; break; // 8:55
		case HARD: if (frame < 27000) return true; break; // 7:30
	}
	return false;
}

// checks the section quadruple requirement
function sq_requirement(in_level) {
	switch (mode) {
	case TETRIS_P:
		switch (in_level) {
			case 6: case 7: case 8: case 9: return 1;
			case 10: return 0;
			default: return 2;
		}
	}
	return 10000;
}


// returns if the time requirement for the difficulty mode has been met
function section_time(in_level) {
	switch (mode) {
	case TETRIS_P:
		switch (in_level) { 
			case 0: return 4200; // 70 sec
			case 5: return 3300; // 55 sec
			case 6: case 7: return 3000; // 50 sec
			case 8: case 9: case 10: return 2700; // 45 sec
			default: return 3900; // 65 sec
		}
	}
	return -1;
}

function hold_block(curr) {
	// make sure you can't spam hold
	if (!curr.holding) {
		curr.holding = true;
		let old = curr.type; // keep previous type so that we dont lose it
		// piece held, swap pieces
		if (curr.held > 0) {
			curr.spawn(playercoordx(curr.player), 18, curr.held);
			curr.held = old;
			// play sfx
			play(se_block[curr.next - 1]);
	
			// override move reset counter
			if (!(mode == TETRIS && difficulty == EASY)) curr.moves = 0;
			if (mode >= TETRIS_D) curr.moves = players.length + 2; // 2 extra resets in multiplayer
			
			try_prerotate(curr);
		} else {
			
			spawn_next(curr);
			// hold skips are
		}
		// deposit current into hold
		curr.held = old;
	}
}

// simply returns whether or not arr is repeating this frame
function check_arr(button) {
	if (button == 1 || button > das() + 1) {
		if (arr <= 0) return true; // 0 or fractional arr
		else if (button % arr == 0) return true; // integer arr
	}
	// all arr checks failed, button is not repeating
	return false;
}

// simply returns whether or not arr is repeating this frame
function check_arr2(button, player) {
	if (button == 1 || button > player.getDAS() + 1) {
		if (arr <= 0) return true; // 0 or fractional arr
		else if (button % arr == 0) return true; // integer arr
	}
	// all arr checks failed, button is not repeating
	return false;
}

function shiftLeft(curr) {
	if (!checkLeft(curr)) return false;
	curr.shiftLeft();
	return true;
}

function shiftRight(curr) {
	if (!checkRight(curr)) return false;
	curr.shiftRight();
	return true;
}

function rotateL(curr) {
	if (curr.rotbuff && curr.type != block_s && curr.type != block_z && curr.type != block_i) { // puyo-style 180 rotate
		try_rotate180(curr, false);
	} else if (curr.rrotate > 1) { // double right rotate
		try_rotate(curr, 1, false);
	} else { // standard rotate
		try_rotate(curr, -1, false);
	}
}

function rotateR(curr) {
	if (curr.rotbuff && curr.type != block_s && curr.type != block_z && curr.type != block_i) { // puyo-style 180 rotate
		try_rotate180(curr, false);
	} else if (curr.lrotate > 1) { // double left rotate
		try_rotate(curr, -1, false);
	} else { // standard rotate
		try_rotate(curr, 1, false);
	}
}

function rotate180(curr) {
	try_rotate180(curr, false);
}

function try_prerotate(curr) {
	// try to prerotate
	if ((curr.lrotate > 0 && curr.rrotate > 0) || ((curr.buffer & 4) && (curr.buffer & 2))) {
		try_rotate180(curr, true);
	} else if (curr.lrotate > 0 || (curr.buffer & 2)) {
		try_rotate(curr, -1, true);
	} else if (curr.rrotate > 0 || (curr.buffer & 4)) {
		try_rotate(curr, 1, true);
	}
}

// actual rotate (either left or right), complete with wallkick test
function try_rotate(curr, dir, prerotated) {
	// o block never "fails" to rotate
	if (curr.type == block_o) {
		if (prerotated) play(se_prerotate);
		else play(se_rotate);
		return;
	}
	
	// try the rotation tests
	var result = rotationTest(pivot(dir, curr), dir, curr); 
	// rotation failed, stop trying to rotate
	if (!result[0]) {
		play(se_rotatefail);
		curr.rotbuff = true;
		return;
	}
	
	// rotation succeeded, proceed as normal
	curr.coll = result[1]; // update collision
	curr.shiftBy(result[2][0] * dir, result[2][1]); // execute kick, if any
	curr.x += result[3];
	// update orientation
	curr.orientation += dir;
	if (curr.orientation == -1) curr.orientation = 3;
	if (curr.orientation == 4) curr.orientation = 0;
	// disable 180 rotate buffer
	curr.rot_buff = false;
	
	// play rotate sfx
	if (prerotated) play(se_prerotate);
	if (immobile(curr)) {
		play(se_rotateclick);
		curr.move_reset();
		add_spinspark(curr, dir);
	} else if (!curr.move_reset() && !prerotated) play(se_rotate);
}

// actual 180 rotate, complete with wallkick test
function try_rotate180(curr, prerotated) {
	curr.rotbuff = false;
	
	// oszi blocks never "fail" to rotate
	switch (curr.type) {
		case block_o: case block_s: case block_z: case block_i:
		if (prerotated) play(se_prerotate);
		else play(se_rotate);
		return;
	}
	
	// try the rotation tests
	var result = rotationTest(pivot(2, curr), 0, curr); 
	// rotation failed, stop trying to rotate
	if (!result[0]) {
		play(se_rotatefail);
		return;
	}
	
	// rotation succeeded, proceed as normal
	curr.coll = result[1]; // update collision
	curr.shiftBy(result[2][0] * result[3], result[2][1]); // execute kick, if any
	curr.orientation = (curr.orientation + 2) % 4;
	
	// play rotate sfx
	if (prerotated) play(se_prerotate);
	if (immobile(curr)) {
		play(se_rotateclick);
		curr.move_reset();
	} else if (!curr.move_reset() && !prerotated) play(se_rotate);
}

// rotates a piece around its axis (block 2)
function pivot(dir, piece){
	var pos = new Array(4);
	
	// special compensation for szi
	switch (piece.type) {
		case block_z:
			if (piece.orientation % 2 == 0) dir = 1;
			else dir = -1;
			break;
		case block_s:
		case block_i: 
			if (piece.orientation % 2 == 0) dir = -1;
			else dir = 1;
			break;
	}
	
	// rotate collision array
	if (dir == -1) { // left rotate
		pos[0] = [piece.coll[2][0] - (piece.coll[0][1] - piece.coll[2][1]), piece.coll[2][1] + (piece.coll[0][0] - piece.coll[2][0])];
		pos[1] = [piece.coll[2][0] - (piece.coll[1][1] - piece.coll[2][1]), piece.coll[2][1] + (piece.coll[1][0] - piece.coll[2][0])];
		pos[3] = [piece.coll[2][0] - (piece.coll[3][1] - piece.coll[2][1]), piece.coll[2][1] + (piece.coll[3][0] - piece.coll[2][0])];
		pos[2] = [piece.coll[2][0], piece.coll[2][1]];
	} else if (dir == 1) { // right rotate
		pos[0] = [piece.coll[2][0] + (piece.coll[0][1] - piece.coll[2][1]), piece.coll[2][1] - (piece.coll[0][0] - piece.coll[2][0])];
		pos[1] = [piece.coll[2][0] + (piece.coll[1][1] - piece.coll[2][1]), piece.coll[2][1] - (piece.coll[1][0] - piece.coll[2][0])];
		pos[3] = [piece.coll[2][0] + (piece.coll[3][1] - piece.coll[2][1]), piece.coll[2][1] - (piece.coll[3][0] - piece.coll[2][0])];
		pos[2] = [piece.coll[2][0], piece.coll[2][1]];
	} else if (dir == 2) { // 180 rotate
		pos[0] = [piece.coll[2][0] - (piece.coll[0][1] - piece.coll[2][1]), piece.coll[2][1] + (piece.coll[0][0] - piece.coll[2][0])];
		pos[1] = [piece.coll[2][0] - (piece.coll[1][1] - piece.coll[2][1]), piece.coll[2][1] + (piece.coll[1][0] - piece.coll[2][0])];
		pos[3] = [piece.coll[2][0] - (piece.coll[3][1] - piece.coll[2][1]), piece.coll[2][1] + (piece.coll[3][0] - piece.coll[2][0])];
		pos[2] = [piece.coll[2][0], piece.coll[2][1]];
		
		pos[0] = [pos[2][0] - (pos[0][1] - pos[2][1]), pos[2][1] + (pos[0][0] - pos[2][0])];
		pos[1] = [pos[2][0] - (pos[1][1] - pos[2][1]), pos[2][1] + (pos[1][0] - pos[2][0])];
		pos[3] = [pos[2][0] - (pos[3][1] - pos[2][1]), pos[2][1] + (pos[3][0] - pos[2][0])];
	}
	
	// post processing y fix for sz
	if (piece.orientation % 2 == 0) {
		if (piece.type == block_s || piece.type == block_z) for (let i = 0; i < 4; ++i) pos[i][1]++;
	} else {
		if (piece.type == block_s || piece.type == block_z) for (let i = 0; i < 4; ++i) pos[i][1]--;
	}
	return pos;
}

// soft drop, executes when down is held
function fastDrop(curr) {
	if (curr.down && !curr.up) {
		if (checkDown(curr, false)) {
			// can move down, so move down
			curr.shiftDown();
		} else if (!checkDown(curr, true)) {
			if (curr.lock_prev) return;
			if (curr.get_gravity() >= 2000 && curr.get_entry_delay() < 20) curr.lock_prev = true;
			// can NOT move down, lock this piece
			lock(curr);
			if (curr.lock == 0) play(se_reset); // bugfix: reset sfx not playing
			play(se_lockm);
		}
	} else if (!curr.down) curr.lock_prev = false;
}

function special_drop(curr, draw) {
	while (checkDown(curr, false)){
		curr.shiftDown();
	}
	// TODO: draw sonic drop "ring" effect
	if (draw);
}

function instant_drop(curr) {
	curr.step = 0;
	special_drop(curr, true);
	if (!checkDown(curr, true)) {
		lock(curr);
		play(se_lockh);
	}
}

// tests to see if the block can occupy its current spot
// does not check walls
// RETURNS true IF:		the current position is valid
// RETURNS false IF:	the current position is NOT valid
function check(curr) {
	for (let i = 0; i < 4; ++i) {
		if (board[curr.coll[i][0]][curr.coll[i][1]] > 0 ){
			return false;
		}
	}
	return true;
}

// tests to see if there is a spot below for the block to fall
// RETURNS true IF:		there is an available spot to move to
// RETURNS false IF:	there is NO available spot to move to
function checkDown(curr, absolute) {
	for (let i = 0; i < 4; ++i) {
		// check the bottom of the board
		if (curr.coll[i][1] == 0) return false;
		
		// check each cell individually
		if (board[curr.coll[i][0]][curr.coll[i][1] - 1] > 0 ){
			return false;
		}
		
		// don't check collision for if standing on a player
		if (absolute) continue;
		
		// check each player, too
		for (let j = 0; j < players.length; ++j) {
			if (players[j].player == curr.player || !players[j].active) continue;
			for (let k = 0; k < 4; ++k) {
				if (curr.coll[i][0] == players[j].coll[k][0] && curr.coll[i][1] - 1 == players[j].coll[k][1]) return false;
			}
		}
	}
	return true;
}

// checks each spot to see if it needs to trigger a floor spark, then so do
function checkDownSpark(curr, dir) {
	for (let i = 0; i < 4; ++i) {
		// check the bottom of the board
		if (curr.coll[i][1] == 0) {
			board_fs[curr.coll[i][0]][curr.coll[i][1]] = new Floorspark(curr.color, dir);
			continue;
		}
		
		// check collision for each cell
		if (board[curr.coll[i][0]][curr.coll[i][1] - 1] > 0 ){
			board_fs[curr.coll[i][0]][curr.coll[i][1]] = new Floorspark(curr.color, dir);
			continue;
		}
	}
	return true;
	
}

// tests to see if there is a spot below for the block to rise to
// RETURNS true IF:		there is an available spot to move to
// RETURNS false IF:	there is NO available spot to move to
function checkUp(curr) {
	for (let i = 0; i < 4; ++i) {
		// check the bottom of the board
		if (curr.coll[i][1] == board_height - 1) return false;
		
		// check each cell individually
		if (board[curr.coll[i][0]][curr.coll[i][1] + 1] > 0 ){
			return false;
		}
		
		// check each player, too
		for (let j = 0; j < players.length; ++j) {
			if (players[j].player == curr.player || !players[j].active) continue;
			for (let k = 0; k < 4; ++k) {
				if (curr.coll[i][0] == players[j].coll[k][0] && curr.coll[i][1] + 1 == players[j].coll[k][1]) return false;
			}
		}
	}
	return true;
}

// tests to see if there is a spot for the block to move to
// RETURNS true IF:		there is an available spot to move to
// RETURNS false IF:	there is NO available spot to move to
function checkLeft(curr) {
	for (let i = 0; i < 4; ++i) {
		// check the left wall
		if (curr.coll[i][0] == 0) return false;
		
		// check each cell individually
		if (board[curr.coll[i][0] - 1][curr.coll[i][1]] > 0 ){
			return false;
		}
		
		// check each player, too
		for (let j = 0; j < players.length; ++j) {
			if (players[j].player == curr.player || !players[j].active) continue;
			for (let k = 0; k < 4; ++k) {
				if (curr.coll[i][0] - 1 == players[j].coll[k][0] && curr.coll[i][1] == players[j].coll[k][1]) return false;
			}
		}
	}
	return true;
}

// tests to see if there is a spot for the block to move to
// RETURNS true IF:		there is an available spot to move to
// RETURNS false IF:	there is NO available spot to move to
function checkRight(curr) {
	for (let i = 0; i < 4; ++i) {
		// check the right wall
		if (curr.coll[i][0] == board_width - 1) return false;
		
		// check each cell individually
		if (board[curr.coll[i][0] + 1][curr.coll[i][1]] > 0 ){
			return false;
		}
		
		// check each player, too
		for (let j = 0; j < players.length; ++j) {
			if (players[j].player == curr.player || !players[j].active) continue;
			for (let k = 0; k < 4; ++k) {
				if (curr.coll[i][0] + 1 == players[j].coll[k][0] && curr.coll[i][1] == players[j].coll[k][1]) return false;
			}
		}
	}
	return true;
}

// checks all offsets and wallkicks for a rotation
function rotationTest(coll, dir, curr) {
	var offset = 0; // correction for szi: amount to displace by
	// szi correction for L rotate
	if (dir == -1) {
		// shift i or s block for L rotate
		if ((curr.type == block_i || curr.type == block_s) && curr.orientation % 2 != 0) {
			for (let i = 0; i < 4; ++i) {
				coll[i][0]--;
			}
			offset = -1;
		}
		// shift z block for L rotate
		if (curr.type == block_z && curr.orientation % 2 == 0) {
			for (let i = 0; i < 4; ++i) {
				coll[i][0]--;
			}
			offset = -1;
		}
	}
	
	// szi correction for R rotate
	if (dir == 1) {
		// shift i or s block for R rotate
		if ((curr.type == block_i || curr.type == block_s) && curr.orientation % 2 == 0) {
			for (let i = 0; i < 4; ++i) {
				coll[i][0]++;
			}
			offset = 1;
		}
		// shift z block for R rotate
		if (curr.type == block_z && curr.orientation % 2 != 0) {
			for (let i = 0; i < 4; ++i) {
				coll[i][0]++;
			}
			offset = 1;
		}
	}
	
	// variable to use to check to see if a rotation succeeded
	var success = 0;
	
	// select the wallkick array to use
	var wallkick = kick;
	
	 // select wallkick algorithm
	if (curr.type == block_i) {
		if (curr.orientation % 2 != 0) wallkick = wallkick.concat(kick_i); // append the pure wallkicks for i piece
		else wallkick = kick_i_flat;
	} else if (dir == 0) { // 180 kicks
		wallkick = kick_180;
		if (curr.orientation == 3) dir = -1;
		else if (curr.orientation == 1) dir = 1;
		// else dir = 0; // implied
		offset = dir;
	} else if (curr.orientation == 0 && curr.type != block_s && curr.type != block_z) wallkick = kick_flat; // changes priority of some kicks
	
	// execute every kick in the kick array
	for (let j = 0; j < wallkick.length; ++j) {
		
		// multi-level break for pvp collision
		dance:
		// test each kick to see if piece can move there
		for (let i = 0; i < 4; ++i) {
			// check the left wall
			if (coll[i][0] + wallkick[j][0] * dir <= -1) break;
			
			// check the left wall
			if (coll[i][0] + wallkick[j][0] * dir >= board_width) break;
			
			// check the floor
			if (coll[i][1] + wallkick[j][1] <= -1) break;
			
			// sanity check for the ceiling
			if (coll[i][1] + wallkick[j][1] >= board_height) break;
			
			// finally, check the kicked cell
			if (board[coll[i][0] + wallkick[j][0] * dir][coll[i][1] + wallkick[j][1]] > 0) break;
			
			// also check the kicked cell for other players
			for (let k = 0; k < players.length; ++k) {
				if (curr.player == players[k].player || !players[k].active) continue;
				for (let m = 0; m < 4; ++m) { // m = pos in colliding player's coll array
					if (coll[i][0] + wallkick[j][0] == players[k].coll[m][0] && coll[i][1] + wallkick[j][1] == players[k].coll[m][1]) break dance;
				}
			}
			
			success++;
		}
		
		// rotation successed, use these coords
		if (success == 4) {
			// return kicked coords
			return [true, coll, wallkick[j], offset];
		} else success = 0;
	}
	return [false, coll, wallkick[0], offset];
}

// checks to see if a piece is immobile, and returns the result
function immobile(curr) {
	var success = 0;
	
	for (let i = 0; i < 4; ++i) {
		if (checkDown(curr, false)) continue;
		if (checkLeft(curr)) continue;
		if (checkRight(curr)) continue;
		if (checkUp(curr)) continue;
		
		success++;
	}
	
	if (success == 4) return true;
	return false;
}

function lock(curr) {
	// bake the current piece into the board
	for (let i = 0; i < 4; ++i) {
		board[curr.coll[i][0]][curr.coll[i][1]] = curr.color;
	}
	
	drawNext(curr);
	drawHold(curr);
	
	// set state variables
	curr.state = STATE_PLACE;
	curr.state_frame = 1;
}

// finds the location of the ghost piece of the provided piece
function get_ghost(curr) {
	var ghost = curr.clone();
	special_drop(ghost, false);
	return ghost;
}

// tells you at what level you win at
function winlevel() {
	if (mode == TETRIS_EX) {
		switch (difficulty) {
			case 2: return 18;
			case 3: return 14;
			default: return 10;
		}
	}
	if (mode == TETRIS) {
		switch (difficulty) {
			case EASY: return 5;
			case NORMAL: return 10;
			case HARD: return 15;
		}
	} else if (mode == TETRIS_P) {
		switch (ex_rank) {
			case 10: return 11;
			case 11: return 16;
			case 16: return 16;
			default: return 10;
		}
	} else if (mode == DEMON) {
		return ex_rank;
	} else if (mode == DEMON_PRE) {
		return 5;
	} else {
		switch (difficulty) {
			case SHORT: return 3;
			case MEDIUM: return 5;
			case LONG: return 10;
		}
	}
	return false; // unwinnable
}

function demon_transition() {
	if (frame < 1980) {// 33 seconds
		let n1 = players[0].next;
		players[0].set_next();
		let n2 = players[0].next;
		players[0].pnext2 = players[0].next;
		players[0].pnext = n2;
		players[0].next = n1;
		mode = DEMON;
		hold_on = true;
		players[0].holding = false;
		players[0].level = 5;
		bgm_play(8);
		rank = 6;
	}
}

// checks to see if we have hit the win clause or not
function try_win() {
	for (let i = 0; i < players.length; ++i) {
		// active player did not win
		if (players[i].active && !players[i].win) return false;
	}
	
	// did not return earlier, proceed with win processing
	play(se_gamewin);
	bgm_play(7);
	win = true;
	restart();
	e_time = new Date().getTime();
	
	// successfully won the game
	return true;
}

// when a keyboard key is pressed
function keyPress(event) {
	if (viewing_replay && (state == STATE_INGAME || state == STATE_READY)) return;
	var key = event.keyCode;
	
	// processing by key
	for (let i = 0; i < players.length; ++i) {
		switch (key) {
		case key_up[i]:
			// make sure this key isn't already being pressed
			if (players[i].up == 0) {
				// set key pressed
				players[i].up = 1;
				
				// update replay input list 
				if (!loaded_replay && state == STATE_INGAME) replay.input_list[i].push([0, 1, frame_replay]);
			} break;
		case key_down[i]:
			// make sure this key isn't already being pressed
			if (players[i].down == 0) {
				// set key pressed
				players[i].down = 1;
				
				// update replay input list 
				if (!loaded_replay && state == STATE_INGAME) replay.input_list[i].push([1, 1, frame_replay]);
			} break;
		case key_left[i]:
			// make sure this key isn't already being pressed
			if (players[i].left == 0) {
				// set key pressed
				players[i].left = 1;
				
				// update replay input list 
				if (!loaded_replay && state == STATE_INGAME) replay.input_list[i].push([2, 1, frame_replay]);
			} break;
		case key_right[i]:
			// make sure this key isn't already being pressed
			if (players[i].right == 0) {
				// set key pressed
				players[i].right = 1;
				
				// update replay input list 
				if (!loaded_replay && state == STATE_INGAME) replay.input_list[i].push([3, 1, frame_replay]);
			} break;
		case key_lrotate[i]:
			// make sure this key isn't already being pressed
			if (players[i].lrotate == 0) {
				// set key pressed
				players[i].lrotate = 1;
				
				// update replay input list 
				if (!loaded_replay && state == STATE_INGAME) replay.input_list[i].push([4, 1, frame_replay]);
			} break;
		case key_rrotate[i]:
			// make sure this key isn't already being pressed
			if (players[i].rrotate == 0) {
				// set key pressed
				players[i].rrotate = 1;
				
				// update replay input list 
				if (!loaded_replay && state == STATE_INGAME) replay.input_list[i].push([5, 1, frame_replay]);
			} break;
		case key_hold[i]:
			// make sure this key isn't already being pressed
			if (players[i].hold == 0) {
				// set key pressed
				players[i].hold = 1;
				
				// update replay input list 
				if (!loaded_replay && state == STATE_INGAME) replay.input_list[i].push([7, 1, frame_replay]);
			} break;
		//default: alert(key); // idk what key this is, so please tell me
		}
    }
	
	// sets the controls when a control field is highlighted
	set_key(event.keyCode, remap_pno);
	
	// bugfix: prevents accidental highlights
	document.getSelection().removeAllRanges();
	
	// bugfix: prevents scrolling with arrow keys
    if ([32, 37, 38, 39, 40].indexOf(key) > -1) {
        event.preventDefault();
    }
}

// when a keyboard key is released
function keyRelease(event) {
	if (viewing_replay && (state == STATE_INGAME || state == STATE_READY)) return;
	var key = event.keyCode;
	
	// processing by key
	for (let i = 0; i < players.length; ++i) {
		switch (key) {
		case key_up[i]:
			players[i].up = 0;
				
			// update replay input list 
			if (!loaded_replay && state == STATE_INGAME) replay.input_list[i].push([0, 0, frame_replay]);
			break;
		case key_down[i]:
			players[i].down = 0;
				
			// update replay input list 
			if (!loaded_replay && state == STATE_INGAME) replay.input_list[i].push([1, 0, frame_replay]);
			break;
		case key_left[i]:
			players[i].left = 0;
				
			// update replay input list 
			if (!loaded_replay && state == STATE_INGAME) replay.input_list[i].push([2, 0, frame_replay]);
			break;
		case key_right[i]:
			players[i].right = 0;
				
			// update replay input list 
			if (!loaded_replay && state == STATE_INGAME) replay.input_list[i].push([3, 0, frame_replay]);
			break;
		case key_lrotate[i]:
			players[i].lrotate = 0;
				
			// update replay input list 
			if (!loaded_replay && state == STATE_INGAME) replay.input_list[i].push([4, 0, frame_replay]);
			break;
		case key_rrotate[i]:
			players[i].rrotate = 0;
				
			// update replay input list 
			if (!loaded_replay && state == STATE_INGAME) replay.input_list[i].push([5, 0, frame_replay]);
			break;
		case key_hold[i]:
			players[i].hold = 0;
				
			// update replay input list 
			if (!loaded_replay && state == STATE_INGAME) replay.input_list[i].push([7, 0, frame_replay]);
			break;
		}
	}
}

function das() {
	if (state < 10 || (mode == TETRIS && difficulty == EASY)) return 10; // 10 das for menus or easy mode
	else return 7; // 7 das ingame
}