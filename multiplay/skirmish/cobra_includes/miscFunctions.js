
// Random number between 0 and max-1.
function random(max) {
	return (max <= 0) ? 0 : Math.floor(Math.random() * max)
}

// Returns true if something is defined
function isDefined(data) {
	return typeof(data) !== "undefined";
}

//Sort an array from smallest to largest in value.
function sortArrayNumeric(a, b) {
	return a - b;
}

//Sort by distance to base and reverse.
function sortAndReverseDistance(arr) {
	return (arr.sort(distanceToBase)).reverse();
}

//A controlled way to send chat messages between Cobra AI.
function sendChatMessage(msg, receiver) {
	if(!isDefined(msg)) { return; }
	if(!isDefined(receiver)) { receiver = ALLIES; }
	
	if(lastMsg != msg) {
		lastMsg = msg;
		chat(receiver, msg);
	}
}

//Control the amount of objects being put in memory so we do not create a large array of objects.
//Returns the closest enemy object from Cobra base.
function rangeStep(obj, visibility) {
	const step = 3000;
	var target;
	
	for(var i = 0; i <= 30000; i += step) {	
		var temp = enumRange(obj.x, obj.y, i, ENEMIES, visibility);
		if(temp.length > 0) {
			temp.sort(distanceToBase);
			return temp[0];
		}
	}
	
	return target;
}

//Taken from nullbot v3.06
//Do the vtol weapon have ammo?
function vtolArmed(obj, percent) {
	if (obj.type != DROID)
		return;
	
	if (!isVTOL(obj))
		return false;
	
	for (var i = 0; i < obj.weapons.length; ++i)
		if (obj.weapons[i].armed >= percent)
			return true;
		
	return false;
}

//Taken from nullbot v3.06
//Should the vtol attack when ammo is high enough?
function vtolReady(droid) {
	if (droid.order == DORDER_ATTACK)
		return false;
	
	if (vtolArmed(droid, 1))
		return true;
	
	if (droid.order != DORDER_REARM) {
		orderDroid(droid, DORDER_REARM);
	}
	
	return false;
}

//Ally is false for checking for enemy players
//Ally is true for allies.
function playerAlliance(ally) {
	if(!isDefined(ally)) { ally = false; }
	var players = [];
	
	for(var i = 0; i < maxPlayers; ++i) {
		if(!ally) {
			if(!allianceExistsBetween(i, me) && (i != me)) {
				players.push(i);
			}
		}
		else {
			if(allianceExistsBetween(i, me) && (i != me)) {
				players.push(i);
			}
		}
	}
	return players;
}

//Change stuff depending on difficulty.
function diffPerks() {	
	switch(difficulty) {
		case EASY:
			//maybe make the worst build order ever.
			break;
		case MEDIUM:
			//Do nothing
			break;
		case HARD:
			if(!isStructureAvailable("A0PowMod1"))
				completeRequiredResearch("R-Vehicle-Engine01");
			makeComponentAvailable("PlasmaHeavy", me);
			makeComponentAvailable("MortarEMP", me);
			break;
		case INSANE:
			//In addition to what Hard does, turn on the NIP.
			if(!isStructureAvailable("A0PowMod1"))
				completeRequiredResearch("R-Struc-PowerModuleMk1");
			nexusWaveOn = true;
			makeComponentAvailable("PlasmaHeavy", me);
			makeComponentAvailable("MortarEMP", me);
			break;
	}
}

//Dump some text.
function log(message) {
	dump(gameTime + " : " + message);
}

//Dump information about an object and some text.
function logObj(obj, message) {
	dump(gameTime + " [" + obj.name + " id=" + obj.id + "] > " + message);
}

//Distance between an object and the Cobra base.
function distanceToBase(obj1, obj2) {
	var dist1 = distBetweenTwoPoints(startPositions[me].x, startPositions[me].y, obj1.x, obj1.y);
	var dist2 = distBetweenTwoPoints(startPositions[me].x, startPositions[me].y, obj2.x, obj2.y);
	return (dist1 - dist2);
}

//See if we can design this droid. Mostly used for checking for new weapons with the NIP.
function isDesignable(item, body, prop) {
	if(!isDefined(item))
		return false;
	if(!isDefined(body))
		body = "Body1REC";
	if(!isDefined(prop))
		prop = "wheeled01";
	
	var virDroid = makeTemplate(me, "Virtual Droid", body, prop, null, null, item, item);
	return (virDroid != null) ? true : false;
}

//See if power levels are low. This takes account of only the power obtained from the generators.
function checkLowPower(pow) {
	if(!isDefined(pow)) { pow = 25; }
	
	if(playerPower(me) < pow) {
		if(playerAlliance(true).length > 0) {
			sendChatMessage("need Power", ALLIES);
		}
		return true;
	}
	
	return false;
}

//return real power levels.
function getRealPower() {
	return playerPower(me) - queuedPower(me);
}

//Need to search for scavenger player number. Keep undefined if there are no scavengers.
function checkForScavs() {
	for(var x = maxPlayers; x < 11; ++x) {
		if(enumStruct(x).length > 0) {
			scavengerNumber = x;
			break;
		}
	}
}

//Returns all unfinished structures.
function unfinishedStructures() {
	return enumStruct(me).filter(function(struct){ return struct.status != BUILT});
}

