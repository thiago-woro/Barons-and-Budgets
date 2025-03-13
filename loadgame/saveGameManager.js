/**
 * SaveGameManager
 * 
 * This module coordinates the saving of all game components.
 * It handles the serialization of all game state and ensures everything
 * is properly saved to localStorage.
 */

// Track initialization status
let isInitialized = false;

// Track game session time
let gameSessionStartTime = Date.now();
let lastSaveTime = null;

/**
 * Initialize the SaveGameManager by patching necessary functions
 * This should be called once when the game starts
 */
function initializeSaveGameManager() {
  if (isInitialized) {
    console.log("SaveGameManager already initialized");
    return;
  }

  console.log("Initializing SaveGameManager...");
  
  // Initialize session tracking
  gameSessionStartTime = Date.now();
  
  // Replace the original saveGame function with our managed version
  if (typeof saveGame === 'function') {
    const originalSaveGame = saveGame;
    
    // Replace with our managed version
    saveGame = function() {
      console.log("SaveGameManager: Starting managed game save process");
      
      try {
        // Update played hours before saving
        updatePlayedHours();
        
        // Prepare additional metadata
        prepareMetadata();
        
        // Call the original saveGame function
        const result = originalSaveGame.apply(this, arguments);
        
        // Perform post-save operations
        performPostSaveOperations();
        
        return result;
      } catch (error) {
        console.error("SaveGameManager: Error during save process:", error);
        addNotification("Save Error", "Failed to save game", error.message, null, "#a84a4a");
        return false;
      }
    };
    
    console.log("SaveGameManager: Replaced saveGame function with managed version");
  } else {
    console.warn("SaveGameManager: Original saveGame function not found");
  }
  
  // Attach to the save game button if it exists
  const saveGameButton = document.getElementById("saveButton") || 
                         document.getElementById("saveGame");
  
  if (saveGameButton) {
    // Remove any existing event listeners (to avoid duplicates)
    const newSaveGameButton = saveGameButton.cloneNode(true);
    saveGameButton.parentNode.replaceChild(newSaveGameButton, saveGameButton);
    
    // Add our managed save function
    newSaveGameButton.addEventListener("click", managedSaveGame);
    console.log("SaveGameManager: Attached to save game button");
  } else {
    console.warn("SaveGameManager: Save game button not found");
  }
  
  // Set up auto-save if needed
  setupAutoSave();
  
  isInitialized = true;
  console.log("SaveGameManager initialized successfully");
}

/**
 * The main save game function that will be called when the save button is clicked
 */
function managedSaveGame() {
  console.log("SaveGameManager: Save game button clicked");
  
  try {
    // Update played hours
    updatePlayedHours();
    
    // Call the main saveGame function
    if (typeof saveGame === 'function') {
      saveGame();
      lastSaveTime = Date.now();
    } else {
      console.error("SaveGameManager: saveGame function not found");
      addNotification("Save Error", "Save game function not found", "", null, "#a84a4a");
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("SaveGameManager: Error during managed save:", error);
    addNotification("Save Error", "Failed to save game", error.message, null, "#a84a4a");
    return false;
  }
}

/**
 * Update the played hours counter
 */
function updatePlayedHours() {
  if (typeof window.playedHours !== 'undefined') {
    const currentSessionHours = (Date.now() - gameSessionStartTime) / (1000 * 60 * 60);
    window.playedHours = (parseFloat(window.playedHours) || 0) + currentSessionHours;
    
    // Reset session timer
    gameSessionStartTime = Date.now();
    
    console.log(`SaveGameManager: Updated played hours to ${window.playedHours.toFixed(2)}`);
  }
}

/**
 * Prepare metadata to be included in the save
 */
function prepareMetadata() {
  try {
    const savedGameStateString = localStorage.getItem("savedGameState");
    if (!savedGameStateString) {
      return;
    }
    
    const gameState = JSON.parse(savedGameStateString);
    
    // Add current date in ISO format
    const now = new Date();
    gameState.savedAt = now.toISOString();
    
    // Add human readable date
    const options = { 
      weekday: 'long', 
      hour: 'numeric', 
      minute: 'numeric', 
      hour12: true 
    };
    gameState.savedAtHuman = now.toLocaleDateString('en-US', options);
    
    // Add player information
    gameState.playerInfo = {
      playerRace: window.playerRace || "Elf",
      kingdomName: window.kingdomName || "Elven Kingdom",
      playerName: window.playerName || "OrcXSlayer777",
      playedHours: parseFloat(window.playedHours || 0).toFixed(2)
    };
    
    // Add game statistics
    gameState.gameStats = {
      population: window.npcs?.length || 0,
      year: window.year || 0,
      buildings: window.buildings?.length || 0,
      houses: window.houses?.length || 0,
      animals: window.animals?.length || 0,
      trees: window.treePositions?.length || 0
    };
    
    // Save the updated game state
    localStorage.setItem("savedGameState", JSON.stringify(gameState));
    
    console.log("SaveGameManager: Metadata prepared and added to save");
  } catch (error) {
    console.warn("SaveGameManager: Error preparing metadata:", error);
  }
}

/**
 * Perform operations after the main save is complete
 */
function performPostSaveOperations() {
  console.log("SaveGameManager: Performing post-save operations");
  
  // Create a backup of the save if needed
  createBackup();
  
  // Show success notification with additional info
  try {
    if (typeof addNotification === 'function') {
      // Get the saved game state to show details
      const savedGameStateString = localStorage.getItem("savedGameState");
      if (savedGameStateString) {
        const gameState = JSON.parse(savedGameStateString);
        
        // Create a detailed message
        const detailMessage = `
          Kingdom: ${gameState.playerInfo?.kingdomName || "Unknown"}
          Race: ${gameState.playerInfo?.playerRace || "Unknown"}
          Population: ${gameState.gameStats?.population || 0}
          Year: ${gameState.gameStats?.year || 0}
          Played: ${gameState.playerInfo?.playedHours || 0} hours
        `;
        
        addNotification(
          "Game", 
          "Game saved successfully!", 
          detailMessage, 
          null, 
          "#4a7ba8"
        );
      } else {
        addNotification("Game", "Game saved successfully!", new Date().toLocaleString(), null, "#4a7ba8");
      }
    }
  } catch (error) {
    console.warn("SaveGameManager: Error showing notification:", error);
  }
  
  console.log("SaveGameManager: Post-save operations completed");
}

/**
 * Create a backup of the current save
 */
function createBackup() {
  try {
    const savedGameStateString = localStorage.getItem("savedGameState");
    if (!savedGameStateString) {
      return;
    }
    
    // Create a backup with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    localStorage.setItem(`savedGameState_backup_${timestamp}`, savedGameStateString);
    
    // Limit the number of backups (keep last 5)
    const backupKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('savedGameState_backup_')) {
        backupKeys.push(key);
      }
    }
    
    // Sort by timestamp (newest first) and remove oldest if we have too many
    backupKeys.sort().reverse();
    if (backupKeys.length > 5) {
      for (let i = 5; i < backupKeys.length; i++) {
        localStorage.removeItem(backupKeys[i]);
      }
    }
    
    console.log(`SaveGameManager: Created backup ${timestamp}`);
  } catch (error) {
    console.warn("SaveGameManager: Error creating backup:", error);
  }
}

