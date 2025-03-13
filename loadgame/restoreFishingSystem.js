/**
 * Restores fishing system data after loading from saved game
 * This function handles the reconstruction of fishing boats, fishing spots, and harbor data
 * 
 * @param {Object} fishingData - Object containing fishing system data from saved game
 * @param {Array} npcs - Array of NPC objects with proper prototypes (for owner references)
 * @param {Array} buildings - Array of building objects with proper prototypes (for harbor references)
 * @returns {Object} - Object containing restored fishing system data
 */
function restoreFishingSystem(fishingData, npcs, buildings) {
  if (!fishingData) {
    console.warn("No fishing system data to restore");
    return {
      fishingBoats: [],
      fishingSpotsByHarbor: new Map(),
      harborToFishingSpotPaths: new Map(),
      harborWaterPortCell: new Map(),
      harborsByRace: {
        "Elf": null,
        "Kurohi": null,
        "Purries": null
      }
    };
  }

  console.log("Restoring fishing system data...");
  
  // Create lookup maps for faster reference
  const npcMap = new Map();
  if (npcs && Array.isArray(npcs)) {
    npcs.forEach(npc => {
      npcMap.set(npc.myNumber, npc);
    });
  }
  
  const buildingMap = new Map();
  if (buildings && Array.isArray(buildings)) {
    buildings.forEach(building => {
      if (building.id) {
        buildingMap.set(building.id, building);
      }
    });
  }
  
  // Restore harborsByRace
  const harborsByRace = {
    "Elf": null,
    "Kurohi": null,
    "Purries": null
  };
  
  if (fishingData.harborsByRace) {
    Object.keys(fishingData.harborsByRace).forEach(race => {
      const harborId = fishingData.harborsByRace[race];
      if (harborId) {
        const harbor = buildings.find(b => b.id === harborId);
        if (harbor) {
          harborsByRace[race] = harbor;
        }
      }
    });
  }
  
  // Restore harborWaterPortCell
  const harborWaterPortCell = new Map();
  if (fishingData.harborWaterPortCell && Array.isArray(fishingData.harborWaterPortCell)) {
    fishingData.harborWaterPortCell.forEach(([harborId, portCell]) => {
      harborWaterPortCell.set(harborId, portCell);
    });
  }
  
  // Restore fishingSpotsByHarbor
  const fishingSpotsByHarbor = new Map();
  if (fishingData.fishingSpotsByHarbor && Array.isArray(fishingData.fishingSpotsByHarbor)) {
    fishingData.fishingSpotsByHarbor.forEach(([harborId, spots]) => {
      fishingSpotsByHarbor.set(harborId, spots);
    });
  }
  
  // Restore harborToFishingSpotPaths
  const harborToFishingSpotPaths = new Map();
  if (fishingData.harborToFishingSpotPaths && Array.isArray(fishingData.harborToFishingSpotPaths)) {
    fishingData.harborToFishingSpotPaths.forEach(([pathKey, path]) => {
      harborToFishingSpotPaths.set(pathKey, path);
    });
  }
  
  // Restore fishing boats
  let fishingBoats = [];
  if (fishingData.fishingBoats && Array.isArray(fishingData.fishingBoats)) {
    fishingBoats = fishingData.fishingBoats.map(boatData => {
      // Find the harbor and owner
      const harbor = buildingMap.get(boatData.harborId) || 
                     buildings.find(b => b.id === boatData.harborId);
      const owner = npcMap.get(boatData.ownerId) || 
                    npcs.find(n => n.myNumber === boatData.ownerId);
      
      if (!harbor || !owner) {
        console.warn(`Could not find harbor (${boatData.harborId}) or owner (${boatData.ownerId}) for boat:`, boatData);
        return null;
      }
      
      // Create a new boat with the FishingBoat prototype
      try {
        const boat = new FishingBoat(harbor, owner);
        
        // Copy all properties from saved boat to the new instance
        Object.assign(boat, boatData);
        
        // Ensure references are properly set
        boat.harbor = harbor;
        boat.owner = owner;
        
        // Reset path index if needed
        if (boat.path && boat.pathIndex >= boat.path.length) {
          boat.pathIndex = 0;
        }
        
        return boat;
      } catch (error) {
        console.warn(`Error creating fishing boat: ${error.message}`);
        return null;
      }
    }).filter(boat => boat !== null);
  }
  
  console.log(`Restored ${fishingBoats.length} fishing boats`);
  console.log(`Restored ${fishingSpotsByHarbor.size} harbor fishing spots`);
  console.log(`Restored ${harborToFishingSpotPaths.size} fishing paths`);
  
  return {
    fishingBoats,
    fishingSpotsByHarbor,
    harborToFishingSpotPaths,
    harborWaterPortCell,
    harborsByRace
  };
}

/**
 * Prepares fishing system data for saving
 * This function handles the conversion of fishing system data to a serializable format
 * 
 * @returns {Object} - Object containing serializable fishing system data
 */