//Choose the personality as described in the global subpersonalities.
//When called from chat it will switch to that one directly.
function choosePersonality(chatEvent) {
	var person = "";
	var len = 4;
	
	if(!isDefined(chatEvent)) {
		switch(random(len)) {
			case 0: person = "AC"; break;
			case 1: person = "AR"; break;
			case 2: person = "AB"; break;
			case 3: person = "AM"; break;
			default: person = "AC"; break;
		}
		
		return person;
	}
	else {
		personality = chatEvent;
		initializeResearchLists();
		sendChatMessage("Using personality: " + personality, ALLIES);
	}
}

//Randomly choose the best weapon with current technology.
//Defaults to machine-guns when other choices are unavailable (if allowed). May return undefined.
//Also cyborgs will not return the actual stat list with this function due to how they are built.
function choosePersonalityWeapon(type) {
	var weaps;
	var weaponList = [];
	if(!isDefined(type)) { type = "TANK"; }
	
	if(type === "TANK") {
		switch(random(5)) {
			case 0: weaps = subpersonalities[personality]["primaryWeapon"]; break;
			case 1: if((turnOffMG === false) || (personality === "AM")) { weaps = subpersonalities[personality]["secondaryWeapon"]; } break;
			case 2: weaps = subpersonalities[personality]["artillery"]; break;
			case 3: weaps = subpersonalities[personality]["tertiaryWeapon"]; break;
			case 4: weaps = weaponStats.AS; break;
			default: weaps = subpersonalities[personality]["primaryWeapon"]; break;
		}
		
		if(isDefined(weaps)) {
			for(var i = weaps.weapons.length - 1; i >= 0; --i) {
				weaponList.push(weaps.weapons[i].stat);
			}
		
			//on hard difficulty and above.
			if(componentAvailable("MortarEMP") && componentAvailable("tracked01") && !random(66))
				weaponList = ["MortarEMP"];
			else if(componentAvailable("PlasmaHeavy") && componentAvailable("tracked01") && !random(66))
				weaponList = ["PlasmaHeavy"];
		
			//Try defaulting to machine-guns then.
			if((isDesignable(weaponList, tankBody, tankProp) === false) && (turnOffMG === false)) {
				weaponList = [];
				for(var i = weaponStats.machineguns.weapons.length - 1; i >= 0; --i) {
					weaponList.push(weaponStats.machineguns.weapons[i].stat);
				}
			}
		}
	}
	else if(type === "CYBORG") {
		switch(random(3)) {
			case 0: weaps = subpersonalities[personality]["primaryWeapon"]; break;
			case 1: if((turnOffMG === false) || (personality === "AM")) { weaps = subpersonalities[personality]["secondaryWeapon"]; } break;
			case 2: weaps = subpersonalities[personality]["tertiaryWeapon"]; break;
			default: weaps = subpersonalities[personality]["primaryWeapon"]; break;
		}
	}
	else if(type === "VTOL") {
		weaps = weaponStats.bombs;
		for(var i = weaps.vtols.length - 1; i >= 0; --i) {
			weaponList.push(weaps.vtols[i].stat);
		}
	}
	
	return ((type === "CYBORG") || !isDefined(weaps)) ? weaps : weaponList;
}

function useHover() {
	return (personality === "AR") ? true : false;
}

//Find the derricks of all enemy players, or just a specific one.
function findEnemyDerricks(playerNumber) {
	var derr = [];
	
	if(!isDefined(playerNumber)) {
		var enemy = playerAlliance(false);
		for(var i = 0; i < enemy.length; ++i) {
			derr.concat(enumStruct(enemy[i], structures.derricks));
		}
		
		//Check for scavs
		if(isDefined(scavengerNumber) && !allianceExistsBetween(scavengerNumber, me)) {
			derr.concat(enumStruct(scavengerNumber, structures.derricks));
		}
	}
	else {
		derr = enumStruct(playerNumber, structures.derricks);
	}
	
	return derr;
}

//choose either cyborgs or tanks. prefer cyborgs if any.
function chooseGroup() {
	if(enumGroup(cyborgGroup).length > 3) { return enumGroup(cyborgGroup); }
	else { return enumGroup(attackGroup); }
}

//Determine if something (namely events) should be skipped until enough time has passed. Each event gets its own timer value:
//0 - eventAttacked().
//1 - eventChat().
//2 - eventBeacon().
//3 - eventGroupLoss(). (the addBeacon call).
//ms is a delay value.
//Defaults to checking eventAttacked timer.
function stopExecution(throttleNumber, ms) {
	if(!isDefined(throttleNumber))
		throttleNumber = 0;
	if(!isDefined(ms))
		ms = 1000;
	
	if(gameTime > (throttleTime[throttleNumber] + ms)) {
		throttleTime[throttleNumber] = gameTime + (4 * random(500));
		return false;
	}
	else { return true; }
}

//Tell allies (ideally non-bots) who is attacking Cobra the most.
//When called from chat using "stats" it will also tell you who is the most aggressive towards Cobra.
function getMostHarmfulPlayer(chatEvent) {
	var mostHarmful = grudgeCount;
	mostHarmful = (mostHarmful.sort(sortArrayNumeric)).reverse();
	
	if(isDefined(chatEvent)) {
		sendChatMessage("Most harmful player: " + mostHarmful[0], ALLIES);
	}
	
	return mostHarmful[0];
}

