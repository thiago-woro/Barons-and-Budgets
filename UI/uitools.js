//all this is just to make sure all canvas have the correct width and height, that is the gridsize * cellsize
function setupCanvas(canvasId, width, height) {
  //console.log('setting ' + canvasId + "to "  + gridSize + " x " + rows +" rows")
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext("2d");
  //canvas.width = gridSize * cellSize; // Set canvas width to the specified width
  //canvas.height = gridSize * cellSize; // Set canvas height to the specified heig
  canvas.width = cellSize * rows;
  canvas.height = cellSize * rows;
 // console.log('new width  ' + canvas.width)

  // Set canvas position relative to the container
  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  return [canvas, ctx];
}


const canvasElements = [ //all canvas
  "npcCanvas",
  "groundCanvas",
  "waterCanvas",
  "wavesCanvas",
  "treeCanvas",
  "boatCanvas",
  "minimap",
  "path",
  "npcInfoOverlay",
  "oreDeposits",
  "homes",
  "animalCanvas"
];

const ctxElements = {};

for (const canvasId of canvasElements) {
  ctxElements[canvasId] = setupCanvas(canvasId);
}
//all canvas ctx    homesctx
const [npcCanvas, npcCtx] = ctxElements["npcCanvas"];
const [groundCanvas, groundCtx] = ctxElements["groundCanvas"];
const [waterCanvas, waterCtx] = ctxElements["waterCanvas"];
const [wavesCanvas, wavesCtx] = ctxElements["wavesCanvas"];
const [treeCanvas, treeCtx] = ctxElements["treeCanvas"];
const [boatCanvas, boatCtx] = ctxElements["boatCanvas"];
const [minimapCanvas, minimapCtx] = ctxElements["minimap"];
const [pathCanvas, pathCtx] = ctxElements["path"];
const [npcInfoOverlayCanvas, npcInfoOverlayCtx] = ctxElements["npcInfoOverlay"];
const [oreDepositsCanvas, oreDepositsCtx] = ctxElements["oreDeposits"];
const [homesCanvas, homesCtx] = ctxElements["homes"];
const [animalCanvas, animalCtx] = ctxElements["animalCanvas"];
//finished canvases setup






// Function to toggle the visibility of a tab and show the most recent clicked tab
function toggleTab(tabId) {
  const tab = document.getElementById(tabId);
  const tabWindows = document.querySelectorAll(".card");
  const tabButtons = document.querySelectorAll(".tabSelector");

  // Hide all tab windows
  tabWindows.forEach((tabWindow) => {
    tabWindow.style.display = "none";
  });

  // Remove "active" class from all tab buttons
  tabButtons.forEach((tabButton) => {
    tabButton.classList.remove("active");
  });

  // Show the clicked tab window
  tab.style.display = "block";

  // Add "active" class to the clicked tab button
  const tabButton = document.getElementById(`${tabId}Button`);
  tabButton.classList.add("active");
}

// Function to handle bottom tab clicks
function handleBottomTabClick(tabId) {
  console.log(`Bottom tab clicked: ${tabId}`);
  
  // Remove active class from all bottom tabs
  const bottomTabs = document.querySelectorAll('.bottomTabs span');
  bottomTabs.forEach(tab => {
    tab.parentElement.classList.remove('active');
  });
  
  // Add active class to clicked tab
  document.getElementById(tabId).parentElement.classList.add('active');
  
  // Set global variable to the name of the tab
  window.activeTabBottomLeft = tabId.replace('Tab', '').toLowerCase();
  console.log(`Active tab set to: ${window.activeTabBottomLeft}`);
  
  // Hide all rows first
  const rows = ['terrainRow', 'creaturesRow', 'buildingsRow', 'budgetsRow', 'animalsRow'];
  rows.forEach(rowId => {
    const row = document.getElementById(rowId);
    if (row) {
      row.style.display = 'none';
    }
  });
  
  // Show only the row corresponding to the clicked tab
  const rowToShow = tabId.replace('Tab', 'Row');
  const targetRow = document.getElementById(rowToShow);
  if (targetRow) {
    targetRow.style.display = 'flex';
  }

  // Reset all canvas z-indexes to default
  document.getElementById('npcCanvas').style.zIndex = '90';
  document.getElementById('homes').style.zIndex = '90';
  document.getElementById('animalCanvas').style.zIndex = '51';
  
  // Set z-index based on active tab
  if (window.activeTabBottomLeft === 'creatures') {
    document.getElementById('npcCanvas').style.zIndex = '99';
  } else if (window.activeTabBottomLeft === 'buildings') {
    document.getElementById('homes').style.zIndex = '99';
  } else if (window.activeTabBottomLeft === 'animals') {
    document.getElementById('animalCanvas').style.zIndex = '99';
  }
}

