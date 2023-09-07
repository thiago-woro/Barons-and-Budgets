//game loop speed control
const gameSpeedSlider = document.getElementById("gameSpeedSlider");
const gameSpeedValue = document.getElementById("gameSpeedValue");
let gameLoopInterval = null;
let gameLoopSpeed = 3000 / parseInt(gameSpeedSlider.value); //300 = super fast  //30000 super slow

gameSpeedSlider.addEventListener("input", function () {
  const newGameSpeed = parseInt(this.value);
  gameLoopSpeed = 10000 / newGameSpeed;
  gameSpeedValue.textContent = `Game Speed: ${newGameSpeed}`;
});

startButton.addEventListener("click", function () {
  if (gameLoopInterval === null) {
    gameLoopInterval = setInterval(gameLoop, gameLoopSpeed);
    startButton.textContent = "⏸ Pause Game";
  } else {
    clearInterval(gameLoopInterval);
    gameLoopInterval = null;
    startButton.textContent = "⏯ Play";
  }
});

startColony.addEventListener("click", function () {
  startNPCs(npcCtx, cellSize);
  startButton.removeAttribute("disabled");
});

//f9
function gameLoop() {
  if (isPaused) {
    playStatusImg.style.display = "none";
    return;
  } else {
    playStatusImg.style.display = "block";
  }

  let totalSalaries = 0; // Variable to store the sum of all salaries
  let salaryCount = 0; // Variable to store the number of NPCs with salaries

  year++;
  updatePopulationChart(year, npcs.length);

  npcTableHeader.textContent = `Total Population ${npcs.length}`;

  deathsThisLoop = 0; // Reset the deaths count for this loop
  npcs.forEach((npc) => {
    npc.ageAndDie();

    // Check if NPC is older than 20 and has an empty profession
    if (!npc.profession || (npc.age >= 20 && npc.profession === "novice")) {
      // Use the generateProfession method to assign a profession
      npc.profession = npc.generateProfession(npc.age);
      npc.salary = npc.calculateSalary();

      addNotification(
        "Economy",
        `🔨 ${npc.name} is now a ${npc.profession}`,
        `Salary: $${npc.salary}`,
        npc,
        "#4a7ba8"
      );
    }

    if (npc.salary > 0) {
      totalSalaries += npc.salary;
      salaryCount++;
    }
  });

  // Calculate the medium salary (average salary) if at least one NPC has a salary
  let mediumSalary = salaryCount > 0 ? totalSalaries / salaryCount : 0;
  //  console.error(`medium salary: ${mediumSalary} total salaries: ${totalSalaries}, salary count: ${salaryCount}`);
  updateUIbottomToolbar(totalSalaries);

  coupleMaker(npcs);
  babyMaker(npcs);
  //console.log("Total: " + babies.length + " born");

  //sortNPCTable();

  clearCanvas(npcCtx);
  clearCanvas(npcInfoOverlayCtx);

  // This will move and redraw each NPC, including new babies
  const onScreenNPCS = npcs.slice(0, onScreenNPCSlimit); // Get the first XX NPCs, global variable -> onScreenNPCSlimit

  onScreenNPCS.forEach((npc) => {
    npc.move();
    drawNPC(npc, npcCtx);
  });
  

  //growthRate.textContent = populationIncreaseSpeed;
  currentPopulation.textContent = npcs.length;
  gameSpeed.textContent = "x " + gameLoopSpeed.toFixed(0);
  //economicGDP.textContent = "$ " + economicGDP;
  // console.log("End of year " + year + "🏁");

  // Game over condition
  if (npcs.length < 2) {
    console.log("Game over! Population reached below 2.");
    isPaused = true;
    playStatusImg.style.display = "none";
  }
}

//start Colony
// Assuming terrainMap and noiseValues are available in your scope

// Function to add NPC information to the table
function addNPCToTable(npc) {
  const newRow = tableBody.insertRow();
  // Assign a unique ID to the row
  newRow.id = `npcRow-${npc.myNumber}`; // <-- This line sets the ID

  const nameCell = newRow.insertCell();
  nameCell.textContent = npc.name; // Concatenate emoji and name

  const ageCell = newRow.insertCell();
  ageCell.textContent = npc.age;

  const salaryCell = newRow.insertCell();
  salaryCell.textContent = npc.salary;

  const professionCell = newRow.insertCell();
  professionCell.textContent = npc.profession;

  const myNumber = newRow.insertCell();
  myNumber.textContent = npc.myNumber;

  newRow.classList.add(npc.sex);

  // Change background color to yellow if age is below 10
  // if (npc.age < 10) { newRow.style.backgroundColor = "#b5ab62"; }

  // newRow.style.backgroundColor = npc.color;
  // Check if the table has more than 30 rows
  const maxRows = 30;
  if (tableBody.children.length > maxRows) {
    // Remove the last row
    tableBody.removeChild(tableBody.lastChild);
  }
}