/**
 * Set up auto-save functionality
 */
function setupAutoSave() {
  // Auto-save every 5 minutes
  const autoSaveInterval = 5 * 60 * 1000; // 5 minutes
  
  setInterval(() => {
    // Only auto-save if it's been at least 5 minutes since the last save
    if (!lastSaveTime || (Date.now() - lastSaveTime) >= autoSaveInterval) {
      console.log("SaveGameManager: Performing auto-save");
      managedSaveGame();
    }
  }, autoSaveInterval);
  
  console.log("SaveGameManager: Auto-save configured for every 5 minutes");
}

/**
 * Get a list of available save backups
 * @returns {Array} Array of backup objects with timestamp and data
 */
function getAvailableBackups() {
  const backups = [];
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('savedGameState_backup_')) {
        const timestamp = key.replace('savedGameState_backup_', '');
        const data = localStorage.getItem(key);
        
        if (data) {
          try {
            const parsedData = JSON.parse(data);
            backups.push({
              timestamp,
              savedAt: parsedData.savedAt,
              savedAtHuman: parsedData.savedAtHuman,
              playerInfo: parsedData.playerInfo,
              gameStats: parsedData.gameStats,
              key
            });
          } catch (e) {
            console.warn(`SaveGameManager: Error parsing backup ${timestamp}:`, e);
          }
        }
      }
    }
    
    // Sort by timestamp (newest first)
    backups.sort((a, b) => {
      return new Date(b.savedAt || b.timestamp) - new Date(a.savedAt || a.timestamp);
    });
  } catch (error) {
    console.warn("SaveGameManager: Error getting available backups:", error);
  }
  
  return backups;
}

/**
 * Restore a game from a backup
 * @param {string} backupKey - The key of the backup to restore
 * @returns {boolean} - Whether the restoration was successful
 */
function restoreFromBackup(backupKey) {
  try {
    const backupData = localStorage.getItem(backupKey);
    if (!backupData) {
      console.warn(`SaveGameManager: Backup ${backupKey} not found`);
      return false;
    }
    
    // Restore the backup to the main save slot
    localStorage.setItem("savedGameState", backupData);
    
    console.log(`SaveGameManager: Restored from backup ${backupKey}`);
    
    // If we have a load function, call it
    if (typeof managedLoadGame === 'function') {
      managedLoadGame();
    }
    
    return true;
  } catch (error) {
    console.error("SaveGameManager: Error restoring from backup:", error);
    return false;
  }
}

// Make functions available globally
if (typeof window !== 'undefined') {
  window.initializeSaveGameManager = initializeSaveGameManager;
  window.managedSaveGame = managedSaveGame;
  window.getAvailableBackups = getAvailableBackups;
  window.restoreFromBackup = restoreFromBackup;
  
  // Initialize global variables if they don't exist
  if (typeof window.playerRace === 'undefined') {
    window.playerRace = "Elf";
  }
  
  if (typeof window.kingdomName === 'undefined') {
    window.kingdomName = "Elven Kingdom";
  }
  
  if (typeof window.playerName === 'undefined') {
    window.playerName = "OrcXSlayer777";
  }
  
  if (typeof window.playedHours === 'undefined') {
    window.playedHours = 0;
  }
}

// Auto-initialize when the script is loaded
if (typeof document !== 'undefined' && document.readyState === 'complete') {
  initializeSaveGameManager();
} else if (typeof window !== 'undefined') {
  window.addEventListener('load', initializeSaveGameManager);
} 