// Add event listeners to bottom tabs
document.addEventListener('DOMContentLoaded', () => {
  const bottomTabIds = ['terrainTab', 'creaturesTab', 'budgetsTab', 'buildingsTab', 'animalsTab'];
  
  bottomTabIds.forEach(tabId => {
    const tabElement = document.getElementById(tabId);
    if (tabElement) {
      tabElement.addEventListener('click', () => handleBottomTabClick(tabId));
    }
  });
  
  // Set default active tab
  if (document.getElementById('creaturesTab')) {
    handleBottomTabClick('creaturesTab');
    // Set initial z-index for the default tab (creatures)
    document.getElementById('npcCanvas').style.zIndex = '99';
  }
  

  
  // Add event listener for originButton if it exists
  const originButton = document.getElementById('originButton');
  if (originButton) {
    originButton.addEventListener('click', () => {
      camera.centerOnOrigin();
    });
  }
  
  setupKeyboardZoom();

  // Add event listener for close building button
  const closeBuildingButton = document.getElementById('closeBuildingButton');
  if (closeBuildingButton) {
    closeBuildingButton.addEventListener('click', closeInsideBuilding);
  }
  
  // Add event listener for Escape key to close building view
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      const insideBuilding = document.getElementById('insideBuilding');
      if (insideBuilding && insideBuilding.style.visibility === 'visible') {
        closeInsideBuilding();
      }
    }
  });
});

document.getElementById("recenterCanvas").addEventListener("click", () => {
  camera.centerCanvasOnMap(); //2
});

// Function to toggle the visibility of a tab and show the most recent clicked tab
function hideTabs() {
  if (hideMenu === true) {
    gameTab.style.display = "block";
   // statsTab.style.display = "block";
   // chartTab.style.display = "block";
    //npcTab.style.display = "block";
    minimizeTabButton.textContent = "📂"; //open folder pasta
    hideMenu = false;
  } else {
    hideMenu = true;
    gameTab.style.display = "none";
    statsTab.style.display = "none";
    chartTab.style.display = "none";
    npcTab.style.display = "none";
    //minimizeTabButton.textContent = "📂"; //abre pasta
  }

  // Store hideMenu value in localStorage
  localStorage.setItem("hideMenu", JSON.stringify(hideMenu));
}

// On page load, retrieve hideMenu value from localStorage
window.addEventListener("load", function () {
  const storedHideMenu = localStorage.getItem("hideMenu");
  if (storedHideMenu !== null) {
    hideMenu = JSON.parse(storedHideMenu);
    if (hideMenu === false) {
      gameTab.style.display = "block";
      statsTab.style.display = "block";
      chartTab.style.display = "block";
      npcTab.style.display = "block";
      minimizeTabButton.textContent = "Hide";
    }
  }
});


function updateVariables() {
  gridSize = parseFloat(document.getElementById("gridSizeSlider").value);
  perlinNoiseScale = parseFloat(
    document.getElementById("perlinNoiseScaleSlider").value
  );
  document.getElementById("gridSizeDisplay").textContent = gridSize;
  document.getElementById("perlinDisplay").textContent = perlinNoiseScale;
  console.log(
    `Updated variables - Grid Size: ${gridSize}, Perlin Noise Scale: ${perlinNoiseScale}`
  );
}

// Attach input event listeners to the sliders
document
  .getElementById("gridSizeSlider")
  .addEventListener("input", function () {
    gridSize = parseFloat(this.value);
    updateVariables();
  });

