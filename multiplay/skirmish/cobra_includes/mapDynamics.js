
//Figure out if we are on a hover map. This is determined by checking if a
//ground only propulsion fails to reach a target (checking if it is a vtol only player
//or map spotter pits) and doing similar checks for hover propulsion.
//Furthermore it can discover if it is sharing land with an enemy and disable/enable
//unit production depending on the case until it reaches hover propulsion.
function checkIfSeaMap()
{
	var hoverMap = false;
	seaMapWithLandEnemy = false;

	for (var i = 0; i < maxPlayers; ++i)
	{
		if (!propulsionCanReach("wheeled01", MY_BASE.x, MY_BASE.y, startPositions[i].x, startPositions[i].y))
		{

			//Check if it is a map 'spotter' pit
			//Cyborgs will turn off in divided maps with a physical barrier still
			var temp = 0;
			for (var t = 0; t < maxPlayers; ++t)
			{
				if (!propulsionCanReach("hover01", startPositions[i].x, startPositions[i].y, startPositions[t].x, startPositions[t].y))
				{
					temp = temp + 1;
				}
			}

			if (temp !== maxPlayers - 1)
			{
				hoverMap = true; //And thus forceHover = true
				break;
			}
		}
	}

	//Determine if we are sharing land on a hover map with an enemy that can reach us via non-hover propulsion.
	if (hoverMap === true)
	{
		for (var i = 0; i < maxPlayers; ++i)
		{
			if ((i !== me) && !allianceExistsBetween(i, me) && propulsionCanReach("wheeled01", MY_BASE.x, MY_BASE.y, startPositions[i].x, startPositions[i].y))
			{
				//Check to see if it is a closed player slot
				if (countDroid(DROID_ANY, i) > 0)
				{
					seaMapWithLandEnemy = true;
					break;
				}
			}
			if (seaMapWithLandEnemy === true)
			{
				break;
			}
		}
	}

	return hoverMap;
}

//All derricks and all oil resources to find the map total.
function countAllResources()
{
	function uncached()
	{
		var amount = enumFeature(-1, OIL_RES).length;
		for (var i = 0; i < maxPlayers; ++i)
		{
			amount += enumStruct(i, structures.derricks).length;
		}

		if (isDefined(scavengerPlayer))
		{
			amount += enumStruct(scavengerPlayer, structures.derricks).length;
		}

		return amount;
	}

	return cacheThis(uncached, [], undefined, Infinity);
}

// The amount of oil each player should hold.
function averageOilPerPlayer()
{
	function uncached()
	{
		return Math.floor(countAllResources() / maxPlayers);
	}

	return cacheThis(uncached, [],  undefined, Infinity);
}

//Is the map a low/medium/high power level. Returns a string of LOW/MEDIUM/HIGH.
function mapOilLevel()
{
	function uncached()
	{
		var str;
		var perPlayer = averageOilPerPlayer();
		if (perPlayer <= 10)
		{
			str = "LOW";
		}
		else if ((perPlayer > 10) && (perPlayer < 20))
		{
			str = "MEDIUM";
		}
		else if ((perPlayer >= 20) && (perPlayer < 30))
		{
			str = "HIGH";
		}
		else
		{
			str = "NTW";
		}

		return str;
	}

	return cacheThis(uncached, [], undefined, Infinity);
}

function highOilMap()
{
	function uncached()
	{
		var oil = mapOilLevel();

		if (oil === "HIGH" || oil === "NTW")
		{
			return true;
		}

		return false;
	}

	return cacheThis(uncached, [], undefined, Infinity);
}

//Determine the base area that Cobra claims.
function cobraBaseArea()
{
	function uncached()
	{
		const EXTRA_TILES = 20;
		var firstRun = true;
		var area = {"x1": 0, "y1": 0, "x2": 0, "y2": 0,};
		var baseStructures = structures.factories
			.concat(structures.templateFactories)
			.concat(structures.vtolFactories)
			.concat(structures.labs)
			.concat(structures.gens)
			.concat(structures.hqs)
			.concat(structures.vtolPads)
			.concat(structures.extras);

		for (var i = 0, len = baseStructures.length; i < len; ++i)
		{
			var structureType = baseStructures[i];
			var objects = enumStruct(me, structureType);

			for (var j = 0, len2 = objects.length; j < len2; ++j)
			{
				var structure = objects[j];

				if (firstRun || (structure.x < area.x1))
				{
					area.x1 = structure.x;
				}
				if (firstRun || (structure.x > area.x2))
				{
					area.x2 = structure.x;
				}
				if (firstRun || (structure.y < area.y1))
				{
					area.y1 = structure.y;
				}
				if (firstRun || (structure.y > area.y2))
				{
					area.y2 = structure.y;
				}

				if (firstRun)
				{
					firstRun = false;
				}
			}
		}

		area.x1 = area.x1 - EXTRA_TILES;
		area.y1 = area.y1 - EXTRA_TILES;
		area.x2 = area.x2 + EXTRA_TILES;
		area.y2 = area.y2 + EXTRA_TILES;

		if (area.x1 < 0)
		{
			area.x1 = 0;
		}
		if (area.y1 < 0)
		{
			area.y1 = 0;
		}
		if (area.x2 > mapWidth)
		{
			area.x2 = mapWidth;
		}
		if (area.y2 > mapHeight)
		{
			area.y2 = mapHeight;
		}

		return area;
	}

	return cacheThis(uncached, [], undefined, 20000);
}
