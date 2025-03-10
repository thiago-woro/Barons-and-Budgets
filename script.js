/* // ...existing code...

// Function to save the game state
function saveGame() {
    const gameState = {
        gold: gold,
        wood: wood,
        stone: stone,
        food: food,
        // Include other relevant game state variables here
        population: population,
        buildings: buildings,
        research: research,
        currentResearch: currentResearch,
        researchProgress: researchProgress,
        notifications: notifications,
        // Example: playerInventory: player.inventory
    };

    localStorage.setItem('baronsBudgetsSave', JSON.stringify(gameState));
    displayMessage("Game saved!");
}

// Function to load the game state
function loadGame() {
    const savedGame = localStorage.getItem('baronsBudgetsSave');
    if (savedGame) {
        const gameState = JSON.parse(savedGame);

        // Restore game state from the loaded data
        gold = gameState.gold;
        wood = gameState.wood;
        stone = gameState.stone;
        food = gameState.food;
        // Restore other relevant game state variables here
        population = gameState.population;
        buildings = gameState.buildings;
        research = gameState.research;
        currentResearch = gameState.currentResearch;
        researchProgress = gameState.researchProgress;
        notifications = gameState.notifications;
        // Example: player.inventory = gameState.playerInventory;

        updateDisplay(); // Update the UI to reflect the loaded state
        displayMessage("Game loaded!");
    } else {
        displayMessage("No saved game found.");
    }
}

// ...existing code...

// Example usage (connect to button clicks or other events)
document.getElementById('saveGameButton').addEventListener('click', saveGame);
document.getElementById('loadGameButton').addEventListener('click', loadGame);

// ...existing code...
 */