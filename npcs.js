


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
    console.log('last house coords:' , lastHouseCoords)



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