function sortNPCTable() {
  const tableBody = document.querySelector("#npcTable tbody");
  const rows = Array.from(tableBody.getElementsByTagName("tr"));

  rows.sort((rowA, rowB) => {
    const ageA = parseInt(rowA.cells[1].textContent);
    const ageB = parseInt(rowB.cells[1].textContent);
    return ageA - ageB; // Compare ages for sorting
  });

  // Clear the table body and re-add the sorted rows
  tableBody.innerHTML = "";
  rows.forEach((row) => {
    tableBody.appendChild(row);
  });
  npcTableHeader.textContent = `Total Population ${npcs.length}`;
}

function coupleMaker(npcs) {
  // Function1: Filter out all male NPCs
  const maleCandidates = npcs.filter((npc) => {
    if (npc.sex === "male") {
      //console.log(	`[Rule 1] ${npc.name}, age ${npc.age}, spouse = ${npc.spouse}`);
      return true;
    }
    return false;
  });
  // console.log(`Started marrying people, Found: ${maleCandidates.length} 👨`);

  // Function2: Filter maleCandidates for ages between 22 and 40
  const ageFilteredCandidates = maleCandidates.filter((npc) => {
    if (npc.age < 22 || npc.age > 40) {
      //console.log(`[2] ${npc.name}, age ${npc.age} too old ✝.`);
      return false;
    }
    if (npc.spouse !== "" && npc.spouse !== undefined) {
      //console.log(`[Rule 2] ${npc.name} is filtered out due to having a spouse.`);
      return false;
    }
    return true;
  });

  // 3) Loop through ageFilteredCandidates and update their spouse
  ageFilteredCandidates.forEach((npc) => {
    const availableSpouses = npcs.filter((candidate) => {
      return (
        candidate.sex !== npc.sex &&
        candidate.age >= 22 &&
        candidate.age <= 40 &&
        (candidate.spouse === "" || candidate.spouse === undefined)
      );
    });

    //4) Log the length of available spouses for the current NPC
    console
      .log
      //`${npc.name} has ${availableSpouses.length} available spouses.`
      ();

    if (availableSpouses.length > 0) {
      const randomSpouse =
        availableSpouses[Math.floor(Math.random() * availableSpouses.length)];
      npc.spouse = randomSpouse.name;
      randomSpouse.spouse = npc.name;
      //TODO add to each spouse their "myNumber" - to reference their Spouse unique ID

      let couple = [npc, randomSpouse];

      addNotification(
        "Marriage",
        `${npc.name} married ${randomSpouse.name}`,
        `👰🤵`,
        couple,
        "#c197cc"
      );


      if (npcs.length < maxLandPopulation) {
        // Create a house for the married couple
        createHouseForCouple(npc, randomSpouse);
      }
    }
  });
}

function createHouseForCouple(npc1, npc2) {
  let newHouse;
  if (houses.length > 0) {
  
    newHouse = new House(npc1.x, npc1.y);
    newHouse.addInhabitant(npc1);
    newHouse.addInhabitant(npc2);
    houses.push(newHouse);
    newHouse.validateCells();
    newHouse.draw(homesCtx);
  } else {
    // If validCells is empty, create a new house at npc1's position
    newHouse = new House(npc1.x / cellSize, npc1.y / cellSize);
    newHouse.addInhabitant(npc1);
    newHouse.addInhabitant(npc2);
    houses.push(newHouse);
    newHouse.draw(homesCtx);
  }
  addNotification(
    "Economy",
    `🏡 New House built! `,
    `${newHouse.x}, ${newHouse.y}`,
    npc1,
    "#4f753c"
  );
  //console.log('last house coords:' , lastHouseCoords)
}

function babyMaker(npcs) {
  if (npcs.length >= populationLimit) {
    return;
  }

  if (npcs.length < maxLandPopulation) {
    npcs.forEach((parentNPC) => {
      if (parentNPC.spouse) {
        const spouse = npcs.find((npc) => npc.name === parentNPC.spouse);

        if (spouse && spouse.isAlive) {
          // Check the number of children the couple has
          const numberOfChildren = parentNPC.children.length;
          //TODO 🈵

          // Decrease the chance to 0 if they have 3 or more children
          const chanceOfChild = numberOfChildren < 3 ? 0.1 : 0;

          if (Math.random() < chanceOfChild) {
            let myParents = [parentNPC, spouse];

            const newChild = new NPC(
              parentNPC.x,
              parentNPC.y,
              npcs.length + 1,
              myParents
            );

            const randomIndex = Math.floor(Math.random() * groundCells.length);
            const selectedCell = groundCells[randomIndex];
            newChild.x = selectedCell.x * cellSize;
            newChild.y = selectedCell.y * cellSize;

            parentNPC.addChild(newChild); // Add child to parent's children array
            spouse.addChild(newChild); // Add child to spouse's children array
            npcs.push(newChild); // Add the new child NPC to the main NPCs array
            babies.push(newChild);

            addNPCToTable(newChild);

            addNotification(
              "Birth",
              "New Baby",
              `${newChild.name} has been born! - ${newChild.race}`
            );

            /* 
          iziToast.success({
            title: `${newChild.name} 👶`,
            message: `born to ${parentNPC.name} and ${spouse.name}! 🍼`,
            position: "topRight",
            closeOnClick: true,
            position: "bottomLeft",
            zindex: 1002,
            closeOnEscape: true,
            displayMode: 2,
            timeout: 300
          }); */
          }
        }
      }
    });
  } else {
    console.log("Max. Population reached all usable land.");
  }
}

