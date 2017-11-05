//Contains functions that are either used everywhere or do not have
//a better file to be placed in yet.

// Random number between 0 and max-1.
function random(max)
{
	return (max <= 0) ? 0 : Math.floor(Math.random() * max);
}

// Returns true if something is defined
function isDefined(data)
{
	return typeof(data) !== "undefined";
}

//Sort an array from smallest to largest in value.
function sortArrayNumeric(a, b)
{
	return a - b;
}

//Sort an array from smallest to largest in terms of droid health.
function sortDroidsByHealth(a, b)
{
	return a.health - b.health;
}

//Used for deciding if a truck will capture oil.
function isUnsafeEnemyObject(obj)
{
	return ((obj.type === DROID)
		|| ((obj.type === STRUCTURE)
		&& (obj.stattype === DEFENSE)
		&& (obj.status === BUILT))
	);
}

//Sort by distance to base and reverse.
function sortAndReverseDistance(arr)
{
	return (arr.sort(distanceToBase)).reverse();
}

//Return the alias of the primary weapon.
function returnPrimaryAlias()
{
	return SUB_PERSONALITIES[personality].primaryWeapon.alias;
}

//Return the alias of the secondary weapon.
function returnSecondaryAlias()
{
	return SUB_PERSONALITIES[personality].secondaryWeapon.alias;
}

//Return the alias of the anti-air weaponry.
function returnAntiAirAlias()
{
	return SUB_PERSONALITIES[personality].antiAir.alias;
}

//Return the alias of the artillery weapon.
function returnArtilleryAlias()
{
	return SUB_PERSONALITIES[personality].artillery.alias;
}

//Dump some text.
function log(message)
{
	dump(gameTime + " : " + message);
}

//Dump information about an object and some text.
function logObj(obj, message)
{
	dump(gameTime + " : [" + obj.name + " id=" + obj.id + "] > " + message);
}

//Distance between an object and the Cobra base.
function distanceToBase(obj1, obj2)
{
	var dist1 = distBetweenTwoPoints(MY_BASE.x, MY_BASE.y, obj1.x, obj1.y);
	var dist2 = distBetweenTwoPoints(MY_BASE.x, MY_BASE.y, obj2.x, obj2.y);
	return dist1 - dist2;
}

function addDroidsToGroup(group, droids)
{
	for (var i = 0, d = droids.length; i < d; ++i)
	{
		groupAdd(group, droids[i]);
	}
}

//Returns closest enemy object.
function rangeStep(player)
{
	function uncached(player)
	{
		if (!isDefined(player))
		{
			player = getMostHarmfulPlayer();
		}

		var targets = [];
		var struc = findNearestEnemyStructure(player);
		var droid = findNearestEnemyDroid(player);

		if (isDefined(struc))
		{
			targets.push(getObject(struc.typeInfo, struc.playerInfo, struc.idInfo));
		}
		if (isDefined(droid))
		{
			targets.push(getObject(droid.typeInfo, droid.playerInfo, droid.idInfo));
		}

		if (isDefined(targets[0]))
		{
			targets = targets.sort(distanceToBase);
			return objectInformation(targets[0]);
		}

		return undefined;
	}

	return cacheThis(uncached, [player]);
}

//passing true finds allies and passing false finds enemies.
function playerAlliance(ally)
{
	if (!isDefined(ally))
	{
		ally = false;
	}

	function uncached(ally)
	{
		var players = [];
		for (var i = 0; i < maxPlayers; ++i)
		{
			if (!ally)
			{
				if (!allianceExistsBetween(i, me) && (i !== me))
				{
					players.push(i);
				}
			}
			else
			{
				if (allianceExistsBetween(i, me) && (i !== me))
				{
					players.push(i);
				}
			}
		}

		return players;
	}

	return cacheThis(uncached, [ally], undefined, 5000);
}

//Change stuff depending on difficulty.
function diffPerks()
{
	switch (difficulty)
	{
		case EASY:
			//This is handled in eventStartLevel().
			break;
		case MEDIUM:
			//Do nothing
			break;
		case INSANE: //Fall through
		case HARD:
			if (!isStructureAvailable("A0PowMod1"))
			{
				completeRequiredResearch("R-Sys-Engineering01");
			}
			makeComponentAvailable("PlasmaHeavy", me);
			makeComponentAvailable("MortarEMP", me);
			break;
	}
}

//See if power levels are low. This takes account of only the power obtained from the generators.
function checkLowPower(pow)
{
	if (!isDefined(pow))
	{
		pow = 25;
	}

	if (playerPower(me) < pow)
	{
		if (playerAlliance(true).length)
		{
			sendChatMessage("need Power", ALLIES);
		}

		return true;
	}

	return false;
}

//return real power levels.
function getRealPower()
{
	const POWER = playerPower(me) - queuedPower(me);
	if (playerAlliance(true).length && (POWER < 50))
	{
		sendChatMessage("need Power", ALLIES);
	}

	return POWER;
}

