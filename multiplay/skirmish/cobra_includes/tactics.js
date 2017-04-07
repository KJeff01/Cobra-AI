
//Droids that are attacking should not be pulled away until
//they destroy whatever thay are attacking or need repair.
function droidReady(droid) {
	return (!repairDroid(droid, false) && (droid.order != DORDER_ATTACK));
}

//Find the derricks of all enemy players, or just a specific one.
function findEnemyDerricks(playerNumber) {
	var derr = [];

	if(!isDefined(playerNumber)) {
		var enemy = playerAlliance(false);
		for(var i = 0; i < enemy.length; ++i) {
			derr = appendListElements(derr, enumStruct(enemy[i], structures.derricks));
		}

		//Check for scavs
		if(isDefined(scavengerNumber) && !allianceExistsBetween(scavengerNumber, me)) {
			derr = appendListElements(derr, enumStruct(scavengerNumber, structures.derricks));
		}
	}
	else {
		derr = enumStruct(playerNumber, structures.derricks);
	}

	return derr;
}

//See who has been attacking Cobra the most and attack them.
function checkMood() {
	var mostHarmful = getMostHarmfulPlayer();

	if(grudgeCount[mostHarmful] >= 325) {
		attackStuff(mostHarmful);
		grudgeCount[mostHarmful] = 10;
	}
	else if((grudgeCount[mostHarmful] > 10) && (grudgeCount[mostHarmful] < 325)) {
		var derr = enumStruct(mostHarmful, structures.derricks);
		var struc = enumStruct(mostHarmful);

		var cyb = enumGroup(cyborgGroup);
		var target;
		if(derr.length > 0) {
			derr.sort(distanceToBase);
			target = derr[0];
		}
		else {
			if(struc.length > 0) {
				struc.sort(distanceToBase);
				target = struc[0];
			}
			else {
				grudgeCount[mostHarmful] = 0;
				return; //They not too much of a problem now.
			}
		}

		if(enumGroup(cyborgGroup).length > 7) {
			for (var i = 0; i < cyb.length; i++) {
				if(isDefined(cyb[i]) && droidReady(cyb[i])) {
					if(isDefined(target) && droidCanReach(cyb[i], target.x, target.y))
						orderDroidLoc(cyb[i], DORDER_SCOUT, target.x, target.y);
				}
			}
		}

		var vtols = enumGroup(vtolGroup);
		var vtTarget;
		if(vtols.length > 0)
			vtTarget = rangeStep(vtols[0], false);

		for (var i = 0; i < vtols.length; ++i) {
			if(isDefined(vtols[i]) && vtolReady(vtols[i]) && isDefined(vtTarget[0])) {
				orderDroidLoc(vtols[i], DORDER_SCOUT, vtTarget[0].x, vtTarget[0].y);
			}
		}

		grudgeCount[mostHarmful] = Math.floor(grudgeCount[mostHarmful] / 2);
	}
}

//Tell a droid to find the nearest enemy structure.
function findNearestEnemySturcture(droid, enemy) {
	var s = enumStruct(enemy).filter(function(obj) { return obj.stattype !== WALL });
	if(s.length === 0)
		s = enumStruct(enemy);

	if(s.length > 0) {
		s.sort(distanceToBase);
		if(!repairDroid(droid) && isDefined(s[0]) && droidCanReach(droid, s[0].x, s[0].y))
			orderDroidObj(droid, DORDER_ATTACK, s[0]);
	}
}

//attacker is a player number. Attack a specific player.
function attackStuff(attacker) {
	var tanks = enumGroup(attackGroup);
	var cyborgs = enumGroup(cyborgGroup);
	var vtols = enumGroup(vtolGroup);
	var enemy = playerAlliance(false);
	var str = lastMsg.slice(0, -1);
	var selectedEnemy = enemy[random(enemy.length)];

	if(isDefined(attacker) && !allianceExistsBetween(attacker, me) && (attacker !== me)) {
		selectedEnemy = attacker;
		if(!isDefined(scavengerNumber) || (isDefined(scavengerNumber) && (attacker.player !== scavengerNumber)))
			grudgeCount[attacker] = 100;
	}

	var derr = enumStruct(selectedEnemy, structures.derricks);
	var fac = enumStruct(selectedEnemy, structures.factories);
	var templatesFacs = enumStruct(selectedEnemy, structures.templateFactories);
	for(var c = 0; c < templatesFacs.length; ++c)
		fac.push(templatesFacs[c]);

	var target = derr[random(derr.length)];
	var targetFac = fac[random(fac.length)];

	if((str != "attack") && (str != "oil")) {
		if((countStruct(structures.derricks) > 7) && (enumDroid(me) > 20)) {
			sendChatMessage("attack" + selectedEnemy, ALLIES);
		}
		else  {
			sendChatMessage("oil" + selectedEnemy, ALLIES);
			chatAttackOil(selectedEnemy);
			return; //Otherwise it will look like Cobra can not decide what to attack.
		}
	}

	if(tanks.length > 7) {
		for (var j = 0; j < tanks.length; j++) {
			if(isDefined(tanks[j]) && droidReady(tanks[j])) {
				if(isDefined(targetFac) && droidCanReach(tanks[j], targetFac.x, targetFac.y))
					orderDroidObj(tanks[j], DORDER_ATTACK, targetFac, targetFac);
				else {
					findNearestEnemySturcture(tanks[j], selectedEnemy);
				}
			}
		}
	}

	if(isDefined(turnOffCyborgs) && (turnOffCyborgs === false) && (cyborgs.length > 7)) {
		for (var j = 0; j < cyborgs.length; j++) {
			if(isDefined(cyborgs[j]) && droidReady(cyborgs[j])) {
				if(isDefined(target) && droidCanReach(cyborgs[j], target.x, target.y))
					orderDroidObj(cyborgs[j], DORDER_ATTACK, target, target);
				else {
					findNearestEnemySturcture(cyborgs[j], selectedEnemy);
				}
			}
		}
	}
	if(vtols.length > 4) {
		for (var j = 0; j < vtols.length; j++) {
			if (isDefined(vtols[j]) && vtolReady(vtols[j])) {
				findNearestEnemySturcture(vtols[j], selectedEnemy);
			}
		}
	}
}


