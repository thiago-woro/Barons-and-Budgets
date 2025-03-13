/**
 * LoadGameManager
 * 
 * This module coordinates the loading of all game components from a saved game.
 * It handles the initialization of all restoration functions and ensures they're
 * called in the correct order.
 */

// Track initialization status
let isInitialized = false;

/**
 * Initialize the LoadGameManager by patching all necessary functions
 * This should be called once when the game starts
 */
function initializeLoadGameManager() {
  if (isInitialized) {
    console.log("LoadGameManager already initialized");
    return;
  }

  console.log("Initializing LoadGameManager...");
  
  // Patch save/load functions for each system
  if (typeof patchSaveGameForAnimals === 'function' && 
      typeof patchLoadGameForAnimals === 'function') {
    patchSaveGameForAnimals();
    patchLoadGameForAnimals();
    console.log("Animal system patched");
  } else {
    console.warn("Animal system patch functions not found");
  }
  
  if (typeof patchSaveGameForFishingSystem === 'function' && 
      typeof patchLoadGameForFishingSystem === 'function') {
    patchSaveGameForFishingSystem();
    patchLoadGameForFishingSystem();
    console.log("Fishing system patched");
  } else {
    console.warn("Fishing system patch functions not found");
  }
  
  // Replace the original loadGame function with our managed version
  if (typeof loadGame === 'function') {
    const originalLoadGame = loadGame;
    
    // Replace with our managed version
    loadGame = function() {
      console.log("LoadGameManager: Starting managed game load process");
      
      try {
        // Call the original loadGame function
        const result = originalLoadGame.apply(this, arguments);
        
        // Perform post-load operations
        performPostLoadOperations();
        
        return result;
      } catch (error) {
        console.error("LoadGameManager: Error during load process:", error);
        addNotification("Load Error", "Failed to load game", error.message, null, "#a84a4a");
        return false;
      }
    };
    
    console.log("LoadGameManager: Replaced loadGame function with managed version");
  } else {
    console.warn("LoadGameManager: Original loadGame function not found");
  }
  
  // Attach to the load game button if it exists
  const loadGameButton = document.getElementById("loadGameWelcomeScreen") || 
                         document.getElementById("loadGame");
  
  if (loadGameButton) {
    // Remove any existing event listeners (to avoid duplicates)
    const newLoadGameButton = loadGameButton.cloneNode(true);
    loadGameButton.parentNode.replaceChild(newLoadGameButton, loadGameButton);
    
    // Add our managed load function
    newLoadGameButton.addEventListener("click", managedLoadGame);
    console.log("LoadGameManager: Attached to load game button");
  } else {
    console.warn("LoadGameManager: Load game button not found");
  }
  
  isInitialized = true;
  console.log("LoadGameManager initialized successfully");
}

/**
 * The main load game function that will be called when the load button is clicked
 */