//Find enemies that are still alive.
function findLivingEnemies()
{
	function uncached()
	{
		var alive = [];
		for (var x = 0; x < maxPlayers; ++x)
		{
	 		if ((x !== me) && !allianceExistsBetween(x, me) && (countDroid(DROID_ANY, x).length || enumStruct(x).length))
			{
				alive.push(x);
			}
			else
			{
				if (allianceExistsBetween(x, me) || (x === me))
				{
					grudgeCount[x] = -2; //Friendly player.
				}
				else
				{
					grudgeCount[x] = -1; //Dead enemy.
				}
			}
	 	}

		return alive;
	}

	return cacheThis(uncached, [], undefined, 10000);
}

//The enemy of which Cobra is focusing on.
function getMostHarmfulPlayer()
{
	function uncached()
	{
		var mostHarmful = 0;
		var enemies = findLivingEnemies();
		if (!enemies.length)
		{
			return 0; //If nothing to attack, then attack player 0 (happens only after winning).
		}

	 	for (var x = 0, c = enemies.length; x < c; ++x)
		{
	 		if((grudgeCount[enemies[x]] >= 0) && (grudgeCount[enemies[x]] > grudgeCount[mostHarmful]))
			{
				mostHarmful = enemies[x];
			}
	 	}

		return mostHarmful;
	}

	return cacheThis(uncached, [], undefined, 12000);
}

//Removes duplicate items from something.
function removeDuplicateItems(temp)
{
	var prims = {"boolean":{}, "number":{}, "string":{}}, objs = [];
	return temp.filter(function(item)
	{
		var type = typeof item;
		if (type in prims)
		{
			return prims[type].hasOwnProperty(item) ? false : (prims[type][item] = true);
		}
		else
		{
			return objs.indexOf(item) >= 0 ? false : objs.push(item);
		}
	});
}

//Set the initial grudge counter to target a random enemy.
function initializeGrudgeCounter()
{
	grudgeCount = [];

	for (var i = 0; i < maxPlayers; ++i)
	{
		grudgeCount.push(0);
	}

	for (var i = 0; i < maxPlayers; ++i)
	{
		if ((!allianceExistsBetween(i, me)) && (i !== me))
		{
			grudgeCount[i] = random(30);
		}
		else
		{
			grudgeCount[i] = -2; //Otherwise bad stuff (attacking itself and allies) happens.
		}
	}
}

//Donate a droid from one of Cobra's groups.
function donateFromGroup(from, group)
{
	if (isDefined(group))
	{
		const MIN_HEALTH = 80;
		var chosenGroup;

		switch (group)
		{
			case "ATTACK": chosenGroup = enumGroup(attackGroup); break;
			case "CYBORG": chosenGroup = enumGroup(attackGroup).filter(function(dr) { return dr.droidType === DROID_CYBORG; }); break;
			case "VTOL": chosenGroup = enumGroup(vtolGroup); break;
			default: chosenGroup = enumGroup(attackGroup); break;
		}

		const DROIDS = chosenGroup.filter(function(dr) { return (dr.health > MIN_HEALTH); });
		const CACHE_DROIDS = droids.length;

		if (CACHE_DROIDS >= MIN_ATTACK_DROIDS)
		{
			var droid = DROIDS[random(CACHE_DROIDS)];
			if (isDefined(droid))
			{
				donateObject(droid, from);
			}
		}
	}
}

//Remove timers. May pass a string or an array of strings.
function removeThisTimer(timer)
{
	if (timer instanceof Array)
	{
		for(var i = 0, l = timer.length; i < l; ++i)
		{
			removeTimer(timer[i]);
		}
	}
	else
	{
		removeTimer(timer);
	}
}

//Stop the non auto-remove timers if Cobra died.
function stopTimersCobra()
{
	if (!(countDroid(DROID_ANY) || countStruct(FACTORY) || countStruct(CYBORG_FACTORY)))
	{
		/*
		var timers = [
			"buildOrderCobra", "repairDroidTacticsCobra", "CobraProduce", "battleTacticsCobra",
			"artilleryTacticsCobra", "stopTimersCobra", "researchCobra", "lookForOil",
		];

		removeThisTimer(timers);
		*/
		donateAllPower();
	}
}

//Give a player all of Cobra's power. one use is if it dies, then it gives
//all of its power to an ally.
function donateAllPower()
{
	const ALLY_PLAYERS = playerAlliance(true);
	const LEN = ALLY_PLAYERS.length;

	if (LEN && playerPower(me) > 0)
	{
		donatePower(playerPower(me), ALLY_PLAYERS[random(LEN)]);
	}
}

//Tell if the personality likes cyborg or tank production.
function droidPreference(swap)
{
	function uncached(swap)
	{
		var preference;
		if (!isDefined(swap))
		{
			swap = false;
		}

		for (var i = 0; i < 2; ++i)
		{
			var fac = SUB_PERSONALITIES[personality].factoryOrder[i];
			if (fac !== VTOL_FACTORY)
			{
				preference = (fac === CYBORG_FACTORY) ? "CYBORG" : "TANK";
				break;
			}
		}

		if (swap === true)
		{
			if (preference === "CYBORG")
			{
				preference = "TANK";
			}
			else
			{
				preference = "CYBORG";
			}
		}

		return preference;
	}

	return cacheThis(uncached, [swap], undefined, Infinity);
}