function prepareFishingSystemForSave() {
  // Check if fishing system variables exist
  if (typeof fishingBoats === 'undefined' || 
      typeof fishingSpotsByHarbor === 'undefined' || 
      typeof harborToFishingSpotPaths === 'undefined' ||
      typeof harborWaterPortCell === 'undefined' ||
      typeof harborsByRace === 'undefined') {
    console.warn("Fishing system variables not found, cannot prepare for save");
    return null;
  }
  
  // Prepare harborsByRace (convert harbor objects to IDs)
  const serializedHarborsByRace = {};
  Object.keys(harborsByRace).forEach(race => {
    const harbor = harborsByRace[race];
    serializedHarborsByRace[race] = harbor ? harbor.id : null;
  });
  
  // Prepare fishing boats (handle circular references)
  const serializedFishingBoats = fishingBoats.map(boat => {
    const boatCopy = { ...boat };
    
    // Replace harbor reference with ID
    if (boatCopy.harbor && typeof boatCopy.harbor === 'object') {
      boatCopy.harborId = boatCopy.harbor.id;
      delete boatCopy.harbor;
    }
    
    // Replace owner reference with ID
    if (boatCopy.owner && typeof boatCopy.owner === 'object') {
      boatCopy.ownerId = boatCopy.owner.myNumber;
      delete boatCopy.owner;
    }
    
    return boatCopy;
  });
  
  return {
    fishingBoats: serializedFishingBoats,
    fishingSpotsByHarbor: Array.from(fishingSpotsByHarbor.entries()),
    harborToFishingSpotPaths: Array.from(harborToFishingSpotPaths.entries()),
    harborWaterPortCell: Array.from(harborWaterPortCell.entries()),
    harborsByRace: serializedHarborsByRace
  };
}

/**
 * Updates the saveGame function to include fishing system data in the saved game state
 * This function should be called once to patch the saveGame function
 */
function patchSaveGameForFishingSystem() {
  if (typeof saveGame !== 'function') {
    console.warn("saveGame function not found, cannot patch for fishing system saving");
    return;
  }
  
  // Store the original saveGame function
  const originalSaveGame = saveGame;
  
  // Replace with our patched version
  saveGame = function() {
    // Call the original function to get the game state
    const result = originalSaveGame.apply(this, arguments);
    
    // Add fishing system data to the game state
    try {
      const savedGameStateString = localStorage.getItem("savedGameState");
      if (savedGameStateString) {
        const gameState = JSON.parse(savedGameStateString);
        
        // Prepare fishing system data
        const fishingSystemData = prepareFishingSystemForSave();
        
        // Add fishing system data to game state
        if (fishingSystemData) {
          gameState.fishingSystem = fishingSystemData;
          localStorage.setItem("savedGameState", JSON.stringify(gameState));
          console.log("Added fishing system data to saved game state");
        }
      }
    } catch (error) {
      console.warn("Failed to add fishing system data to saved game:", error);
    }
    
    return result;
  };
  
  console.log("Patched saveGame function to include fishing system data");
}

/**
 * Updates the loadGame function to restore fishing system data from the saved game state
 * This function should be called once to patch the loadGame function
 */
function patchLoadGameForFishingSystem() {
  if (typeof loadGame !== 'function') {
    console.warn("loadGame function not found, cannot patch for fishing system loading");
    return;
  }
  
  // Store the original loadGame function
  const originalLoadGame = loadGame;
  
  // Replace with our patched version
  loadGame = function() {
    // Call the original function
    const result = originalLoadGame.apply(this, arguments);
    
    // After loading, check if fishing system data needs to be restored
    try {
      const savedGameStateString = localStorage.getItem("savedGameState");
      if (savedGameStateString) {
        const savedGameState = JSON.parse(savedGameStateString);
        
        // If fishing system data exists in the saved state, restore it
        if (savedGameState.fishingSystem) {
          const restoredData = restoreFishingSystem(
            savedGameState.fishingSystem, 
            npcs, 
            buildings
          );
          
          // Update global variables with restored data
          fishingBoats = restoredData.fishingBoats;
          fishingSpotsByHarbor = restoredData.fishingSpotsByHarbor;
          harborToFishingSpotPaths = restoredData.harborToFishingSpotPaths;
          harborWaterPortCell = restoredData.harborWaterPortCell;
          harborsByRace = restoredData.harborsByRace;
          
          console.log("Restored fishing system data from saved game");
        }
      }
    } catch (error) {
      console.warn("Failed to restore fishing system data from saved game:", error);
    }
    
    return result;
  };
  
  console.log("Patched loadGame function to restore fishing system data");
}

// Make the functions available globally
if (typeof window !== 'undefined') {
  window.restoreFishingSystem = restoreFishingSystem;
  window.prepareFishingSystemForSave = prepareFishingSystemForSave;
  window.patchSaveGameForFishingSystem = patchSaveGameForFishingSystem;
  window.patchLoadGameForFishingSystem = patchLoadGameForFishingSystem;
} 