// variables for game setting
var toggle_sdrop;
var toggle_hold;
var toggle_ezpre;
var sdrop_on;
var hold_on;
var ezpre;
var remap_pno;

function initialize_controls() {
	key_up = [];
	key_down = [];
	key_left = [];
	key_right = [];
	key_lrotate = [];
	key_rrotate = [];
	key_hold = [];
}

// called by the keypress function, sets the selected control to one inputted
function set_key(key, player) {
	if (selected_field == false) return;
	
	// update key
	switch (selected_field.id) {
		case "fc-up": key_up[player] = key; up = 0; break;
		case "fc-down": key_down[player] = key; down = 0; break;
		case "fc-left": key_left[player] = key; left = 0; break;
		case "fc-right": key_right[player] = key; right = 0; break;
		case "fc-lr": key_lrotate[player] = key; lrotate = 0; break;
		case "fc-rr": key_rrotate[player] = key; rrotate = 0; break;
		case "fc-hold": key_hold[player] = key; hold = 0; break;
	}
	
	// update field
	selected_field.value = get_control_name(key);
	
	// no longer map input to this key
	deselect_field();
	
	// deselect ALL the fields
	var inputs = document.getElementById("controls-preset").querySelectorAll("input");
	for (let i = inputs.length - 1; i >= 0; --i) { inputs[i].disabled = false; }
	
	// let's bake the cookie!
	saveCookies();
}

// used by the controls box to select a control field
// such that it can take input
function select_control_field(field) {
	deselect_field();
	field.style.backgroundColor = "#FF4B41";
	selected_field = field;
}

// used by the controls box to unselect a control field
function deselect_field() {
	if (selected_field == false) return;
	selected_field.style.backgroundColor = "#D0DBE2";
	selected_field = false;
}

function set_preset(preset, player) {
	// set the controls to the preset selected
	key_up[player] = keys_up[preset];
	key_down[player] = keys_down[preset]; 
	key_left[player] = keys_left[preset]; 
	key_right[player] = keys_right[preset];
	key_lrotate[player] = keys_lrotate[preset];
	key_rrotate[player] = keys_rrotate[preset];
	key_hold[player] = keys_hold[preset];
	
	
	// make the selected preset disabled
	// and the unselected presets enabled
	var inputs = document.getElementById("controls-preset").querySelectorAll("input");
	for (let i = 0; i < inputs.length; ++i) {
		if (i == preset) inputs[i].disabled = true;
		 else inputs[i].disabled = false;
	}
	
	// fix stuff lol idk
	deselect_field();
	reset_controls_div(player);
	
	// sometimes we will set the controls to a non-existent player
	try {
		// re-initialize the button variables
		players[player].up = players[player].down =  players[player].left =  players[player].right =  players[player].lrotate =  players[player].rrotate =  players[player].hold =  0;
	} catch (err) { /* do nothing */ }
	
	// let's bake the cookie!
	saveCookies();
}

// makes sure the div reflects the player
function reset_controls_div(player) {
	document.getElementById("fc-up").value = get_control_name(key_up[player]);
	document.getElementById("fc-down").value = get_control_name(key_down[player]);
	document.getElementById("fc-left").value = get_control_name(key_left[player]);
	document.getElementById("fc-right").value = get_control_name(key_right[player]);
	document.getElementById("fc-lr").value = get_control_name(key_lrotate[player]);
	document.getElementById("fc-rr").value = get_control_name(key_rrotate[player]);
	document.getElementById("fc-hold").value = get_control_name(key_hold[player]);
}

function get_control_name(key) {
	// letters
	if (key <= 90 && key >= 65) return String.fromCharCode(key);
	
	// numbers
	if (key <= 57 && key >= 48) return String.fromCharCode(key);
	
	// numpadders
	if (key <= 105 && key >= 96) return "Numpad " + (key - 96);
	
	// function keys
	if (key <= 135 && key >= 112) return "F" + (key - 111);
	
	switch (key) {
		case 3: return "Break";
		case 8: return "Backspace";
		case 9: return "Tab";
		case 13: return "Enter";
		case 16: return "Shift";
		case 17: return "Ctrl";
		case 18: return "Alt";
		case 19: return "Pause";
		case 27: return "Esc";
		case 32: return "Space";
		case 33: return "Page Up";
		case 34: return "Page Down";
		case 35: return "Home";
		case 36: return "End";
		case 37: return "Left";
		case 38: return "Up";
		case 39: return "Right";
		case 40: return "Down";
		case 44: return "Print Screen";
		case 45: return "Insert";
		case 46: return "Delete";
		case 59: return ";";
		case 20: return "Caps Lock";
		case 91: return "Win Key";
		case 93: return "Ctx Menu";
		case 106: return "Numpad *";
		case 107: return "Numpad +";
		case 109: return "Numpad -";
		case 110: return "Numpad .";
		case 111: return "Numpad /";
		case 144: return "Num Lock";
		case 145: return "Scroll Lock";
		case 171: return "+";
		case 173: return "-";
		case 187: return "=";
		case 188: return ",";
		case 189: return "-";
		case 190: return ".";
		case 191: return "/";
		case 192: return "`";
		case 219: return "[";
		case 220: return "\\";
		case 221: return "]";
		case 222: return "\"";
		
		case 59: case 61: return String.fromCharCode(key);;
	}
	
	return "¯\\_(ツ)_/¯";
}