function managedLoadGame() {
  console.log("LoadGameManager: Load game button clicked");
  
  try {
    // Check if there's a saved game
    const savedGameStateString = localStorage.getItem("savedGameState");
    if (!savedGameStateString) {
      console.warn("LoadGameManager: No saved game found");
      addNotification("Game", "No saved game found", "", null, "#a84a4a");
      return false;
    }
    
    // Parse the saved game state
    const savedGameState = JSON.parse(savedGameStateString);
    
    // Log what we're loading
    console.log(`LoadGameManager: Loading game from ${savedGameState.savedAt || 'unknown time'}`);
    console.log(`LoadGameManager: Game contains ${savedGameState.npcs?.length || 0} NPCs, ${savedGameState.buildings?.length || 0} buildings`);
    
    // Call the main loadGame function
    if (typeof loadGame === 'function') {
      loadGame();
    } else {
      console.error("LoadGameManager: loadGame function not found");
      addNotification("Load Error", "Load game function not found", "", null, "#a84a4a");
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("LoadGameManager: Error during managed load:", error);
    addNotification("Load Error", "Failed to load game", error.message, null, "#a84a4a");
    return false;
  }
}

/**
 * Perform operations after the main load is complete
 */
function performPostLoadOperations() {
  console.log("LoadGameManager: Performing post-load operations");
  
  // Restore NPC relationships if not already done
  if (typeof restoreNPCRelationships === 'function' && 
      window.npcs && Array.isArray(window.npcs)) {
    try {
      restoreNPCRelationships(window.npcs, window.npcs);
      console.log("LoadGameManager: NPC relationships restored");
    } catch (error) {
      console.warn("LoadGameManager: Error restoring NPC relationships:", error);
    }
  }
  
  // Restore buildings if not already done
  if (typeof restoreBuildings === 'function' && 
      window.buildings && Array.isArray(window.buildings)) {
    try {
      window.buildings = restoreBuildings(window.buildings, window.npcs);
      console.log("LoadGameManager: Buildings restored");
    } catch (error) {
      console.warn("LoadGameManager: Error restoring buildings:", error);
    }
  }
  
  // Restore houses if not already done
  if (typeof restoreHouses === 'function' && 
      window.houses && Array.isArray(window.houses)) {
    try {
      window.houses = restoreHouses(window.houses, window.npcs);
      console.log("LoadGameManager: Houses restored");
    } catch (error) {
      console.warn("LoadGameManager: Error restoring houses:", error);
    }
  }
  
  // Initialize fishing resources if needed
  if (typeof initializeFishingResources === 'function') {
    try {
      initializeFishingResources();
      console.log("LoadGameManager: Fishing resources initialized");
    } catch (error) {
      console.warn("LoadGameManager: Error initializing fishing resources:", error);
    }
  }
  
  // Redraw the world
  if (typeof redrawWorld === 'function') {
    try {
      redrawWorld();
      console.log("LoadGameManager: World redrawn");
    } catch (error) {
      console.warn("LoadGameManager: Error redrawing world:", error);
    }
  } else {
    // Fallback redraw if redrawWorld function doesn't exist
    try {
      // Clear canvases
      if (typeof clearCanvas === 'function') {
        if (window.groundCtx) clearCanvas(window.groundCtx);
        if (window.waterCtx) clearCanvas(window.waterCtx);
        if (window.treeCtx) clearCanvas(window.treeCtx);
        if (window.npcCtx) clearCanvas(window.npcCtx);
      }
      
      // Redraw terrain
      if (typeof drawTerrainLayer === 'function') {
        if (window.groundCtx && window.groundCells) {
          drawTerrainLayer(window.groundCtx, window.groundCells, window.cellSize);
        }
        if (window.waterCtx && window.waterCells) {
          drawTerrainLayer(window.waterCtx, window.waterCells, window.cellSize);
        }
      }
      
      // Redraw trees
      if (typeof drawTrees === 'function' && window.treeCtx && window.treePositions) {
        drawTrees(window.treeCtx, window.treePositions);
      }
      
      console.log("LoadGameManager: World redrawn using fallback method");
    } catch (error) {
      console.warn("LoadGameManager: Error in fallback redraw:", error);
    }
  }
  
  // Update UI
  try {
    if (window.currentPopulation && window.npcs) {
      window.currentPopulation.textContent = window.npcs.length;
    }
    
    if (window.npcTableHeader && window.npcs) {
      window.npcTableHeader.textContent = `Total Population ${window.npcs.length}`;
    }
    
    console.log("LoadGameManager: UI updated");
  } catch (error) {
    console.warn("LoadGameManager: Error updating UI:", error);
  }
  
  // Show success notification
  try {
    if (typeof addNotification === 'function') {
      addNotification(
        "Game", 
        "Game loaded successfully!", 
        `Year: ${window.year || 'unknown'}, Population: ${window.npcs?.length || 0}`, 
        null, 
        "#4a7ba8"
      );
    }
  } catch (error) {
    console.warn("LoadGameManager: Error showing notification:", error);
  }
  
  console.log("LoadGameManager: Post-load operations completed");
}

// Make functions available globally
if (typeof window !== 'undefined') {
  window.initializeLoadGameManager = initializeLoadGameManager;
  window.managedLoadGame = managedLoadGame;
}

// Auto-initialize when the script is loaded
if (typeof document !== 'undefined' && document.readyState === 'complete') {
  initializeLoadGameManager();
} else if (typeof window !== 'undefined') {
  window.addEventListener('load', initializeLoadGameManager);
} 