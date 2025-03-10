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


const canvasElements = [
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

document.addEventListener('DOMContentLoaded', function() {
  // Canvas initialization
  for (const canvasId of canvasElements) {
    ctxElements[canvasId] = setupCanvas(canvasId);
  }

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

  // UI Elements initialization
  const gridSizeSlider = document.getElementById("gridSizeSlider");
  const perlinNoiseScaleSlider = document.getElementById("perlinNoiseScaleSlider");
  const newGameWelcomeScreen = document.getElementById("newGameWelcomeScreen");
  const newGameCustomWelcomeScreen = document.getElementById("newGameCustomWelcomeScreen");
  const loadGameWelcomeScreen = document.getElementById("loadGameWelcomeScreen");
  const uiTesterWelcomeScreen = document.getElementById("uiTesterWelcomeScreen");
  const infoPanel = document.getElementById("infoPanel");
  const welcomePopup = document.getElementById("welcomePopup");
  const welcomeScreen = document.getElementById("welcomeScreen");
  const welcomeScreenRaceSelector = document.getElementById("welcomeScreenRaceSelector");
  const elfCounselor1 = document.getElementById("elfCounselor1");
  const container = document.getElementById("container");
  const tools = document.getElementById("tools");
  const bottomToolBar = document.getElementById("bottomToolBar");
  const gameTab = document.getElementById("gameTab");
  const statsTab = document.getElementById("statsTab");
  const chartTab = document.getElementById("chartTab");
  const npcTab = document.getElementById("npcTab");

  // Event listeners for sliders
  if (gridSizeSlider) {
    gridSizeSlider.addEventListener("input", function() {
      gridSize = parseFloat(this.value);
      updateVariables();
    });
  }

  if (perlinNoiseScaleSlider) {
    perlinNoiseScaleSlider.addEventListener("input", function() {
      perlinNoiseScale = parseFloat(this.value);
      updateVariables();
    });
  }

  // Welcome screen buttons
  if (newGameWelcomeScreen) {
    newGameWelcomeScreen.addEventListener("click", function() {
      hideWelcomeScreen();
      generateTerrainMap(gridSize, gridSize, perlinNoiseScale);
      zoomOutAnimation();
    });
  }

  // Race cards
  const raceCards = document.querySelectorAll(".race-card");
  raceCards.forEach((raceCard) => {
    raceCard.addEventListener("click", function() {
      if (welcomePopup) welcomePopup.style.display = "none";
      if (welcomeScreenRaceSelector) welcomeScreenRaceSelector.style.visibility = 'collapse';
      if (elfCounselor1) elfCounselor1.style.visibility = "collapse";
      if (treeCtx) startTrees(treeCtx, cellSize);
      hideWelcomeScreen();
      generateTerrainMap(gridSize, gridSize, perlinNoiseScale);
      console.log("Race card clicked!");
    });
  });

  if (newGameCustomWelcomeScreen) {
    newGameCustomWelcomeScreen.addEventListener("click", function() {
      if (welcomePopup) {
        welcomePopup.style.visibility = "collapse";
        welcomePopup.style.display = "none";
      }
      if (welcomeScreenRaceSelector) welcomeScreenRaceSelector.style.visibility = 'visible';
      if (elfCounselor1) elfCounselor1.style.visibility = "collapse";
    });
  }

  if (loadGameWelcomeScreen) {
    loadGameWelcomeScreen.addEventListener("click", function() {
      hideWelcomeScreen();
      generateTerrainMap(gridSize, gridSize, perlinNoiseScale);
    });
  }

  // UI Tester
  if (uiTesterWelcomeScreen) {
    uiTesterWelcomeScreen.addEventListener("click", function() {
      hideWelcomeScreen();
      
      // Make UI elements visible
      if (container) container.style.visibility = "visible";
      if (tools) tools.style.visibility = "visible";
      if (bottomToolBar) bottomToolBar.style.visibility = "visible";
      
      // Set default tab visibility
      if (gameTab) gameTab.style.display = "block";
      
      // Optionally update the UI with some dummy data
      updateUIbottomToolbar(10000);
      addNotification("UI Test", "UI Test Mode", "UI elements loaded without game map", [], "#4b81bf");
      
      console.log("UI Tester mode activated - showing UI without game map");
    });
  }

  // Info panel
  if (infoPanel) {
    infoPanel.addEventListener('click', () => {
      infoPanel.style.visibility = 'collapse'
      foundNPC = false;
    });
  }

  // NPC Canvas click handler
  if (npcCanvas) {
    npcCanvas.addEventListener("click", function(event) {
      if (window.activeTabBottomLeft !== "creatures") return;
      const rect = npcCanvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      console.log(`Click at (${x}, ${y}), Active tab: ${window.activeTabBottomLeft}`);
      for (const npc of npcs) {
        const distance = Math.sqrt((x - npc.x) ** 2 + (y - npc.y) ** 2);
        if (distance < 20) {
          console.log(`Clicked NPC: ${npc.name}`);
          showNPCInfo(npc);
          foundNPC = true;
          if (infoPanel) infoPanel.style.visibility = 'visible';
          break;
        }
      }
    });

    // NPC Canvas mousemove handler
    npcCanvas.addEventListener("mousemove", function(event) {
      if (window.activeTabBottomLeft !== "creatures") return;
      const rect = npcCanvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      for (const npc of npcs) {
        const distance = Math.sqrt((x - npc.x) ** 2 + (y - npc.y) ** 2);
        if (distance < 15) {
          document.body.style.cursor = 'pointer';
          return;
        }
      }
      document.body.style.cursor = 'default';
    });
  }

  // Bottom tabs
  const bottomTabIds = ['terrainTab', 'creaturesTab', 'budgetsTab', 'buildingsTab', 'animalsTab'];
  bottomTabIds.forEach(tabId => {
    const tabElement = document.getElementById(tabId);
    if (tabElement) {
      tabElement.addEventListener('click', () => handleBottomTabClick(tabId));
    }
  });

  // Set default active tab
  const creaturesTab = document.getElementById('creaturesTab');
  if (creaturesTab) {
    handleBottomTabClick('creaturesTab');
  }

  // Keyboard controls
  window.addEventListener("keydown", (event) => {
    if (event.key.toLowerCase() === 'r') {
      drawXOnCanvas();
    }
  });

  setupKeyboardZoom();
});

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
  // Remove active class from all bottom tabs
  const bottomTabs = document.querySelectorAll('.bottomTabs span');
  bottomTabs.forEach(tab => {
    tab.parentElement.classList.remove('active');
  });
  
  // Add active class to clicked tab
  document.getElementById(tabId).parentElement.classList.add('active');
  
  // Set global variable to the name of the tab
  window.activeTabBottomLeft = tabId.replace('Tab', '').toLowerCase();
  
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

  console.log(`Active bottom tab: ${window.activeTabBottomLeft}`);
}

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
    minimizeTabButton.textContent = "📂"; //abre pasta
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
  generateTerrainMap(gridSize, gridSize, perlinNoiseScale);
  zoomOutAnimation();
});