///population chart initialize
const ctx = document.getElementById("populationChart").getContext("2d");

const populationChart = new Chart(ctx, {
  type: "line",
  data: {
    labels: [], // Years will go here
    datasets: [
      {
        label: "Population Growth",
        data: [], // Population counts will go here
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderWidth: 1,
      },
      // Add a new dataset for the median NPC age
      {
        label: "Median NPC Age",
        data: [], // Median age values will go here
        borderColor: "rgba(255, 99, 132, 1)", // Customize the color
        backgroundColor: "rgba(255, 99, 132, 0.2)", // Customize the color
        borderWidth: 1,
      },
    ],
  },
  options: {
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  },
});

function updatePopulationChart(year, population, medianAge) {
  populationChart.data.labels.push(year);
  populationChart.data.datasets[0].data.push(population);
  populationChart.data.datasets[1].data.push(medianAge); // Update median age data
  populationChart.update();
}

function startNPCs(ctx, cellSize) {
  //more suitable for Houses
  flatLandCells = groundCells.filter((cell) => {
    const noiseValue = parseFloat(cell.noise);
    return noiseValue >= 0.2 && noiseValue <= 0.245;
  });

  console.log(`From ${groundCells.length} down to  ${flatLandCells.length}`);

  // Calculate the maximum index based on the size of the groundCells array.
  const maxIndex = Math.min(30, flatLandCells.length);

  for (let i = 0; i < startingPopulation && maxIndex > 0; i++) {
    // Only select from the first 'maxIndex' cells.
    const randomIndex = Math.floor(Math.random() * maxIndex);

    const selectedCell = flatLandCells.splice(randomIndex, 1)[0];
    const npc = new NPC(selectedCell.x, selectedCell.y, cellSize, i + 1);
    npcs.push(npc);
  }

  npcs.forEach((npc) => {
    npc.age = Math.floor(Math.random() * 16) + 20;
  });

  npcs.forEach((npc) => {
    drawNPC(npc, ctx, cellSize);
    addNPCToTable(npc);
  });

  npcTableHeader.textContent = `Total Population ${npcs.length}`;
}

function drawNPC(npc, ctx) {
  ctx.textAlign = "center";
  let emoji;
  if (npc.age < 11) {
    emoji = "👶";
  } else if (npc.age > 70) {
    emoji = npc.sex === "male" ? "👴" : "👵";
  } else {
    emoji = npc.sex === "male" ? "👨" : "👩";
  }

  // Check if npc.race is equal to "Purries" and set emoji accordingly
  if (npc.race === "Purries") {
    emoji = "🐈";
  }

  if (npc.race === "Kurohi") {
    emoji = "🧛‍♂️";
  }

  ctx.font = "bold 20px Arial"; // Increase font size for the emoji
  ctx.fillText(emoji, npc.x, npc.y);
  //draw names
  const text = `${npc.name}, ${npc.age}`;
  npcInfoOverlayCtx.fillStyle = "black";
  npcInfoOverlayCtx.font = "900 15px Arial"; // Use a bolder font weight
  npcInfoOverlayCtx.fillText(text, npc.x, npc.y + 25); // Adjust Y-coordinate for the text
}

///ground work for save/load game
// Save game state
function saveGame() {
  const gameState = {
    year,
    startingPopulation,
    populationIncreaseSpeed,
    // ... other variables
    npcs, // Save the entire NPCs array
    // ... other arrays or state that needs to be saved
  };

  const gameStateString = JSON.stringify(gameState);
  localStorage.setItem("savedGameState", gameStateString);
}

// Load game state
function loadGame() {
  const savedGameStateString = localStorage.getItem("savedGameState");
  if (savedGameStateString) {
    const savedGameState = JSON.parse(savedGameStateString);

    year = savedGameState.year;
    startingPopulation = savedGameState.startingPopulation;
    populationIncreaseSpeed = savedGameState.populationIncreaseSpeed;
    // ... update other variables

    npcs = savedGameState.npcs; // Load the NPCs array
    // ... update other arrays or state that needs to be loaded

    // Update UI or game logic to reflect the loaded state
  }
}

// Call the save and load functions as needed, for example on button clicks
saveButton.addEventListener("click", saveGame);
loadGameWelcomeScreen.addEventListener("click", loadGame);
