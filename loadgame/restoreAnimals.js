/**
 * Restores animal objects with proper prototypes after loading from saved game
 * This function handles the reconstruction of animals with their correct class prototypes
 * 
 * @param {Array} animalDataArray - Array of raw animal data from saved game
 * @returns {Array} - Array of animal objects with proper prototypes
 */
function restoreAnimals(animalDataArray) {
  if (!animalDataArray || !Array.isArray(animalDataArray) || animalDataArray.length === 0) {
    console.warn("No animals to restore");
    return [];
  }

  console.log(`Restoring ${animalDataArray.length} animals...`);
  
  // Process each animal to restore its prototype
  const restoredAnimals = animalDataArray.map(animalData => {
    // Skip if animal data is invalid
    if (!animalData || typeof animalData !== 'object') {
      console.warn("Invalid animal data:", animalData);
      return null;
    }
    
    // Convert string coordinates to numbers if needed
    const x = typeof animalData.x === 'string' ? parseInt(animalData.x, 10) : animalData.x;
    const y = typeof animalData.y === 'string' ? parseInt(animalData.y, 10) : animalData.y;
    
    // Create a new animal with the Animal prototype
    const animal = new Animal(
      Math.floor(x / cellSize), 
      Math.floor(y / cellSize), 
      animalData.type
    );
    
    // Copy all properties from saved animal to the new instance
    Object.assign(animal, animalData);
    
    // Ensure x and y are properly set (in case they were overwritten)
    animal.x = x;
    animal.y = y;
    
    // Recalculate derived properties to ensure consistency
    animal.isPredator = animal.checkIfPredator();
    animal.emoji = animal.getEmoji();
    
    // Reset animation state to avoid visual glitches
    animal.animation = null;
    
    // Ensure movement timers are properly initialized
    animal.timeSinceLastMove = 0;
    animal.timeSinceLastReproduction = Math.random() * Animal.REPRODUCTION_INTERVAL;
    
    // Set movement speed based on predator/prey status
    animal.moveInterval = animal.isPredator ? 
      Animal.PREY_BASE_SPEED / Animal.PREDATOR_SPEED_MULTIPLIER : 
      Animal.PREY_BASE_SPEED;
    
    // Reset additional speed modifiers
    animal.normalSpeed = animal.moveInterval;
    animal.chaseSpeed = animal.moveInterval * 0.8;
    
    return animal;
  }).filter(animal => animal !== null);
  
  console.log(`Successfully restored ${restoredAnimals.length} animals`);
  return restoredAnimals;
}

/**
 * Updates the saveGame function to include animals in the saved game state
 * This function should be called once to patch the saveGame function
 */
function patchSaveGameForAnimals() {
  if (typeof saveGame !== 'function') {
    console.warn("saveGame function not found, cannot patch for animal saving");
    return;
  }
  
  // Store the original saveGame function
  const originalSaveGame = saveGame;
  
  // Replace with our patched version
  saveGame = function() {
    // Call the original function to get the game state
    const result = originalSaveGame.apply(this, arguments);
    
    // Add animals to the game state if they're not already included
    try {
      const savedGameStateString = localStorage.getItem("savedGameState");
      if (savedGameStateString) {
        const gameState = JSON.parse(savedGameStateString);
        
        // Only add animals if they don't exist in the saved state
        if (!gameState.animals && animals && Array.isArray(animals)) {
          gameState.animals = animals;
          localStorage.setItem("savedGameState", JSON.stringify(gameState));
          console.log("Added animals to saved game state");
        }
      }
    } catch (error) {
      console.warn("Failed to add animals to saved game:", error);
    }
    
    return result;
  };
  
  console.log("Patched saveGame function to include animals");
}

/**
 * Updates the loadGame function to restore animals from the saved game state
 * This function should be called once to patch the loadGame function
 */
function patchLoadGameForAnimals() {
  if (typeof loadGame !== 'function') {
    console.warn("loadGame function not found, cannot patch for animal loading");
    return;
  }
  
  // Store the original loadGame function
  const originalLoadGame = loadGame;
  
  // Replace with our patched version
  loadGame = function() {
    // Call the original function
    const result = originalLoadGame.apply(this, arguments);
    
    // After loading, check if animals need to be restored
    try {
      const savedGameStateString = localStorage.getItem("savedGameState");
      if (savedGameStateString) {
        const savedGameState = JSON.parse(savedGameStateString);
        
        // If animals exist in the saved state, restore them
        if (savedGameState.animals && Array.isArray(savedGameState.animals)) {
          animals = restoreAnimals(savedGameState.animals);
          console.log(`Restored ${animals.length} animals from saved game`);
        }
      }
    } catch (error) {
      console.warn("Failed to restore animals from saved game:", error);
    }
    
    return result;
  };
  
  console.log("Patched loadGame function to restore animals");
}

// Make the functions available globally
if (typeof window !== 'undefined') {
  window.restoreAnimals = restoreAnimals;
  window.patchSaveGameForAnimals = patchSaveGameForAnimals;
  window.patchLoadGameForAnimals = patchLoadGameForAnimals;
}
