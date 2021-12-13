
// variables for replays
var replay_file; // actual replay file, used for saving and loading
var replay; // variable holding current replay
var viewing_replay; // are we currently reading from replay?
var loaded_replay; // is a replay from file currently in memory?

class Replay {
	constructor(_players, _version, _mode, _difficulty, _special, _sdrop, _hold, _ezpre) {
		// please note that it does not expect a block object,
		// but any object that has an rng_seed attribute
		// please do not use anything exclusive to block.
		
		// settings
		this.ezpre = _ezpre;
		this.sdrop = _sdrop;
		this.hold = _hold;
		
		this.no_players = _players.length
		this.rng_seed = [];
		this.input_list = [];
		this.input_index = [];
		this.start_buffer = [];
		this.version = _version; // string
		this.mode = _mode;
		this.difficulty = _difficulty;
		this.special = _special;
		
		for (let i = 0; i < players.length; ++i) {
			this.rng_seed[i] = players[i].rng.seed;
			this.input_list[i] = [];
			this.input_index[i] = 0;
		}
	}
	
	out() {
		// the variable we will store the SHIT in
		var bin = this.version + "|";
		// the vars we will store the settei in
		var binset;
		
		// throw all the settings into a single number
		if (this.ez_pre) binset |= 1;
		if (this.sdrop) binset |= 2;
		if (this.hold) binset |= 4;
		binset |= this.no_players << 4;
		bin += binset + String.fromCharCode(binset + 58); // concat
		
		bin += this.mode + "j";
		bin += this.difficulty + "c";
		bin += (this.special == true ? 1 : 0) + "y";
		
		bin += this.rng_seed.join('e');
		bin += "e";
		
		binset = [];
		for (let i = 0; i < this.input_list.length; ++i) {
			binset[i] = [];
			for (let j = 0; j < this.input_list[i].length; ++j ) {
				binset[i].push(this.input_list[i][j].join("R"));
			}
			binset[i] = binset[i].join("E");
		}
		bin += binset.join("P");
		bin += "P";
		
		binset = [];
		for (let i = 0; i < this.start_buffer.length; ++i) {
			binset.push(this.start_buffer[i].join('z'));
		}
		bin += binset.join("U");
		bin += "U";
		
		return bin;
	}
}

function load_replay(filein) {
	var reader = new FileReader();
	reader.onload = function(lrep) {
		try {
			replay = read_replay(lrep.target.result);
			loaded_replay = true;
			
			// empty string
			document.getElementById("replay_info").innerHTML = "";
			// warning message when loading bad ver replay
			if (replay.version != version) {
				document.getElementById("replay_info").innerHTML = "This replay's version does not match this version of the game.\
				<br />It will attempt be played, but it may not function properly.";
			}
			
			// replay successed! we are good to go
			document.getElementById("replay_name").innerHTML = "Loaded replay from file!";
			document.getElementById("replay_name").style.color = "#2222F0";
			document.getElementById("playback").disabled = false;
			
			// delete the previously loaded replay, if applicable
			if (replay_file != null) {
				window.URL.revokeObjectURL(replay_file); // prevents memory leaks
				replay_file = null; // prevents crashing
			}
		} catch (error) {
			// some kind of error happened, just give up.
			console.log(error); // rare footage of console.log
			document.getElementById("replay_name").innerHTML = "<em>No replay loaded.</em>";
			document.getElementById("replay_name").style.color = "initial";
			document.getElementById("replay_info").innerHTML = "Error reading replay file!<br />Maybe it is not an actual replay file?";
			replay = null;
			viewing_replay = false;
			loaded_replay = false;
		}
	}
	reader.readAsText(filein[0]);
}

function read_replay(bin) {
	var _replay;
	
	var _version;
	var _ezpre;
	var _sdrop;
	var _hold;
	var _no_players;
	var _rng_seed;
	var _input_list;
	var _input_index;
	var _start_buffer;
	var _version;
	var _mode;
	var _difficulty;
	var _special;
	
	var settei;
	var input_i;
	var input_j;
	var input_k;
	var input_s;
	
	bin = bin.split("|");
	_version = bin[0];
	bin = bin[1];
	
	settei = parseInt(bin);
	_ezpre = settei & 1;
	_sdrop = settei & 2;
	_hold = settei & 4;
	_no_players = settei >> 4;
	bin = bin.slice(String(settei).length + 1);
	
	bin = bin.split("j");
	_mode = parseInt(bin[0]);
	
	bin = bin[1].split("c");
	_difficulty = parseInt(bin[0]);
	bin = bin[1];
	
	bin = bin.split("y");
	_special = parseInt(bin[0]) == 0 ? false : true;
	bin = bin[1];
	
	_rng_seed = bin.split("e");
	bin = _rng_seed.pop();
	for (let i = 0; i < _rng_seed.length; ++i) { _rng_seed[i] = parseInt(_rng_seed[i]); }
		
	// now that we have the key initial values, construct the replay object
	_replay = new Replay(_rng_seed, _version, _mode, _difficulty, _special, _sdrop, _hold, _ezpre);
	
	// start writing to the replay
	bin = bin.split("P");
	_input_list = [];
	
	for (let i = 0; i < bin.length - 1; ++i) {
		input_i = bin[i].split("E");
		_input_list[i] = [];
		
		for (let j = 0; j < input_i.length; ++j) {
			input_j = input_i[j].split("R");
			input_k = [];
			
			for (let k = 0; k < input_j.length; ++k) {
				input_k.push(parseInt(input_j[k]));
			}
			_input_list[i].push(input_k);
		}
	}
	bin = bin.pop();
	
	bin = bin.split("U");
	_start_buffer = [];
	
	for (let i = 0; i < bin.length - 1; ++i) {
		input_s = bin[i].split("z");
		_start_buffer[i] = [];
		
		for (let k = 0; k < input_s.length; ++k) {
			_start_buffer[i].push(parseInt(input_s[k]));
		}
	}
	
	_replay.input_list = _input_list;
	_replay.start_buffer = _start_buffer;
	_replay.rng_seed = _rng_seed;
	return _replay;
}

function save_replay(_replay) {
	// save the replay to a file in memory
	var replay_out = new Blob([_replay.out()], {type: 'application/x.mrp'});
    if (replay_file != null) window.URL.revokeObjectURL(replay_file); // prevents memory leaks
	replay_file = window.URL.createObjectURL(replay_out);
	
	// provide a download to the user
	document.getElementById("replay_name").innerHTML = "Finished recording! Click <a href=\"" + replay_file + "\" download=\"replay.mrp\">here</a> to download your replay.";
	document.getElementById("replay_name").style.color = "#2222F0";
	// also allow the user to instantly replay their replay
	document.getElementById("playback").disabled = false;
	
	// empty string
	document.getElementById("replay_info").innerHTML = "";
}

function playback() {
	// panic error message
	if (typeof replay === 'undefined' || replay == null) {
		document.getElementById("replay_info").innerHTML = "Error playing back replay!<br />No idea what broke lol";
		replay = null;
		viewing_replay = false;
		loaded_replay = false;
		return;
	}
	
	// start new replay
	viewing_replay = true;
	new_game();
	
	document.getElementById("playback").disabled = true;
}