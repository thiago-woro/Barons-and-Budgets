//related to players and NPCs  ⭐⭐⭐⭐

let year = 0;
// You can call this function in your main game loop, providing the required values:
var startingPopulation = 10; // Set your desired starting population
var populationIncreaseSpeed = 0.15; // Set the speed for population growth (e.g., 5% per game tick)
var currentPopulation = startingPopulation; // Initially, it's the same as the starting population
var totalDeaths = 0; // Initially, total deaths are 0
var deathRate = 0.05;
var isPaused = false; // Variable to track the pause state

var npcCanvas = document.getElementById("npcCanvas");
var npcCtx = npcCanvas.getContext("2d");
var gameLoopSpeed = 10000 / 60; // 60 frames per second

var npcs = []; // Array to store NPC objects
var npcSize = 20; // Size of the NPC on canvas

// Asynchronous version of managePopulation8
async function managePopulation8() {
	console.log("⏳⏳⏳⏳⏳⏳⏳⏳");

	// Calculate growth asynchronously
	return new Promise((resolve, reject) => {
		var growth = populationManager.calculateGrowth();
		// Simulate asynchronous delay
		setTimeout(() => {
			resolve(growth); // Return the calculated growth
		}, 1000);
	});
}

async function gameLoop9() {
	year++;
	console.log("Year: " + year);
	console.log("pop: " + currentPopulation);

	if (isPaused) return;

	// In the gameLoop9 function
	if (currentPopulation > 50) {
		npcs = npcs.filter((npc) => {
			console.log("Name: " + npc.name); // Logging game state
			addNPCToTable(npc);

			const isDead = npc.ageAndDie();
			if (isDead) {
				// Population is already decreased inside ageAndDie, so no need to decrease again here
				return false; // Remove the NPC from the array
			}
			return true;
		});

		sortNPCtable();
	}

	var growth = await managePopulation8();
	populationManager.increasePopulation();

	// Update currentPopulation variable for other usages
	currentPopulation = populationManager.currentPopulation;

	// In the game loop
	if (currentPopulation < populationManager.maxPopulation) {
		drawNPCs10(npcCtx, currentPopulation, gridSize, cellSize);
	}

	// Check if population is approaching total land cells - 30
	if (currentPopulation >= landCells.length - 30) {
		iziToast.show({
			title: "Population Alert",
			message: "Population is approaching the limit!",
			position: "topCenter",
			color: "yellow",
			timeout: 500, // Display time in milliseconds
		});
	}

	// Calculate the Economic GDP as $10 per capita
	var economicGDP = currentPopulation * 10;

	// Update the counters in the HTML
	document.getElementById("currentPopulation").textContent = currentPopulation;
	document.getElementById("growthRate").textContent = populationIncreaseSpeed;
	document.getElementById("gameSpeed").textContent =
		"x " + gameLoopSpeed.toFixed(0);
	document.getElementById("economicGDP").textContent = "$ " + economicGDP;

	// Continue the game loop with a controlled speed
	setTimeout(gameLoop9, gameLoopSpeed);

	console.log("End of gameLoop9", {
		currentPopulation,
		populationIncreaseSpeed,
		economicGDP,
	}); // Logging the end of the function
}

// Event listener for play button
document.getElementById("playButton").addEventListener("click", function () {
	isPaused = false; // Set pause state to false
	gameLoop9(); // Start the game loop
	console.log("Game resumed"); // Logging game state
});

// Event listener for pause button
document.getElementById("pauseButton").addEventListener("click", function () {
	isPaused = true; // Set pause state to true
	console.log("Game paused"); // Logging game state
});

class NPC {
	constructor(x, y, cellSize) {
		this.x = x * cellSize;
		this.y = y * cellSize;
		this.age = Math.floor(Math.random() * 100);
		this.salary = Math.floor(Math.random() * 10000);
		this.movement = {dx: 1, dy: 1}; // Example movement pattern
		this.sex = Math.random() < 0.5 ? "male" : "female";
		this.color = Math.random() < 0.5 ? "#8290ab" : "#a382ab";
		this.isClickable = true; // Can be toggled on or off
		this.isAlive = true; // NPC is alive when created
		this.deathAge = Math.floor(Math.random() * 80 + 20); // Age at which NPC dies
		this.name = this.generateName(); // Generate a name for the NPC
	}

