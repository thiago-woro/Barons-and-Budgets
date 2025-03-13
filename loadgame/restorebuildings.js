/**
 * Restores building objects with proper prototypes after loading from saved game
 * This function handles the reconstruction of buildings with their correct class prototypes
 * 
 * @param {Array} buildingDataArray - Array of raw building data from saved game
 * @param {Array} npcs - Array of NPC objects with proper prototypes (for owner references)
 * @returns {Array} - Array of building objects with proper prototypes
 */
function restoreBuildings(buildingDataArray, npcs) {
  if (!buildingDataArray || !Array.isArray(buildingDataArray) || buildingDataArray.length === 0) {
    console.warn("No buildings to restore");
    return [];
  }

  console.log(`Restoring ${buildingDataArray.length} buildings...`);
  
  // Create a lookup map for faster NPC finding by myNumber
  const npcMap = new Map();
  if (npcs && Array.isArray(npcs)) {
    npcs.forEach(npc => {
      npcMap.set(npc.myNumber, npc);
    });
  }
  
  // Process each building to restore its prototype
  const restoredBuildings = buildingDataArray.map(buildingData => {
    // Skip if building data is invalid
    if (!buildingData || typeof buildingData !== 'object') {
      console.warn("Invalid building data:", buildingData);
      return null;
    }
    
    // Find the owner NPC if ownerId is provided
    let owner = null;
    if (buildingData.ownerId && npcMap.size > 0) {
      owner = npcMap.get(buildingData.ownerId);
      if (!owner) {
        console.warn(`Owner NPC with ID ${buildingData.ownerId} not found for building:`, buildingData);
      }
    }
    
    // Convert string coordinates to numbers if needed
    const x = typeof buildingData.x === 'string' ? parseInt(buildingData.x, 10) : buildingData.x;
    const y = typeof buildingData.y === 'string' ? parseInt(buildingData.y, 10) : buildingData.y;
    
    // Determine the building size (default to cellSize if not specified)
    const size = buildingData.size || cellSize;
    
    // Create the appropriate building type based on the 'type' property
    let building;
    
    switch (buildingData.type) {
      case "Harbor":
        if (typeof Harbor === 'function') {
          building = new Harbor(x / cellSize, y / cellSize, size, owner);
        } else {
          console.warn("Harbor class not available, creating generic building");
          building = new Building(x / cellSize, y / cellSize, size, owner);
          building.type = "Harbor";
        }
        break;
        
      case "Farm":
        if (typeof Farm === 'function') {
          building = new Farm(x / cellSize, y / cellSize, size, owner);
        } else {
          console.warn("Farm class not available, creating generic building");
          building = new Building(x / cellSize, y / cellSize, size, owner);
          building.type = "Farm";
        }
        break;
        
      case "House":
        building = new Building(x / cellSize, y / cellSize, size, owner);
        building.type = "House";
        break;
        
      default:
        // For any other building type, create a generic Building
        building = new Building(x / cellSize, y / cellSize, size, owner);
        building.type = buildingData.type || "Unknown";
    }
    
    // Copy all properties from saved building to the new instance
    Object.assign(building, buildingData);
    
    // Ensure x and y are properly set (in case they were overwritten)
    building.x = x;
    building.y = y;
    
    // Restore owner reference properly
    if (owner) {
      building.owner = owner;
    }
    
    // Restore inhabitants if they exist
    if (buildingData.inhabitants && Array.isArray(buildingData.inhabitants)) {
      building.inhabitants = buildingData.inhabitants.map(id => {
        if (typeof id === 'number' && npcMap.has(id)) {
          return npcMap.get(id);
        }
        return id; // Keep the ID if NPC not found
      }).filter(inhabitant => inhabitant !== undefined);
    }
    
    return building;
  }).filter(building => building !== null);
  
  console.log(`Successfully restored ${restoredBuildings.length} buildings`);
  return restoredBuildings;
}

/**
 * Restores house objects with proper prototypes after loading from saved game
 * Houses are a special type of building in the game
 * 
 * @param {Array} houseDataArray - Array of raw house data from saved game
 * @param {Array} npcs - Array of NPC objects with proper prototypes (for inhabitant references)
 * @returns {Array} - Array of house objects with proper prototypes
 */
function restoreHouses(houseDataArray, npcs) {
  if (!houseDataArray || !Array.isArray(houseDataArray) || houseDataArray.length === 0) {
    console.warn("No houses to restore");
    return [];
  }

  console.log(`Restoring ${houseDataArray.length} houses...`);
  
  // Create a lookup map for faster NPC finding by myNumber
  const npcMap = new Map();
  if (npcs && Array.isArray(npcs)) {
    npcs.forEach(npc => {
      npcMap.set(npc.myNumber, npc);
    });
  }
  
  // Process each house to restore its prototype
  const restoredHouses = houseDataArray.map(houseData => {
    // Skip if house data is invalid
    if (!houseData || typeof houseData !== 'object') {
      console.warn("Invalid house data:", houseData);
      return null;
    }
    
    // Find the owner NPC if ownerId is provided
    let owner = null;
    if (houseData.ownerId && npcMap.size > 0) {
      owner = npcMap.get(houseData.ownerId);
      if (!owner) {
        console.warn(`Owner NPC with ID ${houseData.ownerId} not found for house:`, houseData);
      }
    }
    
    // Convert string coordinates to numbers if needed
    const x = typeof houseData.x === 'string' ? parseInt(houseData.x, 10) : houseData.x;
    const y = typeof houseData.y === 'string' ? parseInt(houseData.y, 10) : houseData.y;
    
    // Create a new house with Building prototype
    const house = new Building(x / cellSize, y / cellSize, cellSize, owner);
    house.type = "House";
    
    // Copy all properties from saved house to the new instance
    Object.assign(house, houseData);
    
    // Ensure x and y are properly set (in case they were overwritten)
    house.x = x;
    house.y = y;
    
    // Restore owner reference properly
    if (owner) {
      house.owner = owner;
    }
    
    // Restore inhabitants if they exist
    if (houseData.inhabitants && Array.isArray(houseData.inhabitants)) {
      house.inhabitants = houseData.inhabitants.map(id => {
        if (typeof id === 'number' && npcMap.has(id)) {
          return npcMap.get(id);
        }
        return id; // Keep the ID if NPC not found
      }).filter(inhabitant => inhabitant !== undefined);
    }
    
    return house;
  }).filter(house => house !== null);
  
  console.log(`Successfully restored ${restoredHouses.length} houses`);
  return restoredHouses;
}

// Make the functions available globally
if (typeof window !== 'undefined') {
  window.restoreBuildings = restoreBuildings;
  window.restoreHouses = restoreHouses;
}
