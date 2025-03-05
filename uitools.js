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
];

const ctxElements = {};

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
  
  // Zoom out animation using the camera object
  const zoomOutAnimation = () => {
    console.log(`zoomOutAnimation: starting animation`);
    const duration = 1000; // 2 seconds
    const start = performance.now();
    const initialZoom = camera.zoom; // Start from current camera zoom
    const targetZoom = 0.3; // Use a more reasonable zoom level (not too extreme)

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
        
        // Center on the map based on ground cells
        if (groundCells.length > 0) {
          // Calculate the center of the ground cells
          let totalX = 0;
          let totalY = 0;
          
          for (const cell of groundCells) {
            totalX += cell.x;
            totalY += cell.y;
          }
          
          const avgX = totalX / groundCells.length;
          const avgY = totalY / groundCells.length;
          
          // Set camera position to center on these coordinates
          camera.position.x = avgX * cellSize - (container.clientWidth / (2 * camera.zoom));
          camera.position.y = avgY * cellSize - (container.clientHeight / (2 * camera.zoom));
          
          console.log(`Centering on ground cells: avgX=${avgX}, avgY=${avgY}`);
        } else {
          // Fallback to center of map if no ground cells
          const mapCenter = rows / 2;
          camera.position.x = mapCenter * cellSize - (container.clientWidth / (2 * camera.zoom));
          camera.position.y = mapCenter * cellSize - (container.clientHeight / (2 * camera.zoom));
          
          console.log(`Centering on map center: ${mapCenter}`);
        }
        
        camera.updateTransform();
        console.log(`zoomOutAnimation: complete, final zoom=${camera.zoom.toFixed(2)}`);
      }
    };

    requestAnimationFrame(animateZoom);
  };

  // Start the animation
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
  
  // Use the same zoom animation as newGameWelcomeScreen
  const zoomOutAnimation = () => {
    console.log(`zoomOutAnimation: starting animation`);
    const duration = 2000; // 2 seconds
    const start = performance.now();
    const initialZoom = camera.zoom; // Start from current camera zoom
    const targetZoom = 0.3; // Use a more reasonable zoom level (not too extreme)

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
        
        // Center on the map based on ground cells
        if (groundCells.length > 0) {
          // Calculate the center of the ground cells
          let totalX = 0;
          let totalY = 0;
          
          for (const cell of groundCells) {
            totalX += cell.x;
            totalY += cell.y;
          }
          
          const avgX = totalX / groundCells.length;
          const avgY = totalY / groundCells.length;
          
          // Set camera position to center on these coordinates
          camera.position.x = avgX * cellSize - (container.clientWidth / (2 * camera.zoom));
          camera.position.y = avgY * cellSize - (container.clientHeight / (2 * camera.zoom));
          
          console.log(`Centering on ground cells: avgX=${avgX}, avgY=${avgY}`);
        } else {
          // Fallback to center of map if no ground cells
          const mapCenter = rows / 2;
          camera.position.x = mapCenter * cellSize - (container.clientWidth / (2 * camera.zoom));
          camera.position.y = mapCenter * cellSize - (container.clientHeight / (2 * camera.zoom));
          
          console.log(`Centering on map center: ${mapCenter}`);
        }
        
        camera.updateTransform();
        console.log(`zoomOutAnimation: complete, final zoom=${camera.zoom.toFixed(2)}`);
      }
    };

    requestAnimationFrame(animateZoom);
  };

  // Start the animation
  zoomOutAnimation();
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

infoPanel.addEventListener('click', () => {
  // Toggle the visibility property
  infoPanel.style.visibility = 'collapse'
  foundNPC = false;
});

let foundNPC = false;

//this fn show the NPC details deets
npcCanvas.addEventListener("mousemove", function (event) {
  const rect = npcCanvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  for (const npc of npcs) {
    const distance = Math.sqrt((x - npc.x) ** 2 + (y - npc.y) ** 2);
    if (distance < 10) {
      showNPCInfo(npc);
      foundNPC = true;
  infoPanel.style.visibility = 'visible'
      break;
    }
  }
});



//npc card details
function showNPCInfo(npc) {
  let emoji;
  if (npc.race === "Purries") {emoji = "🐈";}
  if (npc.race === "Kurohi") {emoji = "🧛‍♂️";}
  if (npc.race === "Elf") {emoji = "🧝‍♂️";}


  // Get random conversation line based on npc's profession
  const conversationLines = purryNPCConversations[npc.profession];
  let randomLine = "";
  
  if (conversationLines && conversationLines.length > 0) {
    const randomIndex = Math.floor(Math.random() * conversationLines.length);
    randomLine = conversationLines[randomIndex];
  }

  let infoHtml = `
  <strong style="font-size: 23px;">${npc.name} ${
    npc.sex === "male" ? "♂" : "♀"
  }</strong><br/>
  Race: ${npc.race}  ${emoji}<br/>
  Age: <strong>${npc.age}</strong><br/>
  #${npc.myNumber}<br/><br/>`;
  // Check if parents exist before adding parent information
  if (npc.parents && npc.parents.length > 0) {
    infoHtml += `<br/>Parent: ${npc.parents[0].name}, ${npc.parents[0].race}`;
  }
  if (npc.spouse) {
    infoHtml += `<br/>Married to: <strong> ${npc.spouse} 💍</strong><br/> `;
  }
  infoHtml += `<br/>Profession:<br/>${npc.profession}       
  <span style="color: green;">$ ${npc.salary}</span><br/> `;

  infoHtml += `<br/><style="font-size: 13px;">${randomLine} meow.</style=>`;



  if (npc.children.length > 0) {
    infoHtml += `<br/><strong>${npc.children.length} kids:</strong><ul>`;
    npc.children.forEach((child) => {
      infoHtml += `<li>${child.name} - ${child.age}</li>`;
    });
    infoHtml += `</ul>`;
  }
  
  // Create an img element
  const imgElement = document.createElement('img');
  

  // Set the image source, height, and width
  imgElement.src = './assets/Races/purries/catgirl.png'
  imgElement.height = 100; // Set the height (adjust to your desired height)
  imgElement.width = 100; // Set the width (adjust to your desired width)
  
  // Append the img element to infoPanel
  const infoPanel = document.getElementById('infoPanel'); // Make sure to get the infoPanel element
  infoPanel.innerHTML = infoHtml; // Set the content of infoPanel
  infoPanel.appendChild(imgElement); // Append the image to infoPanel


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

  yearBottomToolBar.textContent = "Year: " + year;
  populationBottomToolBar.textContent = "Pop. " + npcs.length;
  GDPbottomToolBar.textContent = "GDP: ¥ " + formatGDP(totalSalaries);

  crystalbottomToolBar.textContent = "Crystallite: " + (npcs.length * 0.7).toFixed(0) + " tons"
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





const canvases = container.querySelectorAll("canvas");
        let translateX = 0;
        let translateY = 0;

        // Adjust the translation values based on your desired speed
        const translateSpeed = 50;

        window.addEventListener("keydown", (event) => {
            const key = event.key.toLowerCase();

            switch (key) {
                case "a":
                    translateX += translateSpeed;
                    break;
                case "d":
                    translateX -= translateSpeed;
                    break;
                case "w":
                    translateY += translateSpeed;
                    break;
                case "s":
                    translateY -= translateSpeed;
                    break;
            }

            // Apply the translation to all canvas elements
            canvases.forEach((canvas) => {
                canvas.style.transform = `translate(${translateX}px, ${translateY}px)`;
            });
        });



 

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

// Add event listener for the R key
window.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === 'r') {
    drawXOnCanvas();
  }
});

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
