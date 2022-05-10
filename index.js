// every thing you touch you change
// Main Operation Application
// @author: Fernando Obieta
// ----------------------------------------------------

// ----------------------------------------------------
// Settings
// ----------------------------------------------------

const ARDUINO_ACTIVE = false;

/*
minIntensity in percent,
maxIntensity in percent,
minTime in seconds,
maxTime in seconds,
maxPreDelay in seconds,
maxDelayMove in seconds,
*/

const SCENARIOS = [
	// 0
	{
		minIntensity: 50,
		maxIntensity: 100,
		minTime: 30,
		maxTime: 60,
		maxPreDelay: 30,
		maxDelayMove: 30,
	},
	// 1
	{
		minIntensity: 25,
		maxIntensity: 75,
		minTime: 60,
		maxTime: 90,
		maxPreDelay: 60,
		maxDelayMove: 60,
	},
	// 2
	{
		minIntensity: 0,
		maxIntensity: 50,
		minTime: 90,
		maxTime: 300,
		maxPreDelay: 120,
		maxDelayMove: 120,
	},
];

const SCENARIOS_BUFFER = 10000; // in ms
const MOVE_BACK_TIME = 500; // in ms
const MIN_POSITION = 500;

// ----------------------------------------------------
// Configuration
// ----------------------------------------------------

const SerialPort = require('serialport');
const ARDUINO_PATH = '/dev/cu.usbmodem14201';
const ARDUINO_BAUDRATE = 9600;

let port;

if (ARDUINO_ACTIVE) {
	port = new SerialPort(ARDUINO_PATH, {
		baudRate: ARDUINO_BAUDRATE
	});
}

const MAX_MOTOR_NO = 8;
const MAX_POSITION = 1800;
const ZERO_POSITION = 0;
const MAX_TIME = 9999;

// ----------------------------------------------------
// Serial
// ----------------------------------------------------

function move(motor, position, time) {
	if (motor >= 1 && motor <= MAX_MOTOR_NO
		&& position >= 0 && position <= MAX_POSITION
		&& time >= 0 && time <= MAX_TIME
		) {
		if (ARDUINO_ACTIVE) {
			// 1-1800-2000\n
			port.write(`${motor}-${zeroPad(position)}-${zeroPad(time)}\n`);
		}
	} else {
		throw(`wrong move parameters`);
	}
}

// ----------------------------------------------------
// Utility
// ----------------------------------------------------

function zeroPad(num) {
	return String(num).padStart(4, '0');
}

function randomInt(min, max) {
	return Math.round(Math.random() * (max - min) + min);
}

function mapRange(value, low1, high1, low2, high2) {
	return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}

function getScenarioNo() {
	return randomInt(0, SCENARIOS.length - 1);
}

// function getPosition(intensity) {
// 	return 
// }

function getMoveTime(position) {
	return Math.round(position * 1.5);
}

// ----------------------------------------------------
// Application: Loop
// ----------------------------------------------------

let lastScenario;

function setScenario() {
	let currentScenario;
	do {
		currentScenario = getScenarioNo();
	} while(currentScenario === lastScenario);
	lastScenario = currentScenario;

	const scenarioTime = randomInt(SCENARIOS[currentScenario].minTime * 1000, SCENARIOS[currentScenario].maxTime * 1000);

	console.log(`    `);
	console.log(`    `);
	console.log(`======== CURRENT SCENARIO SETUP: ${currentScenario} for ${scenarioTime / 1000}s ========`);
	console.log(`    `);


	for (let currentMotor = 1; currentMotor <= MAX_MOTOR_NO; currentMotor++) {
		let gatheredTime = 0;
		let addingMoves = true;
		console.log(`==== SETTING MOTOR ${currentMotor}     ====`);
		while (addingMoves) {
			let preDelay = randomInt(0, SCENARIOS[currentScenario].maxPreDelay * 1000);
			// console.log(`preDelay ${preDelay}`);
			let position = mapRange(
				randomInt(SCENARIOS[currentScenario].minIntensity, SCENARIOS[currentScenario].maxIntensity),
				SCENARIOS[currentScenario].minIntensity, 
				SCENARIOS[currentScenario].maxIntensity,
				MIN_POSITION,
				MAX_POSITION
				);
			// console.log(`position ${position}`);
			let moveTime = getMoveTime(position);
			// console.log(`moveTime ${moveTime}`);
			let delayMove = randomInt(0, SCENARIOS[currentScenario].maxDelayMove * 1000);
			// console.log(`delayMove ${delayMove}`);

			const addGatheredTime = preDelay + moveTime + delayMove + MOVE_BACK_TIME;
			// console.log(`addGatheredTime ${addGatheredTime}`);

			if ((gatheredTime + addGatheredTime) < scenarioTime) {
				// move to
				setTimeout(function (){
					move(currentMotor, position, moveTime);
					console.log(`>>>>${currentScenario}>>>>>>${currentMotor}>>TO>>>> move motor ${currentMotor} TO ${position / 10}˚ in ${moveTime / 1000}s and RE ${(preDelay + moveTime + delayMove) / 1000}s later`);
				}, gatheredTime + preDelay);

				// move back
				setTimeout(function() {
					move(currentMotor, ZERO_POSITION, MOVE_BACK_TIME);
					console.log(`>>>>${currentScenario}>>>>>>${currentMotor}>>RE>>>> move motor ${currentMotor} RE ${ZERO_POSITION / 10}˚ in ${MOVE_BACK_TIME / 1000}s`);
				}, gatheredTime + preDelay + moveTime + delayMove);

				gatheredTime += addGatheredTime;

				console.log(`-- set motor ${currentMotor} to move in ${preDelay / 1000}s to ${position / 10}˚ and back after ${delayMove / 1000}s.`);
			} else {
				addingMoves = false;
			}
		}
		console.log(`==== END SETTING MOTOR ${currentMotor} ====`);
		console.log(`    `);
	}

	console.log(`======== END CURRENT SCENARIO SETUP: ${currentScenario} ========`);
	console.log(`    `);
	console.log(`@@@@ next scenario setup in ${(scenarioTime + SCENARIOS_BUFFER) / 1000}s`);
	console.log(`    `);
	console.log(`    `);

	setTimeout(setScenario, scenarioTime + SCENARIOS_BUFFER);
}

// ----------------------------------------------------
// Application Start
// ----------------------------------------------------

console.log(`    `);
console.log(`    `);
console.log(`"every thing you touch you change" started and Arduino Serial communication is ${ARDUINO_ACTIVE}`);
console.log(`    `);
console.log(`    `);
console.log(`    `);
console.log(`    `);

setScenario();