	// Method to simulate aging and handle death
	// Method to simulate aging and handle death
	ageAndDie() {
		if (this.isAlive) {
			this.age++; // Increase age by 1 each time the method is called

			// Determine the color based on gender and age
			if (this.sex === "male") {
				this.color = this.getMaleColor();
			} else if (this.sex === "female") {
				this.color = this.getFemaleColor();
			}

			if (this.age >= this.deathAge) {
				this.color = "#000";
				this.isAlive = false; // NPC has died
				this.isClickable = false; // Disable clicking on a dead NPC
				console.log(`NPC dead at age ${this.age} ✝✝✝✝`);
				// You can perform any additional cleanup or actions here
				console.log(`NPC population: ` + npcs.length);

				// Example: Remove the NPC from the npcs array if it exists
				const npcIndex = npcs.indexOf(this);
				if (npcIndex !== -1) {
					npcs.splice(npcIndex, 1);

					populationManager.decreasePopulation(1);
					console.log(
						`Current population: ` + populationManager.currentPopulation
					);
				}
				// Return true if the NPC is dead
				return true;
			}
		}
		// Return false if the NPC is not dead
		return false;
	}

	// Method to calculate male color based on age
	getMaleColor() {
		const maxAge = this.deathAge; // Color change completes by the time of death
		const brightness = Math.min(255, Math.floor((this.age / maxAge) * 255));
		return `rgb(0, 0, ${brightness})`;
	}

	// Method to calculate female color based on age
	getFemaleColor() {
		const maxAge = this.deathAge; // Color change completes by the time of death
		const brightness = Math.min(255, Math.floor((this.age / maxAge) * 255));
		return `rgb(${brightness}, 0, 0)`;
	}

	// Method to generate a random name based on gender
	generateName() {
		const maleNames = ["John", "Michael", "William", "David", "James"];
		const femaleNames = ["Mary", "Jennifer", "Linda", "Patricia", "Elizabeth"];

		if (this.sex === "male") {
			return maleNames[Math.floor(Math.random() * maleNames.length)];
		} else if (this.sex === "female") {
			return femaleNames[Math.floor(Math.random() * femaleNames.length)];
		} else {
			return "Unknown";
		}
	}
}

function drawNPCs10(ctx, population, gridSize, cellSize, growthFactor = 1.5) {
	//console.log("POPULATING PEOPLE 👫 =  👶");

	// Applying growth factor to the population
	population = Math.floor(population * growthFactor);
	console.log("Total population after applying growth:", population);

	//console.log("gridSize:", gridSize); // Debugging the gridSize
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); // Clear previous drawings

	// We need to get the terrain (ground) information from the existing grid
	var terrain = terrainGrid; // Assuming that the grid is stored in the groundCanvas
	//console.log("terrain:", terrain); // Debugging the terrain

	//console.log("landCells:", landCells); // Debugging the land cells
	console.log("POPULATING PEOPLE, npcs array: " + npcs.length + "\n\n");

	// Create clusters randomly using landCells
	var clusters = [];
	var clusterSize = 5; // Number of NPCs in each cluster
	var clusterRadius = 2; // How close the NPCs are to each other

	var workingLandCells = [...landCells]; // Create a copy of landCells to work with

	while (clusters.length < population && workingLandCells.length > 0) {
		var randomIndex = Math.floor(Math.random() * workingLandCells.length);
		var centerCell = workingLandCells.splice(randomIndex, 1)[0];

		var cluster = [centerCell];
		for (var i = 1; i < clusterSize && workingLandCells.length > 0; i++) {
			var nearbyCells = workingLandCells.filter((cell) => {
				return (
					Math.abs(cell.x - centerCell.x) <= clusterRadius &&
					Math.abs(cell.y - centerCell.y) <= clusterRadius
				);
			});

			if (nearbyCells.length > 0) {
				var randomNearbyIndex = Math.floor(Math.random() * nearbyCells.length);
				var selectedNearbyCell = nearbyCells[randomNearbyIndex];
				workingLandCells = workingLandCells.filter(
					(cell) => cell !== selectedNearbyCell
				);
				cluster.push(selectedNearbyCell);
			}
		}
		clusters.push(...cluster);
	}

	clusters.forEach((cluster) => {
		var npc = new NPC(cluster.x, cluster.y, cellSize);
		npcs.push(npc);

		ctx.fillStyle = npc.color;
		ctx.fillRect(npc.x, npc.y, npcSize, npcSize);

		// Draw the NPC's name
		ctx.fillStyle = "black"; // Change this to the desired text color
		ctx.fillText(npc.name, npc.x, npc.y - 11); // Draw name 5 pixels above the rectangle
		ctx.fillText(npc.age, npc.x, npc.y - 3); // Draw name 5 pixels above the rectangle

		ctx.font = "10px Arial"; // Change this to the desired font size and style
	});

	// Event listener for clicks
	npcCanvas.addEventListener("click", function (event) {
		var x = event.clientX - npcCanvas.getBoundingClientRect().left;
		var y = event.clientY - npcCanvas.getBoundingClientRect().top;

		npcs.forEach((npc) => {
			if (
				npc.isClickable &&
				x >= npc.x &&
				x <= npc.x + npcSize &&
				y >= npc.y &&
				y <= npc.y + npcSize
			) {
				npcCanvas.classList.add("hover-npc"); // Add cursor class when hovering over an NPC
				console.log(`${npc.name} Age: ${npc.age}`);

				// You can display this information somewhere on your page, for example:
				var npcInfoDiv = document.getElementById("npc-info");
				npcInfoDiv.textContent = `${npc.name}, Age: ${npc.age}, Salary: ${npc.salary}`;
			}
		});

		//console.log("End of NPC click event");
	});
	console.log("Finished drawing NPCs " + npcs.length + "\n\n");
	console.log("Total population: ", population); // Logging the end of the function
	console.log("Total NPCs", npcs.length); // Logging NPCs list
}