document
  .getElementById("perlinNoiseScaleSlider")
  .addEventListener("input", function () {
    perlinNoiseScale = parseFloat(this.value);
    updateVariables();
  });

newGameWelcomeScreen.addEventListener("click", function () {
  hideWelcomeScreen();
  startMapGeneration(gridSize, gridSize, perlinNoiseScale);
});

const raceCards = document.querySelectorAll(".race-card");

// Add an event listener to each "race-card" element
raceCards.forEach((raceCard) => {
  raceCard.addEventListener("click", function (event) {
    // Set player race based on the clicked card's ID or class
    if (raceCard.id === "purriesWelcomeSelector") {
      playerRace = "Purries";
      console.log("Player selected Purries race!");
    } else if (raceCard.id === "kurohiWelcomeSelector") {
      playerRace = "Kurohi";
      console.log("Player selected Kurohi race!");
    } else {
      playerRace = "Elf";
      console.log("Player selected Elf race!");
    }
    
    // Update the player race display
    document.getElementById("playerRaceDisplay").textContent = playerRace;
    
    // Your event handling code  welcomePopup.style.visibility = "collapse";
    welcomePopup.style.display = "none";
    welcomeScreenRaceSelector.style.visibility = 'collapse';
    elfCounselor1.style.visibility = "collapse";

    startTrees(treeCtx, cellSize)
    hideWelcomeScreen();
    startMapGeneration(gridSize, gridSize, perlinNoiseScale);
    console.log("Race card clicked!");
  });
});

newGameCustomWelcomeScreen.addEventListener("click", function () {
  welcomePopup.style.visibility = "collapse";
  welcomePopup.style.display = "none";
  welcomeScreenRaceSelector.style.visibility = 'visible';
  elfCounselor1.style.visibility = "collapse";

});

loadGameWelcomeScreen.addEventListener("click", function () {
  hideWelcomeScreen();
  startMapGeneration(gridSize, gridSize, perlinNoiseScale);
});


toggleBorders.addEventListener("click", function () {
    // Toggle the visibility
    islandsVisible = !islandsVisible;
    drawIslands(islandsVisible, islandsVisible);
    
    // Update button text to reflect current state
    toggleBorders.textContent = islandsVisible ? "Hide Islands" : "Show Islands";
});

function hideWelcomeScreen() {
  welcomePopup.style.visibility = "collapse";
  welcomeScreen.style.visibility = "collapse";
  welcomePopup.style.display = "none";
  container.style.visibility = "visible";
  tools.style.visibility = "visible";
  bottomToolBar.style.visibility = "visible";
}

//appens new toast notifications to the UI table
function addNotification(category, title, message, npcs, color) {
  const tableBody = document.querySelector("#notificationTable tbody");

  const newRow = document.createElement("tr");
  newRow.innerHTML = `
    <td>${category}</td>
    <td>${title}</td>
    <td>${message}</td>
  `;
  newRow.style.backgroundColor = color;

  tableBody.appendChild(newRow);

  // Create a notification object and push it into the global array
  const notification = {
    category: category,
    title: title,
    message: message,
    npcs: npcs,
    color: color
  };
  
// Check if the table has more than 30 rows
const maxRows = 30;
if (tableBody.children.length > maxRows) {
  // Remove the last row(s) until the row count is 30
  while (tableBody.children.length > maxRows) {
    tableBody.removeChild(tableBody.children[0]); // Remove the first row
  }
}

gameNotificationsTableHeader.textContent = `${tableBody.children.length} Notifications`

}

// UI Tester button - shows UI without rendering game map
document.getElementById("uiTesterWelcomeScreen").addEventListener("click", function() {
  hideWelcomeScreen();
  
  // Make UI elements visible
  container.style.visibility = "visible";
  tools.style.visibility = "visible";
  bottomToolBar.style.visibility = "visible";
  
  // Set default tab visibility
  gameTab.style.display = "block";
  
  // Optionally update the UI with some dummy data
  updateUIbottomToolbar(10000);
  addNotification("UI Test", "UI Test Mode", "UI elements loaded without game map", [], "#4b81bf");
  
  console.log("UI Tester mode activated - showing UI without game map");
});

