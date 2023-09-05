




//game loop speed control
const gameSpeedSlider = document.getElementById("gameSpeedSlider");
const gameSpeedValue = document.getElementById("gameSpeedValue");
let gameLoopInterval = null;
let gameLoopSpeed = 3000 / parseInt(gameSpeedSlider.value);

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

  year++;
  updateUIbottomToolbar()
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
    
        console.log(`🚗🚗🚗🚗🚗🚗🚗🚗🚗🚗🚗🚗🚗🚗🚗🚗🚗🚗🚗🚗${npc.name} is now a ${npc.profession} with $${npc.salary}`);
      }
  });

  console.log("Total deaths this loop: " + deathsThisLoop);
  console.log(
    `%cPopulation: ${npcs.length} 👥`,
    "font-weight: 900; color: red;"
  );

  coupleMaker(npcs);
  babyMaker(npcs);
  console.log("Total: " + babies.length + " born");

  sortNPCTable()


  clearCanvas(npcCtx);
  clearCanvas(npcInfoOverlayCtx);

 
    // This will move and redraw each NPC, including new babies
    npcs.forEach(npc => {
      npc.move();
      drawNPC(npc, npcCtx);
    });

  document.getElementById("currentPopulation").textContent = npcs.length;
  document.getElementById("growthRate").textContent = populationIncreaseSpeed;
  document.getElementById("gameSpeed").textContent =
    "x " + gameLoopSpeed.toFixed(0);
  document.getElementById("economicGDP").textContent = "$ " + economicGDP;
  console.log("End of year " + year + "🏁");

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
  const tableBody = document.querySelector("#npcTable tbody");
  const newRow = tableBody.insertRow();
  // Assign a unique ID to the row
  newRow.id = `npcRow-${npc.myNumber}`; // <-- This line sets the ID

  const nameCell = newRow.insertCell();
  nameCell.textContent = npc.emoji + " " + npc.name; // Concatenate emoji and name

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
  if (npc.age < 10) {
    // newRow.style.backgroundColor = "yellow";
  }

  // newRow.style.backgroundColor = npc.color;
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
        //TODO add to each spouse their "myNumber"
      
       
        const newHouse = new House(npc.x / cellSize, npc.y / cellSize, cellSize);
        newHouse.addInhabitant(npc); // Add the first NPC to the house
        newHouse.addInhabitant(randomSpouse); // Add the second NPC to the house
      
        houses.push(newHouse);
        newHouse.draw(homesCtx);
        console.log(`${npc.name} married ${randomSpouse.name} 👰🤵👰🤵👰🤵👰🤵`);
      }
      
    });
  }

function babyMaker(npcs) {

  if (npcs.length >= populationLimit) {
    return 
  }
    
  if (npcs.length < maxLandPopulation) {

  npcs.forEach((parentNPC) => {
    if (parentNPC.spouse) {
      const spouse = npcs.find((npc) => npc.name === parentNPC.spouse);

      if (spouse && spouse.isAlive) {
        // Check the number of children the couple has
        const numberOfChildren =
          parentNPC.children.length;
          //TODO 🈵


        // Decrease the chance to 0 if they have 3 or more children
        const chanceOfChild = numberOfChildren < 3 ? 0.1 : 0;

        if (Math.random() < chanceOfChild) {
          console.log(
            `${parentNPC.name} and ${spouse.name} are trying to make a baby... 👶🍼, \r\nThey have ${numberOfChildren}`
          );

          let myParents = [parentNPC, spouse]

    console.error('parents: ' , myParents.length)
    console.dir(myParents)



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

          console.log(
            `Born: ${newChild.name}, #${newChild.myNumber}, AGE: ${newChild.age}, is born to ${parentNPC.name} and ${spouse.name}! 🍼`
          );

          addNotification("Birth", "New Baby", `${newChild.name} has been born! - ${newChild.race}`);



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
  });} else {
    console.log('Max. Population reached all usable land.')
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


//console.log("ground cells array: \n\n", groundCells, "\n\n\n")

function startNPCs(ctx, cellSize) {

  // Calculate the maximum index based on the size of the groundCells array.
  const maxIndex = Math.min(30, groundCells.length);

  for (let i = 0; i < startingPopulation && maxIndex > 0; i++) {
    // Only select from the first 'maxIndex' cells.
    const randomIndex = Math.floor(Math.random() * maxIndex);

    const selectedCell = groundCells.splice(randomIndex, 1)[0];
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
  npcInfoOverlayCtx.fillStyle = 'black';
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
  localStorage.setItem('savedGameState', gameStateString);
}

// Load game state
function loadGame() {
  const savedGameStateString = localStorage.getItem('savedGameState');
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
saveButton.addEventListener('click', saveGame);
loadGameWelcomeScreen.addEventListener('click', loadGame);
