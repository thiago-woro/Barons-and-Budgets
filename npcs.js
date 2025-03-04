const positive = new Audio('/assets/sounds/positive.mp3');

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
        candidate.age <= 54 &&
        (candidate.spouse === "" || candidate.spouse === undefined) &&
        candidate.race === npc.race // Added race constraint - must be same race
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
        `👰🤵 (${npc.race})`, // Added race to notification
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

let pathCellIndex = 0; // Initialize the path cell index

function createHouseForCouple(npc1, npc2) {
  if (pathCellIndex < pathCells.length) {
    // Get the current path cell based on the index
    const currentCell = pathCells[pathCellIndex];

    // Create a house for the couple at the current cell's position
    const newHouse = new House(currentCell.x, currentCell.y);

    // Store the path cell index in the house object
    newHouse.pathCellIndex = pathCellIndex;

    newHouse.addInhabitant(npc1);
    newHouse.addInhabitant(npc2);
    houses.push(newHouse);
    newHouse.draw(homesCtx)

    // Generate a random increment value between 1 and 6 (inclusive)
const randomIncrement = Math.floor(Math.random() * 7) + 2;

// Increment the path cell index for the next house with the random value
pathCellIndex = pathCellIndex + randomIncrement;


    addNotification(
      "Economy",
      `🏡 New House built! `,
      `${newHouse.x}, ${newHouse.y}`,
      npc1,
      "#4f753c"
    );
  //  console.log('last house coords:' , lastHouseCoords)



  } else {
    console.log('All path cells have houses.');
  }

 
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
            
            // Determine which parent is the mother (female)
            const mother = parentNPC.sex === "female" ? parentNPC : spouse;
            
            // Get the mother's current position
            const motherX = Math.floor(mother.x / cellSize);
            const motherY = Math.floor(mother.y / cellSize);
            
            // Calculate baby position (1 cell below the mother)
            const babyY = motherY + 1;
            
            // Create the baby at the mother's position
            const newChild = new NPC(
              motherX,
              babyY,
              npcs.length + 1,
              myParents
            );
            
            // Verify the position is on land, otherwise find a nearby land cell
            if (!isLandCell(motherX, babyY)) {
              console.log(`Baby position not on land, finding nearby land cell`);
              
              // Try to find a nearby land cell
              const nearbyLandCells = [];
              
              // Check cells in a small radius around the mother
              for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                  if (dx === 0 && dy === 0) continue; // Skip mother's position
                  
                  const checkX = motherX + dx;
                  const checkY = motherY + dy;
                  
                  if (isLandCell(checkX, checkY)) {
                    nearbyLandCells.push({ x: checkX, y: checkY });
                  }
                }
              }
              
              // If nearby land cells found, place baby on one of them
              if (nearbyLandCells.length > 0) {
                const randomCell = nearbyLandCells[Math.floor(Math.random() * nearbyLandCells.length)];
                newChild.x = randomCell.x * cellSize;
                newChild.y = randomCell.y * cellSize;
              } else {
                // Fallback to a random ground cell if no nearby land cells
                const randomIndex = Math.floor(Math.random() * groundCells.length);
                const selectedCell = groundCells[randomIndex];
                newChild.x = selectedCell.x * cellSize;
                newChild.y = selectedCell.y * cellSize;
              }
            }

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

             //baby born sound;
             positive.play();  // Play the positive sound


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