infoPanel.addEventListener('click', () => {
  // Toggle the visibility property
  infoPanel.style.visibility = 'collapse'
  foundNPC = false;
});

let foundNPC = false;




//npc card details
function showNPCInfo(npc) {
  const infoPanel = document.getElementById('infoPanel');
  let infoHtml = `
    Name: <strong>${npc.name}</strong><br/>
    Race: ${npc.race}<br/>
    Age: <strong>${npc.age}</strong><br/>
    #${npc.myNumber}<br/><br/>
  `;

  // Check if parents exist before adding parent information
  if (npc.parents && npc.parents.length > 0) {
    const parent = npc.parents[0];
    if (typeof parent === 'object' && parent !== null && parent.name && parent.race) {
      infoHtml += `<br/>Parent: ${parent.name}, ${parent.race}`;
    } else {
      infoHtml += `<br/>Parent: #${parent}`;
    }
  }
  if (npc.spouse) {
    infoHtml += `<br/>Married to: <strong> ${npc.spouse} 💍</strong><br/> `;
  }
  infoHtml += `<br/>Profession:<br/>${npc.profession}       
  <span style="color: green;">$ ${npc.salary}</span><br/> `;

   // Get random conversation line based on npc's race and profession
   const raceConversations = npcConversations[npc.race];
   let randomLine = "";
   
   if (raceConversations && raceConversations[npc.profession] && raceConversations[npc.profession].length > 0) {
     const conversationLines = raceConversations[npc.profession];
     const randomIndex = Math.floor(Math.random() * conversationLines.length);
     randomLine = conversationLines[randomIndex];
   }

  infoHtml += `<br/><style="font-size: 13px;">${randomLine}</style=>`;

  if (npc.children.length > 0) {
    infoHtml += `<br/><strong>${npc.children.length} kids:</strong><ul>`;
    npc.children.forEach((child) => {
      infoHtml += `<li>${child.name} - ${child.age}</li>`;
    });
    infoHtml += `</ul>`;
  }

  // Create an img element
  const imgElement = document.createElement('img');

  if (npc.gender === 'male') {
    imgElement.src = `./assets/Races/${npc.race}/male/male.png`;
  } else {
    imgElement.src = `./assets/Races/${npc.race}/female/female (3).png`;
  }



  imgElement.height = 100; // Set the height (adjust to your desired height)
  imgElement.width = 100; // Set the width (adjust to your desired width)

  // Append the img element to infoPanel
  infoPanel.innerHTML = infoHtml; // Set the content 
  infoPanel.appendChild(imgElement); // Append the image 

  // Ensure the position is updated
  npc.updateInfoPanel();

  // Make the info panel visible
  infoPanel.style.visibility = 'visible';
  infoPanel.style.display = 'block';
  //remove class disabled from creaturesCardMoveTo
  document.getElementById('walkSelectedNPCtoCell').classList.remove('disabled');
}

function centerCameraOnNPC(npc) {
/* camera.worldToScreen */

  camera.x = npc.x - camera.width / 2;
  camera.y = npc.y - camera.height / 2;
}




//todo gdp should increase based on previous loop
//gdp should be sum of all npcs professions salary
//crystal tons should increase based on previous loop
//crystla tons should be mined relative to population of Miners
//create crystal deposits
function updateUIbottomToolbar(totalSalaries) {

  function formatGDP(gdp) {
    if (gdp >= 1e9) {
      return (gdp / 1e9).toFixed(2) + " Bi"; // Convert to billions
    } else if (gdp >= 1e6) {
      return (gdp / 1e6).toFixed(2) + " M"; // Convert to millions
    } else {
      return gdp.toFixed(0); // Keep as is if less than a million
    }
  }

  yearBottomToolBar.textContent =  year;
  populationBottomToolBar.textContent = npcs.length;
  GDPbottomToolBar.textContent =  formatGDP(totalSalaries);

  crystalbottomToolBar.textContent = (npcs.length * 0.7).toFixed(0) + " tons"
  statsUIhomes.textContent = houses.length;

  currentYear.textContent = "Year: " + year;

}



