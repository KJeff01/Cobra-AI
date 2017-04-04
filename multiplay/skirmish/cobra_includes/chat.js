
//A way to control chat messages sent to Cobra AI.
function sendChatMessage(msg, receiver) {
	if(!isDefined(msg)) { return; }
	if(!isDefined(receiver)) { receiver = ALLIES; }

	if(lastMsg != msg) {
		lastMsg = msg;
		chat(receiver, msg);
	}
}

function eventChat(from, to, message) {
	if(to != me) { return; }

	if((message === "AC") || (message === "AR") || (message === "AB") || (message === "AM")) {
		if(allianceExistsBetween(from, to) && (personality !== message)) {
			choosePersonality(message);
		}
	}
	else if((message === "no cyborg") && allianceExistsBetween(from, to)) {
		turnOffCyborgs = true;
	}
	else if((message === "no mg") && allianceExistsBetween(from, to)) {
		turnOffMG = true;
	}
	else if((message === "stats") && allianceExistsBetween(from, to)) {
		getMostHarmfulPlayer("chatEvent");
	}
	else if((message === "FFA") && allianceExistsBetween(from, to)) {
		freeForAll();
	}


	if(to == from) { return; }


	if((message === "need truck") && allianceExistsBetween(from, to)) {
		var droids = enumDroid(me, DROID_CONSTRUCT);
		if(droids.length <= 3) { return; }

		donateObject(droids[random(droids.length)], from);
	}
	else if((message === "need power") && allianceExistsBetween(from, to)) {
		if(playerPower(me) - queuedPower(me) > 0) { donatePower(playerPower(me) / 2, from); }
	}
	else if((message === "need tank") && allianceExistsBetween(from, to)) {
		var droids = enumDroid(me, DROID_WEAPON);
		if(droids.length < 6) { return; }

		donateObject(droids[random(droids.length)], from);
	}
	else if((message === "need cyborg") && allianceExistsBetween(from, to)) {
		var droids = enumDroid(me, DROID_CYBORG);
		if(droids.length < 6) { return; }

		donateObject(droids[random(droids.length)], from);
	}
	else if((message === "need vtol") && allianceExistsBetween(from, to)) {
		var droids = enumDroid(me).filter(function(obj){ return isVTOL(obj); });
		if(droids.length < 6) { return; }

		donateObject(droids[random(droids.length)], from);
	}
	else if(((message === "help me!") || (message == "help me!!")) && allianceExistsBetween(from, to)) {
		var hq = enumStruct(from, structures.hqs);
		if(hq.length === 1) {
			sendChatMessage("Sending units to your command center!", from);
			eventBeacon(hq.x, hq.y, from, me, "");
		}
		else {
			sendChatMessage("Sorry, no can do.", from);
		}
	}

	var tmp = message.slice(0, -1);
	if(tmp === "attack") {
		var num = message.slice(-1);
		if(!allianceExistsBetween(num, me) && (num != me)) {
			attackStuff(num);
		}
	}
	else if(tmp === "oil") {
		var num = message.slice(-1);
		if(!allianceExistsBetween(num, me) && (num != me)) {
			chatAttackOil(num);
		}
	}

}
