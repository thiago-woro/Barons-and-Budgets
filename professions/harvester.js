// Hunter profession behaviors
// This file contains all the logic for hunter NPCs

// State machine for hunter behavior
function updateHarvester(npc) {

  switch (npc.state) {
    case "idle":  //step 1
      npc.setState("searchingBushes");
      break;
      
    case "searchingBushes":  //step 2
      const nearestBerryBush = findNearestBushes(npc);
      if (nearestBerryBush) {
        npc.currentPath = findPathTo(npc, nearestBerryBush);
        console.log(`${npc.name} found bushes at ${nearestBerryBush.gridX}, ${nearestBerryBush.gridY}`);
        if (npc.currentPath) {
        npc.pathIndex = 0;
        npc.stateData.targetBushes = nearestBerryBush;
        npc.setState("harvestingBerries");
      } else {
        npc.setState("idle");
      }
      }
      break;

    case "harvestingBerries":  //step 3
        if (npc.pathIndex < npc.currentPath.length) {
          const nextCell = npc.currentPath[npc.pathIndex];
          npc.x = nextCell.x * cellSize;
          npc.y = nextCell.y * cellSize;
          npc.pathIndex++;
        }
      break;

    case "restingAtHome":
      if (npc.waitTime > 0) {
        npc.waitTime--;
        npc.animationState = "sleeping";
      } else {
        npc.animationState = "normal";
        npc.setState("searchingBushes");
      }
      break;
  }
}

// Helper function to find nearest bush
function findNearestBushes(npc) {
    if (gBushesPositions.length === 0) {
        console.log(`No bushes found for ${npc.name} ${npc.profession}`);
        npc.profession = "farmer";
        npc.setState("idle");
        npc.generateProfession(npc.race);
        return null;
    }

    let nearestBerryBush = null;
    let shortestDistance = Infinity;

    // will search for bushes in this array gBushesPositions = [];       //🌳
    for (let i = 0; i < gBushesPositions.length; i++) {
        const bush = gBushesPositions[i];
        const distance = Math.abs(npc.gridX - bush.gridX) + Math.abs(npc.gridY - bush.gridY);
        if (distance < shortestDistance) {
            shortestDistance = distance;
            nearestBerryBush = bush;
        }
    }

    return nearestBerryBush;
}