function drawNearCells(ctx, x, y, color, radius) {
  const adjacentCells = [];

  // Calculate the top-left corner coordinates of the square
  const topLeftX = (x - radius) * cellSize;
  const topLeftY = (y - radius) * cellSize;

  // Calculate the width and height of the square
  const squareSize = (radius * 2 + 1) * cellSize;

  ctx.fillStyle = color;
  ctx.fillRect(topLeftX, topLeftY, squareSize, squareSize);

  for (let r = -radius; r <= radius; r++) {
    for (let c = -radius; c <= radius; c++) {
      const adjacentRow = y + r;
      const adjacentCol = x + c;

      adjacentCells.push({ row: adjacentRow, col: adjacentCol });
    }
  }

  const numRows = radius * 2 + 1; // Calculate the number of rows

  console.log("Number of Rows: " + numRows);

  console.log("Square size: " + squareSize  + " Radius: " + radius + ". Adjacent cells to this House: ", adjacentCells.length);
  return adjacentCells;
}



function drawCircle(ctx, x, y, diameter, fillColor) {
  //console.log('drawing circle')
  ctx.fillStyle = fillColor;

  // Calculate the radius based on the diameter
  const radius = diameter / 2;

  // Draw a filled circle
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}





// Function to handle zoom with Q and E keys
function setupKeyboardZoom() {
  const zoomSpeed = 0.05; // Adjust this value to control zoom speed
  
  document.addEventListener('keydown', (e) => {
    // Check if Q or E keys are pressed
    if (e.key.toLowerCase() === 'q') {
      // Increase zoom (zoom in)
      const newZoom = Math.min(camera.zoom + zoomSpeed, camera.maxZoom);
      if (newZoom !== camera.zoom) {
        camera.zoom = newZoom;
        camera.updateTransform();
      }
    } else if (e.key.toLowerCase() === 'e') {
      // Decrease zoom (zoom out)
      const newZoom = Math.max(camera.zoom - zoomSpeed, camera.minZoom);
      if (newZoom !== camera.zoom) {
        camera.zoom = newZoom;
        camera.updateTransform();
      }
    }
  });
}



// Initialize player race display when the window loads
window.addEventListener("load", function() {
  // Update the player race display with the default value
  const playerRaceDisplay = document.getElementById("playerRaceDisplay");
  if (playerRaceDisplay) {
    playerRaceDisplay.textContent = playerRace;
  }
});



// Add event listener for the R key
window.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === 'r') {
//
console.log("r key pressed - no function yet. file: uitools.js");


  }
});

// Function to close the inside building view
function closeInsideBuilding() {
  const insideBuilding = document.getElementById('insideBuilding');
  if (insideBuilding) {
    insideBuilding.style.visibility = 'collapse';
    console.log("Closed inside building view");
  }
}



  // Common method for drawing information text above NPCs
  function drawInfoText(ctx = npcInfoOverlayCtx, infoText = "---", additionalInfo, progressBar) {
    ///console.log(`drawInfoText , ctx: ${ctx} ${infoText}, ${additionalInfo.text}, ${progressBar.progress}`);

    // Draw main info text with shadow
    ctx.font = "10px Arial";
    ctx.textAlign = "center";
    
    // Draw text shadow first
    ctx.fillStyle = "rgba(0, 0, 0)";
    ctx.fillText(infoText, this.x + 1, this.y - 24);
    
    // Draw main text on top
    ctx.fillStyle = "white";
    ctx.fillText(infoText, this.x, this.y - 25);
    
    // Draw additional info if provided
    if (additionalInfo) {
      ctx.fillStyle = additionalInfo.color;
      ctx.fillText(additionalInfo.text, this.x, this.y - 45);
    }
    
    // Draw progress bar if provided
    if (progressBar && progressBar.progress !== undefined) {
      const maxWidth = progressBar.width || 20;
      const barWidth = maxWidth * progressBar.progress;
      
      // Draw background
      ctx.fillStyle = progressBar.bgColor || "rgba(0, 0, 0, 0.3)";
      ctx.fillRect(this.x - maxWidth / 2, this.y - 15, maxWidth, 3);
      
      // Draw progress
      ctx.fillStyle = progressBar.color || "orange";
      ctx.fillRect(this.x - maxWidth / 2, this.y - 15, barWidth, 3);
    }
  }
  