const raceCards = document.querySelectorAll(".race-card");

// Add an event listener to each "race-card" element
raceCards.forEach((raceCard) => {
  raceCard.addEventListener("click", function (event) {
    // Your event handling code  welcomePopup.style.visibility = "collapse";
  welcomePopup.style.display = "none";
  welcomeScreenRaceSelector.style.visibility = 'collapse';
  elfCounselor1.style.visibility = "collapse";

    startTrees(treeCtx, cellSize)
    hideWelcomeScreen();
    generateTerrainMap(gridSize, gridSize, perlinNoiseScale);
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
  generateTerrainMap(gridSize, gridSize, perlinNoiseScale);
});

function hideWelcomeScreen() {
  const welcomePopup = document.getElementById("welcomePopup");
  const welcomeScreen = document.getElementById("welcomeScreen");
  const container = document.getElementById("container");
  const tools = document.getElementById("tools");
  const bottomToolBar = document.getElementById("bottomToolBar");
  
  if (welcomePopup) {
    welcomePopup.style.visibility = "collapse";
    welcomePopup.style.display = "none";
  }
  if (welcomeScreen) welcomeScreen.style.visibility = "collapse";
  if (container) container.style.visibility = "visible";
  if (tools) tools.style.visibility = "visible";
  if (bottomToolBar) bottomToolBar.style.visibility = "visible";
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
if (uiTesterWelcomeScreen) {
  uiTesterWelcomeScreen.addEventListener("click", function() {
    hideWelcomeScreen();
    
    // Make UI elements visible
    if (container) container.style.visibility = "visible";
    if (tools) tools.style.visibility = "visible";
    if (bottomToolBar) bottomToolBar.style.visibility = "visible";
    
    // Set default tab visibility
    if (gameTab) gameTab.style.display = "block";
    
    // Optionally update the UI with some dummy data
    updateUIbottomToolbar(10000);
    addNotification("UI Test", "UI Test Mode", "UI elements loaded without game map", [], "#4b81bf");
    
    console.log("UI Tester mode activated - showing UI without game map");
  });
}

if (infoPanel) {
  infoPanel.addEventListener('click', () => {
    // Toggle the visibility property
    infoPanel.style.visibility = 'collapse'
    foundNPC = false;
  });
}

let foundNPC = false;

// Keep the existing mousemove handler with simplified functionality
if (npcCanvas) {
  npcCanvas.addEventListener("mousemove", function (event) {
    // Only show NPC info if the active tab is "creatures"
    if (window.activeTabBottomLeft !== "creatures") return;
    
    const rect = npcCanvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    for (const npc of npcs) {
      const distance = Math.sqrt((x - npc.x) ** 2 + (y - npc.y) ** 2);
      if (distance < 15) {
        // Just highlight or change cursor here if needed
        // No popup showing on mousemove
        document.body.style.cursor = 'pointer';
        return;
      }
    }
    document.body.style.cursor = 'default';
  });
}

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
    infoHtml += `<br/>Parent: ${npc.parents[0].name}, ${npc.parents[0].race}`;
  }
  if (npc.spouse) {
    infoHtml += `<br/>Married to: <strong> ${npc.spouse} 💍</strong><br/> `;
  }
  infoHtml += `<br/>Profession:<br/>${npc.profession}       
  <span style="color: green;">$ ${npc.salary}</span><br/> `;

   // Get random conversation line based on npc's profession
   const conversationLines = purryNPCConversations[npc.profession];
   let randomLine = "";
   
   if (conversationLines && conversationLines.length > 0) {
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









 

// Function to draw an X across the entire canvas when R key is pressed
function drawXOnCanvas() {
  // Get the main canvas to draw on
  const canvas = npcInfoOverlayCanvas;
  const ctx = npcInfoOverlayCtx;
  
  // Make the canvas visible
  canvas.style.visibility = 'visible';
  
  // Clear the canvas first
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Set line style
  ctx.strokeStyle = 'magenta';
  ctx.lineWidth = 3;
  
  // Draw first diagonal line (bottom-left to top-right)
  ctx.beginPath();
  ctx.moveTo(0, canvas.height);
  ctx.lineTo(canvas.width, 0);
  ctx.stroke();
  
  // Draw second diagonal line (top-left to bottom-right)
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(canvas.width, canvas.height);
  ctx.stroke();
  
  console.log("X print intersection 0,0 value: " + ctx.getImageData(0, 0, 1, 1).data[0]);
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
  
  console.log('Keyboard zoom controls initialized: Q to zoom in, E to zoom out');
}

// Initialize keyboard zoom controls when the page loads
document.addEventListener('DOMContentLoaded', () => {
  setupKeyboardZoom();
});


  const zoomOutAnimation = () => {
    const duration = 1000; 
    const start = performance.now();
    const initialZoom = camera.zoom; // Start from current camera zoom
    const targetZoom = 0.3; 

    const animateZoom = (currentTime) => {
      const elapsed = currentTime - start;
      const progress = Math.min(elapsed / duration, 1); // Ensure progress doesn't exceed 1

      // Use a smooth easing function (easeInOutQuad)
      const easedProgress = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;

      // Calculate new zoom level and apply to camera
      camera.zoom = initialZoom + (targetZoom - initialZoom) * easedProgress;
      
      // Update camera transform
      camera.updateTransform();

      if (progress < 1) {
        requestAnimationFrame(animateZoom);
      } else {
        // Animation complete
        camera.zoom = targetZoom; // Ensure final zoom level is exactly targetZoom
        
        
        camera.updateTransform();
      }
    };

    requestAnimationFrame(animateZoom);
  };

document.addEventListener('DOMContentLoaded', function() {
    function setupCanvas(canvas) {
        if (!canvas) {
            console.warn('Canvas not found');
            return null;
        }
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        return ctx;
    }

    // Initialize all canvases after DOM is loaded
    const canvases = {
        groundCanvas: document.getElementById('groundCanvas'),
        waterCanvas: document.getElementById('waterCanvas'),
        wavesCanvas: document.getElementById('wavesCanvas'),
        pathCanvas: document.getElementById('path'),
        oreDepositsCanvas: document.getElementById('oreDeposits'),
        treeCanvas: document.getElementById('treeCanvas'),
        npcInfoOverlay: document.getElementById('npcInfoOverlay'),
        boatCanvas: document.getElementById('boatCanvas'),
        animalCanvas: document.getElementById('animalCanvas'),
        npcCanvas: document.getElementById('npcCanvas'),
        homesCanvas: document.getElementById('homes')
    };

    // Setup each canvas with error handling
    Object.entries(canvases).forEach(([name, canvas]) => {
        if (canvas) {
            window[name.replace('Canvas', 'Ctx')] = setupCanvas(canvas);
        }
    });
});

function initializeUI() {
    // Event listeners for sliders
    const gridSizeSlider = document.getElementById("gridSizeSlider");
    const perlinNoiseScaleSlider = document.getElementById("perlinNoiseScaleSlider");
    
    if (gridSizeSlider) {
        gridSizeSlider.addEventListener("input", function() {
            gridSize = parseFloat(this.value);
            updateVariables();
        });
    }

    if (perlinNoiseScaleSlider) {
        perlinNoiseScaleSlider.addEventListener("input", function() {
            perlinNoiseScale = parseFloat(this.value);
            updateVariables();
        });
    }

    // Welcome screen buttons
    const newGameWelcomeScreen = document.getElementById("newGameWelcomeScreen");
    if (newGameWelcomeScreen) {
        newGameWelcomeScreen.addEventListener("click", function() {
            hideWelcomeScreen();
            generateTerrainMap(gridSize, gridSize, perlinNoiseScale);
            zoomOutAnimation();
        });
    }

    // Race cards
    const raceCards = document.querySelectorAll(".race-card");
    raceCards.forEach((raceCard) => {
        raceCard.addEventListener("click", function() {
            const welcomePopup = document.getElementById("welcomePopup");
            const welcomeScreenRaceSelector = document.getElementById("welcomeScreenRaceSelector");
            const elfCounselor1 = document.getElementById("elfCounselor1");
            
            if (welcomePopup) welcomePopup.style.display = "none";
            if (welcomeScreenRaceSelector) welcomeScreenRaceSelector.style.visibility = 'collapse';
            if (elfCounselor1) elfCounselor1.style.visibility = "collapse";
            if (treeCtx) startTrees(treeCtx, cellSize);
            hideWelcomeScreen();
            generateTerrainMap(gridSize, gridSize, perlinNoiseScale);
        });
    });

    // UI Tester
    const uiTesterWelcomeScreen = document.getElementById("uiTesterWelcomeScreen");
    if (uiTesterWelcomeScreen) {
        uiTesterWelcomeScreen.addEventListener("click", function() {
            hideWelcomeScreen();
            const container = document.getElementById("container");
            const tools = document.getElementById("tools");
            const bottomToolBar = document.getElementById("bottomToolBar");
            const gameTab = document.getElementById("gameTab");
            
            if (container) container.style.visibility = "visible";
            if (tools) tools.style.visibility = "visible";
            if (bottomToolBar) bottomToolBar.style.visibility = "visible";
            if (gameTab) gameTab.style.display = "block";
            
            updateUIbottomToolbar(10000);
            addNotification("UI Test", "UI Test Mode", "UI elements loaded without game map", [], "#4b81bf");
        });
    }

    // Info panel
    const infoPanel = document.getElementById("infoPanel");
    if (infoPanel) {
        infoPanel.addEventListener('click', () => {
            infoPanel.style.visibility = 'collapse';
            foundNPC = false;
        });
    }

    // NPC Canvas handlers
    const npcCanvas = document.getElementById("npcCanvas");
    if (npcCanvas) {
        npcCanvas.addEventListener("click", handleNPCClick);
        npcCanvas.addEventListener("mousemove", handleNPCMouseMove);
    }

    // Bottom tabs
    const bottomTabIds = ['terrainTab', 'creaturesTab', 'budgetsTab', 'buildingsTab', 'animalsTab'];
    bottomTabIds.forEach(tabId => {
        const tabElement = document.getElementById(tabId);
        if (tabElement) {
            tabElement.addEventListener('click', () => handleBottomTabClick(tabId));
        }
    });

    // Set default active tab
    const creaturesTab = document.getElementById('creaturesTab');
    if (creaturesTab) {
        handleBottomTabClick('creaturesTab');
    }
}

