/* legend:
	UP: 38
	DOWN: 40
	LEFT: 37
	RIGHT: 39
	
	Z: 90
	X: 88
	C: 67
	
	LSHIFT: 16
	SPACE: 32
*/

// Control types: Default / Reverse / Alternate / Wack / Custom



/* control setup default:
	Up - Up
	Down - Down
	Left - Left
	Right - Right
	Left Rotate - Z
	Right Rotate - X
	Hold - LShift
*/
const default_key_up = 38;
const default_key_down = 40;
const default_key_left = 37;
const default_key_right = 39;
const default_key_lrotate = 90;
const default_key_rrotate = 88;
const default_key_hold = 16;

/* control setup reverse:
	Up - Up
	Down - Down
	Left - Left
	Right - Right
	Left Rotate - X
	Right Rotate - Z
	Hold - LShift
*/
const reverse_key_up = 38;
const reverse_key_down = 40;
const reverse_key_left = 37;
const reverse_key_right = 39;
const reverse_key_lrotate = 88;
const reverse_key_rrotate = 90;
const reverse_key_hold = 16;

/* control setup alternate:
	Up - Space
	Down - Down
	Left - Left
	Right - Right
	Left Rotate - Z
	Right Rotate - X
	Hold - C
*/
const alternate_key_up = 32;
const alternate_key_down = 40;
const alternate_key_left = 37;
const alternate_key_right = 39;
const alternate_key_lrotate = 90;
const alternate_key_rrotate = 88;
const alternate_key_hold = 67;

/* control setup wack:
	Up - Space
	Down - Down
	Left - Left
	Right - Right
	Left Rotate - Up
	Right Rotate - X
	Hold - LCtrl
*/
const wack_key_up = 32;
const wack_key_down = 40;
const wack_key_left = 37;
const wack_key_right = 39;
const wack_key_lrotate = 38;
const wack_key_rrotate = 88;
const wack_key_hold = 17;

/* control setup wasd:
	Up - W
	Down - S
	Left - A
	Right - D
	Left Rotate - K
	Right Rotate - L
	Hold - ;
*/
const wasd_key_up = 87;
const wasd_key_down = 83;
const wasd_key_left = 65;
const wasd_key_right = 68;
const wasd_key_lrotate = 75;
const wasd_key_rrotate = 76;
const wasd_key_hold = 59;

/* control setup dvorak:
	Up - Up
	Down - Down
	Left - Left
	Right - Right
	Left Rotate - ;
	Right Rotate - Q
	Hold - LShift
*/
const dvorak_key_up = 38;
const dvorak_key_down = 40;
const dvorak_key_left = 37;
const dvorak_key_right = 39;
const dvorak_key_lrotate = 59;
const dvorak_key_rrotate = 81;
const dvorak_key_hold = 16;

const keys_up = [default_key_up, reverse_key_up, alternate_key_up, wack_key_up, wasd_key_up, dvorak_key_up];
const keys_down = [default_key_down, reverse_key_down, alternate_key_down, wack_key_down, wasd_key_down, dvorak_key_down];
const keys_left = [default_key_left, reverse_key_left, alternate_key_left, wack_key_left, wasd_key_left, dvorak_key_left];
const keys_right = [default_key_right, reverse_key_right, alternate_key_right, wack_key_right, wasd_key_right, dvorak_key_right];
const keys_lrotate = [default_key_lrotate, reverse_key_lrotate, alternate_key_lrotate, wack_key_lrotate, wasd_key_lrotate, dvorak_key_lrotate];
const keys_rrotate = [default_key_rrotate, reverse_key_rrotate, alternate_key_rrotate, wack_key_rrotate, wasd_key_rrotate, dvorak_key_rrotate];
const keys_hold = [default_key_hold, reverse_key_hold, alternate_key_hold, wack_key_hold, wasd_key_hold, dvorak_key_hold];

// stores the key codes for all buttons
// these are all arrays
var key_up;
var key_down;
var key_left;
var key_right;
var key_lrotate;
var key_rrotate;
var key_hold;
