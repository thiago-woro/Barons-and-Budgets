
function setupCanvas(canvasId, width, height) {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext("2d");

  canvas.width = width; // Set canvas width to the specified width
  canvas.height = height; // Set canvas height to the specified height

  return [canvas, ctx];
}

const container = document.getElementById("canvas-content");
const containerWidth = container.offsetWidth; // Use offsetWidth instead of container
const containerHeight = container.offsetHeight; // Use offsetHeight instead of container

const [npcCanvas, npcCtx] = setupCanvas(
  "npcCanvas",
  containerWidth,
  containerHeight
);
const [groundCanvas, groundCtx] = setupCanvas(
  "groundCanvas",
  containerWidth,
  containerHeight
);

const [waterCanvas, waterCtx] = setupCanvas(
  "waterCanvas",
  containerWidth,
  containerHeight
);


const [treeCanvas, treeCtx] = setupCanvas(
  "treeCanvas",
  containerWidth,
  containerHeight
);

const [boatCanvas, boatCtx] = setupCanvas(
  "boatCanvas",
  containerWidth,
  containerHeight
);

const [minimapCanvas, minimapCtx] = setupCanvas(
  "minimap",
  containerWidth,
  containerHeight
);

const [pathCanvas, pathCtx] = setupCanvas(
  "path",
  containerWidth,
  containerHeight
);

const [npcInfoOverlayCanvas, npcInfoOverlayCtx] = setupCanvas(
  "npcInfoOverlay",
  containerWidth,
  containerHeight
);

const [oreDepositsCanvas, oreDepositsCtx] = setupCanvas(
  "oreDeposits",
  containerWidth,
  containerHeight
);
const [homesCanvas, homesCtx] = setupCanvas(
  "homes",
  containerWidth,
  containerHeight
);








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
    statsTab.style.display = "block";
    chartTab.style.display = "block";
    npcTab.style.display = "block";
    minimizeTabButton.textContent = "Hide";
    hideMenu = false;
  } else {
    hideMenu = true;
    gameTab.style.display = "none";
    statsTab.style.display = "none";
    chartTab.style.display = "none";
    npcTab.style.display = "none";
    minimizeTabButton.textContent = "Show";
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

  tableBody.appendChild(newRow);
}

//this fn show the NPC details deets
npcCanvas.addEventListener("mousemove", function (event) {
  const rect = npcCanvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  let foundNPC = false;
  for (const npc of npcs) {
    const distance = Math.sqrt((x - npc.x) ** 2 + (y - npc.y) ** 2);
    if (distance < 10) {
      // Adjust the value based on your needs
      showNPCInfo(npc);
      foundNPC = true;
      break;
    }
  }

/*   
  if (!foundNPC) {
    infoPanel.style.display = "none";
  }
 */


});

const infoPanel = document.getElementById("infoPanel");

//npc card details
function showNPCInfo(npc) {
 // infoPanel.style.left = `${npc.x}px`;
 // infoPanel.style.top = `${npc.y}px`;
 // infoPanel.style.display = "block";
  let emoji;
  if (npc.race === "Purries") {emoji = "🐈";}
  if (npc.race === "Kurohi") {emoji = "🧛‍♂️";}
  if (npc.race === "Elf") {emoji = "🧝‍♂️";}


  let infoHtml = `

  <strong>${npc.name} ${
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
    infoHtml += `Married to: <strong> ${npc.spouse} 💍</strong><br/>`;
  }

  if (npc.age > 21) {
    infoHtml += `
  ${npc.profession}      
    $ ${npc.salary}<br/>
  `;
  }

  if (npc.children.length > 0) {
    infoHtml += `<br/><strong>${npc.children.length} kids:</strong><ul>`;
    npc.children.forEach((child) => {
      infoHtml += `<li>${child.name} - ${child.age}</li>`;
    });
    infoHtml += `</ul>`;
  }
  

  infoPanel.innerHTML = infoHtml;
}



//todo gdp should increase based on previous loop
//crystal tons should increase based on previous loop
//crystla tons should be mined relative to population of Miners
//create crystal deposits
function updateUIbottomToolbar() {

  yearBottomToolBar.textContent = "Year: " + year;
  populationBottomToolBar.textContent = "Pop. " + npcs.length;
  GDPbottomToolBar.textContent = "GDP: ¥ " + (npcs.length * Math.floor(Math.random() * 9800)).toFixed(0);
  crystalbottomToolBar.textContent = "Crystallite: " + (npcs.length * 0.7).toFixed(0) + " tons"
  statsUIhomes.textContent = houses.length;

  currentYear.textContent = "Year: " + year;

}