function toggle_preferences() {
	settings.style.display = settings.style.display == "initial" ? "none" : "initial";
	replay_d.style.display = "none"
	deselect_field();
}

function toggle_replay() {
	settings.style.display = "none";
	replay_d.style.display = replay_d.style.display == "initial" ? "none" : "initial";
	deselect_field();
}

function toggle_music() {
	if (!play_bgm) {
		// turning bgm ON
		play_bgm = true;
		bgm_play(bgm_no);
		bgm[bgm_no].volume = 1;
		document.getElementById("bgm_button").value = "On";
	} else {
		// turning bgm OFF
		play_bgm = false;
		bgm[bgm_no].volume = 0;
		clear_timeouts();
		document.getElementById("bgm_button").value = "Off";
	}
	
	// let's bake the cookie!
	saveCookies();
}

function toggle_sfx() {
	play_se = !play_se;
	document.getElementById("se_button").value = play_se ? "On" : "Off";
	
	// let's bake the cookie!
	saveCookies();
}

function toggle_grid() {
	draw_grid = !draw_grid;
	document.getElementById("grid_button").value = draw_grid ? "On" : "Off";
	
	// let's bake the cookie!
	saveCookies();
}

function toggle_outline() {
	draw_outline = !draw_outline;
	document.getElementById("outline_button").value = draw_outline ? "On" : "Off";
	
	// let's bake the cookie!
	saveCookies();
}

function toggle_vfx () {
	draw_vfx = !draw_vfx;
	document.getElementById("vfx_button").value = draw_vfx ? "On" : "Off";
	
	// let's bake the cookie!
	saveCookies();
}

function toggle_ghost () {
	draw_ghost = !draw_ghost;
	document.getElementById("ghost_button").value = draw_ghost ? "On" : "Off";
	drawActiveAll();
	
	// let's bake the cookie!
	saveCookies();
}

function toggle_bg () {
	draw_bg = !draw_bg;
	document.getElementById("bg_button").value = draw_bg ? "On" : "Off";
	updateBG();
	
	// let's bake the cookie!
	saveCookies();
}

function toggle_underlay () {
	draw_underlay = !draw_underlay;
	document.getElementById("underlay_button").value = draw_underlay ? "On" : "Off";
	
	// let's bake the cookie!
	saveCookies();
}

function toggle_autoresize() {
	autoresize = !autoresize;
	document.getElementById("resize_button").value = autoresize ? "On" : "Off";
	if (autoresize) {
		set_tilesize();
	}
	
	// let's bake the cookie!
	saveCookies();
}

function toggle_t_sdrop() {
	toggle_sdrop = !toggle_sdrop;
	document.getElementById("t-sdrop_button").value = toggle_sdrop ? "On" : "Off";
	
	// let's bake the cookie!
	saveCookies();
}

function toggle_t_hold() {
	toggle_hold = !toggle_hold;
	document.getElementById("t-hold_button").value = toggle_hold ? "On" : "Off";
	
	// let's bake the cookie!
	saveCookies();
}

function toggle_t_ezpre() {
	toggle_ezpre = !toggle_ezpre
	document.getElementById("t-ezpre_button").value = toggle_ezpre ? "On" : "Off";
	
	// let's bake the cookie!
	saveCookies();
}

function change_tilesize(change_to) {
	tile_size = parseInt(change_to);
	tile_size_smol = parseInt(tile_size * 0.75);
	
	scale = tile_size / min_tilesize;
	
	document.getElementById("tilesizep").innerHTML = "Size: " + tile_size;
	
	refreshCanvasSize();
	
	// let's bake the cookie!
	saveCookies();
}

// TETRIS ONLY
function change_player(change_to) {	
	player_num = change_to;
	players[0].color = change_to;
	
	drawTiles();
	drawActiveAll();
	
	// let's bake the cookie!
	saveCookies();
}

// switches the selected settings window
function settings_swap(swap_to) {
	switch (swap_to) {
	case 0:
		document.getElementById("aesthetics").style.display = "initial";
		document.getElementById("controls").style.display = "none";
		document.getElementById("gsetting").style.display = "none";
		break;
	case 1:
		document.getElementById("aesthetics").style.display = "none";
		document.getElementById("controls").style.display = "initial";
		document.getElementById("gsetting").style.display = "none";
		break;
	case 2:
		document.getElementById("aesthetics").style.display = "none";
		document.getElementById("controls").style.display = "none";
		document.getElementById("gsetting").style.display = "initial";
		break;
	}
	
	deselect_field();
}

// changes the player we are remapping to
function set_remap_pno(pno_to) {
	document.getElementById("remap-p" + pno_to).disabled = true;
	if (pno_to == 1) document.getElementById("remap-p2").disabled = false;
	if (pno_to == 2) document.getElementById("remap-p1").disabled = false;
	
	remap_pno = pno_to - 1;
	reset_controls_div(remap_pno);
	deselect_field();
	
	// i'm too lazy to make this autoupdate so this is what you get
	// TODO: autoupdate
	clear_preset();
}

function clear_preset() {
	var inputs = document.getElementById("controls-preset").querySelectorAll("input");
	for (let i = 0; i < inputs.length; ++i) {
		inputs[i].disabled = false;
	}
}