//start npc colony
function startNPCs(ctx, cellSize) {
  // Make a copy of groundCells to work with
  const availableCells = [...groundCells];
  
  // Sort cells by position to identify different regions of the map
  // This will help us place different races in different areas
  const sortedByX = [...availableCells].sort((a, b) => a.x - b.x);
  const sortedByY = [...availableCells].sort((a, b) => a.y - b.y);
  
  // Determine the boundaries of the map
  const minX = sortedByX[0].x;
  const maxX = sortedByX[sortedByX.length - 1].x;
  const minY = sortedByY[0].y;
  const maxY = sortedByY[sortedByY.length - 1].y;
  
  // Define three distinct regions for the three races
  const regions = [
    { name: "Elf", cells: [] },
    { name: "Purries", cells: [] },
    { name: "Kurohi", cells: [] }
  ];
  
  // Assign cells to regions based on their position
  // Elves in the northwest region
  // Purries in the southeast region
  // Kurohi in the southwest region
  availableCells.forEach(cell => {
    const normalizedX = (cell.x - minX) / (maxX - minX); // 0 to 1
    const normalizedY = (cell.y - minY) / (maxY - minY); // 0 to 1
    
    // Check which region this cell belongs to
    if (normalizedX < 0.4 && normalizedY < 0.4) {
      // Northwest region - Elves
      regions[0].cells.push(cell);
    } else if (normalizedX > 0.6 && normalizedY > 0.6) {
      // Southeast region - Purries
      regions[1].cells.push(cell);
    } else if (normalizedX < 0.4 && normalizedY > 0.6) {
      // Southwest region - Kurohi
      regions[2].cells.push(cell);
    }
  });
  
  // Calculate how many NPCs to create for each race
  const npcsPerRace = Math.floor(startingPopulation / 3);
  const remainder = startingPopulation % 3;
  
  // Create NPCs for each race in their respective regions
  let npcCount = 0;
  
  for (let i = 0; i < regions.length; i++) {
    const region = regions[i];
    const raceName = region.name;
    const raceCells = region.cells;
    
    // Skip if no cells available for this race
    if (raceCells.length === 0) continue;
    
    // Determine how many NPCs to create for this race
    const raceNPCCount = i < remainder ? npcsPerRace + 1 : npcsPerRace;
    
    for (let j = 0; j < raceNPCCount && j < raceCells.length; j++) {
      // Select a random cell from this race's region
      const randomIndex = Math.floor(Math.random() * raceCells.length);
      const selectedCell = raceCells.splice(randomIndex, 1)[0];
      
      // Create a new NPC with the predetermined race
      const npc = new NPC(selectedCell.x, selectedCell.y, cellSize, npcCount + 1);
      npc.race = raceName; // Override the random race with the region's race
      
      npcs.push(npc);
      npcCount++;
    }
  }
  
  // If we couldn't create enough NPCs due to region constraints,
  // create the remaining NPCs in any available ground cell
  if (npcCount < startingPopulation) {
    const remainingCount = startingPopulation - npcCount;
    const allAvailableCells = availableCells.filter(cell => 
      !regions.some(region => region.cells.includes(cell))
    );
    
    for (let i = 0; i < remainingCount && allAvailableCells.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * allAvailableCells.length);
      const selectedCell = allAvailableCells.splice(randomIndex, 1)[0];
      
      // For these NPCs, we'll randomly assign a race
      const races = ["Elf", "Purries", "Kurohi"];
      const randomRace = races[Math.floor(Math.random() * races.length)];
      
      const npc = new NPC(selectedCell.x, selectedCell.y, cellSize, npcCount + 1);
      npc.race = randomRace;
      
      npcs.push(npc);
      npcCount++;
    }
  }
  
  // Set random ages for all NPCs
  npcs.forEach((npc) => {
    npc.age = Math.floor(Math.random() * 16) + 20;
  });
  
  // Draw NPCs and add them to the table
  npcs.forEach((npc) => {
    drawNPC(npc, ctx, cellSize);
    addNPCToTable(npc);
  });
  
  npcTableHeader.textContent = `Total Population ${npcs.length}`;
  
  // Set zoom to 1.25 and center the camera on the first NPC
  if (npcs.length > 0) {
    // Set the zoom level to 1.25
    camera.zoom = 1.25;
    
    // Get the first NPC's position
    const firstNPC = npcs[0];
    
    // Use the NPC's position but ensure it's within the map boundaries
    // Map boundaries from custom instructions:
    // Min bounds: (-144.00, 316.00)
    // Max bounds: (4520.00, 4100.00)
    
    // Calculate the position to center on the NPC
    const containerWidth = camera.container.clientWidth;
    const containerHeight = camera.container.clientHeight;
    
    // Calculate the target position (centered on the NPC)
    let targetX = (firstNPC.x * cellSize) - (containerWidth / (2 * camera.zoom));
    let targetY = (firstNPC.y * cellSize) - (containerHeight / (2 * camera.zoom));
    
    // Define the map boundaries
    const minBoundX = -144;
    const minBoundY = 316;
    const maxBoundX = 4520;
    const maxBoundY = 4100;
    
    // Calculate the maximum allowed camera position based on boundaries and zoom
    const maxCameraX = maxBoundX - (containerWidth / camera.zoom);
    const maxCameraY = maxBoundY - (containerHeight / camera.zoom);
    
    // Clamp the camera position to stay within boundaries
    camera.position.x = Math.max(minBoundX, Math.min(targetX, maxCameraX));
    camera.position.y = Math.max(minBoundY, Math.min(targetY, maxCameraY));
    
    // Update the camera transform to apply changes
    camera.updateTransform();
  }
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

}

function drawNPCInfo(npc, ctx) {
  ctx.textAlign = "center";
  const text = `${npc.name}, ${npc.age}`;
  ctx.fillStyle = "black";
  ctx.font = "900 15px Arial";
  ctx.fillText(text, npc.x, npc.y + 25);
}