//Repair a droid with the option of forcing it to.
function repairDroid(droid, force) {
	if(!isDefined(force))
		force = false;

	var percent = 40;

	if((droid.order === DORDER_RTR) && ((droid.health < 100) || force))
		return true;

	var repairs = countStruct(structures.extras[0]);
	if((repairs > 0) && (force || (droid.health <= percent))) {
		orderDroid(droid, DORDER_RTR);
		return true;
	}

	return false;
}

//Check all units for repair needs.
function repairAll() {
	var droids = enumDroid(me).filter(function(dr) {return !isVTOL(dr)});

	for(var x = 0; x < droids.length; ++x) {
		if(droids[x].health < (52 + Math.floor(droids[x].experience / 28)))
			repairDroid(droids[x], true);
	}
}

//Sensors know all your secrets. They will observe what is close to them.
function spyRoutine() {
	var sensors = enumGroup(sensorGroup);
	if(!sensors.length) { return false; }
	sensors = sortAndReverseDistance(sensors);
	var sensor = sensors[0];

	if(!isDefined(sensor)) { return; }

	//Observe closest enemy object with a hover unit
	var object = rangeStep(sensor, false);
	if(isDefined(object)) {
		var tanks = enumGroup(attackGroup).filter(function(obj) { return obj.propulsion === "hover01" });
		if(tanks.length === 0) { tanks = enumGroup(attackGroup); }
		tanks.filter(function(dr) { return dr.hasIndirect || dr.isCB });
		if(tanks.length === 0) { return false; }

		tanks = sortAndReverseDistance(tanks);

		if(isDefined(tanks[0]) && droidReady(tanks[0])) {
			orderDroidObj(sensor, DORDER_OBSERVE, object);
			//grudgeCount[object.player] += 2;
			var xPos = (sensor.x + object.x) / 2;
			var yPos = (sensor.y + object.y) / 2;
			if(droidCanReach(tanks[0], xPos, yPos))
				orderDroidLoc(tanks[0], DORDER_SCOUT, xPos, yPos);
		}
	}
}

//Attack enemy oil when tank group is large enough.
//Prefer cyborgs over tanks.
function attackEnemyOil() {
	var who = chooseGroup();
	var tmp = 0;
	if(who.length < 5) { return false; }

	var derr = findEnemyDerricks();
	if(!derr.length) { return false; }
	derr.sort(distanceToBase);

	for(var i = 0; i < who.length; ++i) {
		if(isDefined(who[i]) && droidReady(who[i])) {
			if(isDefined(derr[tmp]) && droidCanReach(who[i], derr[tmp].x, derr[tmp].y)) {
				orderDroidObj(who[i], DORDER_ATTACK, derr[tmp]);
				if(!((i + 1) % Math.floor(who.length / 3)))
					tmp += 1;
			}
		}
	}
}

//Recycle units when certain conditions are met.
function recycleObsoleteDroids() {
	var tanks = enumGroup(attackGroup);
	//var vtols = enumGroup(vtolGroup);
	var systems = enumGroup(sensorGroup).concat(enumDroid(me, DROID_CONSTRUCT));
	var temp = false;

	if(countStruct(structures.factories) > 1) {
		for(var i = 0; i < systems.length; ++i) {
			if((unfinishedStructures().length === 0) && (systems[i].propulsion !== "hover01") && componentAvailable("hover01")) {
				temp = true;
				orderDroid(systems[i], DORDER_RECYCLE);
			}
		}

		if(forceHover === true) {
			for(var i = 0; i < tanks.length; ++i) {
				if((tanks[i].propulsion != "hover01") && componentAvailable("hover01"))
					orderDroid(tanks[i], DORDER_RECYCLE);
			}
		}
		/*
		for(var i = 0; i < tanks.length; ++i) {
			orderDroid(tanks[i], DORDER_RECYCLE);
		}

		for(var i = 0; i < vtols.length; ++i) {
			orderDroid(vtols[i], DORDER_RECYCLE);
		}
		*/
	}
	return temp;
}

//Attack oil specifically if a player requests it.
function chatAttackOil(playerNumber) {
	var derr = findEnemyDerricks(playerNumber);
	var who = chooseGroup();
	var tmp = 0;

	if(!derr.length || (who.length < 4)) { return false; }
	derr.sort(distanceToBase);

	for(var i = 0; i < who.length; ++i) {
		if(isDefined(who[i]) && droidReady(who[i])) {
			if(isDefined(derr[tmp])) {
				orderDroidObj(who[i], DORDER_ATTACK, derr[tmp]);
				if(!((i + 1) % Math.floor(who.length / 3)))
					tmp += 1;
			}
		}
	}
}

//Commanders target whatever is nearby.
/*
function commandTactics() {
	var coms = enumGroup(commanderGroup);

	for(var i = 0; i < coms.length; ++i) {
		if(isDefined(coms[i]) && droidReady(coms[i])) {
			var target = rangeStep(coms[i], false);
			if(isDefined(target)) {
				orderDroidObj(coms[i], DORDER_ATTACK, target);
			}
		}
	}
}
*/
