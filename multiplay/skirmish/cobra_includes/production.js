
//Randomly choose the best weapon with current technology.
//Defaults to machine-guns when other choices are unavailable (if allowed). May return undefined.
//Also cyborgs will not return the actual stat list with this function due to how they are built.
function choosePersonalityWeapon(type) {
	var weaps;
	var weaponList = [];
	if(!isDefined(type)) { type = "TANK"; }

	if(type === "TANK") {
		switch(random(6)) {
			case 0: weaps = subpersonalities[personality]["primaryWeapon"]; break;
			case 1: if(!turnOffMG || (personality === "AM")) { weaps = weaponStats.machineguns; } break;
			case 2: weaps = subpersonalities[personality]["artillery"]; break;
			case 3: weaps = weaponStats.lasers; break;
			case 4: weaps = subpersonalities[personality]["secondaryWeapon"]; break;
			case 5: weaps = weaponStats.AS; break;
			default: weaps = subpersonalities[personality]["primaryWeapon"]; break;
		}

		if(isDefined(weaps)) {
			for(var i = weaps.weapons.length - 1; i >= 0; --i) {
				weaponList.push(weaps.weapons[i].stat);
			}

			/*
			if((enumGroup(attackGroup).length > 30) && (enumGroup(commanderGroup).length < 2)
				&& countStruct("A0ComDroidControl") && componentAvailable("CommandTurret1")) {
					weaponList = ["CommandTurret1"];
			}
			*/

			//on hard difficulty and above.
			if(componentAvailable("MortarEMP") && componentAvailable("tracked01") && !random(66))
				weaponList = ["MortarEMP"];
			else if(componentAvailable("PlasmaHeavy") && componentAvailable("tracked01") && !random(66))
				weaponList = ["PlasmaHeavy"];

			//Try defaulting to machine-guns then.
			if(!isDesignable(weaponList, tankBody, tankProp) && !turnOffMG) {
				weaponList = [];
				for(var i = weaponStats.machineguns.weapons.length - 1; i >= 0; --i) {
					weaponList.push(weaponStats.machineguns.weapons[i].stat);
				}
			}
		}
	}
	else if(type === "CYBORG") {
		switch(random(4)) {
			case 0: weaps = subpersonalities[personality]["primaryWeapon"]; break;
			case 1: weaps = weaponStats.flamers; break;
			case 2: weaps = weaponStats.lasers; break;
			case 3: weaps = subpersonalities[personality]["secondaryWeapon"]; break;
			default: weaps = subpersonalities[personality]["primaryWeapon"]; break;
		}
	}
	else if(type === "VTOL") {
		switch(random(3)) {
			case 0: if(personality !== "AM") { weaps = subpersonalities[personality]["primaryWeapon"]; } break;
			case 1: weaps = weaponStats.lasers; break;
			case 2: weaps = subpersonalities[personality]["secondaryWeapon"]; break;
			default: weaps = weaponStats.lasers; break;
		}

		if(!isDefined(weaps) || (weaps.vtols.length - 1 <= 0))
			weaps = weaponStats.lasers;

		for(var i = weaps.vtols.length - 1; i >= 0; --i) {
			weaponList.push(weaps.vtols[i].stat);
		}
	}

	return ((type === "CYBORG") || !isDefined(weaps)) ? weaps : weaponList;
}

//What conditions will allow hover use. Flamers always use hover, rockets/missile
//Have a 20% chance of using hover. Also there is a 15% chance regardless of weapon.
//Expects an array of weapons.
function useHover(weap) {
	if(!isDefined(weap)) {
		return false;
	}

	var useHover = false;
	for(var i = 0; i < weap.length; ++i) {
		if((weap[i] === "Flame1Mk1") || (weap[i] === "Flame2") || (weap[i] === "PlasmiteFlamer")) {
			useHover = true;
			break;
		}

		if((weap[i] === "Rocket-LtA-T") || (weap[i] === "Rocket-HvyA-T") || (weap[i] === "Missile-A-T")) {
			useHover = (random(100) <= 20) ? true : false;
			break;
		}
	}

	return ((useHover === true) || (forceHover === true) || (random(100) <= 15));
}