npcCanvas.addEventListener("mouseenter", function () {
	npcCanvas.classList.add("hover-npc"); // Add cursor class when hovering over an NPC
});

npcCanvas.addEventListener("mouseleave", function () {
	npcCanvas.classList.remove("hover-npc"); // Remove cursor class when not hovering over an NPC
});

// Population manager class
class PopulationManager {
	constructor(startingPopulation, populationIncreaseSpeed) {
		this.currentPopulation = startingPopulation;
		this.populationIncreaseSpeed = populationIncreaseSpeed;
	}

	// Function to calculate growth
	calculateGrowth() {
		return Math.floor(this.currentPopulation * this.populationIncreaseSpeed);
	}
	setMaxPopulation(maxPopulation) {
		this.maxPopulation = maxPopulation;
	}

	// Modify the increasePopulation method
	increasePopulation() {
		const growth = this.calculateGrowth();
		this.currentPopulation = Math.min(
			this.currentPopulation + growth,
			this.maxPopulation
		);
	}

	decreasePopulation(amount) {
		this.currentPopulation = Math.max(0, this.currentPopulation - amount);
	}
}

// Function to add NPC information to the table
function addNPCToTable(npc) {
	const tableBody = document.querySelector("#npcTable tbody");
	const newRow = tableBody.insertRow();

	const nameCell = newRow.insertCell();
	nameCell.textContent = npc.name;

	const ageCell = newRow.insertCell();
	ageCell.textContent = npc.age;

	const salaryCell = newRow.insertCell();
	salaryCell.textContent = npc.salary;

	const professionCell = newRow.insertCell();
	// Set the profession based on some logic or data
	// For example, you can randomly choose a profession
	const professions = ["Doctor", "Teacher", "Engineer", "Artist"];
	const randomProfession =
		professions[Math.floor(Math.random() * professions.length)];
	professionCell.textContent = randomProfession;

	// Add more cells for other variables if needed
}

function sortNPCtable() {
	console.log("\n\n\n Sorting table...\n\n");

	// Sort NPCs by age (from youngest to oldest)
	npcs.sort((a, b) => a.age - b.age);

	// Get a reference to the table body
	const tbody = document.querySelector("#npcTable tbody");

	// Loop through NPCs and create table rows
	for (const npc of npcs) {
		const row = document.createElement("tr");
		const nameCell = document.createElement("td");
		nameCell.textContent = npc.name;
		const ageCell = document.createElement("td");
		ageCell.textContent = npc.age;
		const salaryCell = document.createElement("td");
		salaryCell.textContent = npc.salary;
		// Create more cells for other NPC properties

		row.appendChild(nameCell);
		row.appendChild(ageCell);
		row.appendChild(salaryCell);
		// Append more cells

		tbody.appendChild(row);
	}
}

// Instantiate PopulationManager
const populationManager = new PopulationManager(
	startingPopulation,
	populationIncreaseSpeed
);