//Create a ground attacker tank with a heavy body when possible.
//Personality AR uses hover when posssible. All personalities may use special weapons on Hard/Insane.
//Also when Cobra has Dragon body, the EMP Cannon may be selected as the second weapon if it is researched.
function buildAttacker(struct) {
	if(!isDefined(forceHover) || !isDefined(seaMapWithLandEnemy) || !isDefined(turnOffMG))
		return false;
	if(forceHover && !seaMapWithLandEnemy && !componentAvailable("hover01"))
		return false;

	var weap = choosePersonalityWeapon("TANK");
	if(!isDefined(weap)) { return false; }

	if(useHover(weap) && componentAvailable("hover01")) {
		if(!random(3) && componentAvailable("Body14SUP") && componentAvailable("EMP-Cannon")) {
			if(weap !== "MortarEMP") {
				if(buildDroid(struct, "Hover EMP Droid", tankBody, "hover01", "", "", weap, "EMP-Cannon")) {
					return true;
				}
			}
		}
		else if(buildDroid(struct, "Hover Droid", tankBody, "hover01", "", "", weap, weap)) {
			return true;
		}
	}
	else {
		if(!random(3) && componentAvailable("Body14SUP") && componentAvailable("EMP-Cannon")) {
			if((weap !== "MortarEMP")) {
				if(buildDroid(struct, "EMP Droid", tankBody, tankProp, "", "", weap, "EMP-Cannon")) {
					return true;
				}
			}
		}
		else if (buildDroid(struct, "Droid", tankBody, tankProp, "", "", weap, weap)) {
			return true;
		}
	}

	return false;
}

//Create trucks or sensors with a light body. Default to a sensor.
function buildSys(struct, weap) {
	if(!isDefined(weap)) { weap = ["Sensor-WideSpec", "SensorTurret1Mk1"]; }
	if (buildDroid(struct, "System unit", sysBody, sysProp, "", "", weap)) { return true; }
	return false;
}

//Create a cyborg with available research.
function buildCyborg(fac) {
	var weap;
	var body;
	var prop;
	var weapon = choosePersonalityWeapon("CYBORG");

	if(!isDefined(weapon)) { return false; }

	for(var x = weapon.templates.length - 1; x >= 0; --x) {
		body = weapon.templates[x].body;
		prop = weapon.templates[x].prop;
		weap = weapon.templates[x].weapons[0];
		if(buildDroid(fac, "Cyborg", body, prop, "", "", weap, weap)) {
			return true;
		}
	}

	return false;
}

//Create a vtol fighter with a medium body.
function buildVTOL(struct) {
	var weap = choosePersonalityWeapon("VTOL");
	if (buildDroid(struct, "VTOL unit", vtolBody, "V-Tol", "", "", weap, weap)) { return true; }

	return false;
}


//Produce a unit when factories allow it.
function produce() {
	if(!researchComplete)
		eventResearched(); //check for idle research centers. TODO: Find a better place for this.

	//Try not to produce more units.
	if((getRealPower() < -400) || ((enumDroid(me).length - 1) === 150)) { return false; }

	var fac = enumStruct(me, structures.factories);
	var cybFac = enumStruct(me, structures.templateFactories);
	var vtolFac = enumStruct(me, structures.vtolFactories);

	//Look what is being queued and consider unit production later.
	var trucks = 0;
	var sens = 0;
	for(var i = 0; i < fac.length; ++i) {
		var virDroid = getDroidProduction(fac[i]);
		if(virDroid != null) {
			if(virDroid.droidType === DROID_CONSTRUCT)
				trucks += 1;
			if(virDroid.droidType === DROID_SENSOR)
				sens += 1;
		}
	}

	for(var x = 0; x < fac.length; ++x) {
		if(isDefined(fac[x]) && structureIdle(fac[x])) {
			if (((countDroid(DROID_CONSTRUCT, me) + trucks) < 4)) {
				if(playerAlliance(true).length && (countDroid(DROID_CONSTRUCT, me) < 2) && (gameTime > 10000)) {
					sendChatMessage("need truck", ALLIES);
				}
				buildSys(fac[x], "Spade1Mk1");
			}
			else if((enumGroup(attackGroup).length > 10) && ((enumGroup(sensorGroup).length + sens) < 2)) {
				buildSys(fac[x]);
			}
			else {
				//Do not produce weak body units if we can give this factory a module.
				if(fac[x].modules < 2 && componentAvailable("Body11ABT"))
					continue;
				buildAttacker(fac[x]);
			}
		}
	}

	if(isDefined(turnOffCyborgs) && !turnOffCyborgs) {
		for(var x = 0; x < cybFac.length; ++x) {
			if(isDefined(cybFac[x]) && structureIdle(cybFac[x])) {
				buildCyborg(cybFac[x]);
			}
		}
	}

	for(var x = 0; x < vtolFac.length; ++x) {
		if(isDefined(vtolFac[x]) && structureIdle(vtolFac[x])) {
			buildVTOL(vtolFac[x]);
		}
	}
}
