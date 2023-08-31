let year = 0;
const startingPopulation = 20;
const populationIncreaseSpeed = 0.15;
let isPaused = false;
var deathRate = 0.001;
let npcSize = cellSize;
let babies = [];

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
    startButton.textContent = "Pause Game";
  } else {
    clearInterval(gameLoopInterval);
    gameLoopInterval = null;
    startButton.textContent = "Resume Game";
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
  document.getElementById("currentYear").textContent = "Year: " + year;
  updatePopulationChart(year, npcs.length);

  console.log(
    `Started %cYear ${year}. %cPopulation: %c${npcs.length} 👥`,
    "font-weight: bold; color: coral;",
    "font-weight: normal; color: inherit;",
    "font-weight: bold; color: green;"
  );

  npcTableHeader.textContent = `Total Population ${npcs.length}`;

  deathsThisLoop = 0; // Reset the deaths count for this loop
  npcs.forEach((npc) => {
    npc.ageAndDie();
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

  npcCtx.clearRect(0, 0, npcCanvas.width, npcCanvas.height); // Clear the canvas

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

// 2. Play Button Event Listener
document.getElementById("playButton").addEventListener("click", function () {
  isPaused = false;
  gameLoop();
  console.log("Game is running ✅");
});

// 3. Pause Button Event Listener
document.getElementById("pauseButton").addEventListener("click", function () {
  isPaused = true;
  console.log("Game paused ⏸❌");
});

class NPC {
  constructor(x, y, cellSize, myNumber) {
    this.x = x * cellSize;
    this.y = y * cellSize;
    this.age = 0;
    this.salary = Math.floor(Math.random() * 9800);
    this.sex = Math.random() < 0.5 ? "male" : "female";
    this.color = Math.random() < 0.5 ? "#ba8247" : "#a382ab";
    this.isClickable = true; // Can be toggled on or off
    this.isAlive = true; // NPC is alive when created
    this.deathAge = Math.floor(Math.random() * 80 + 20); // Age at which NPC dies
    this.name = this.generateName(); // Generate a name for the NPC
    this.spouse;
    this.profession = this.generateProfession(); // Generate a profession for the NPC
    this.movementSpeed = 1;
    this.children = []; // Array to store children
    this.emoji = this.generateRandomEmoji();
    this.myNumber = myNumber; // Sequential number for creation order
  }

  move() {
    // Find the current cell coordinates of the NPC
    const currentX = Math.floor(this.x / cellSize);
    const currentY = Math.floor(this.y / cellSize);
    // Generate the coordinates for adjacent cells
    const adjacentCells = [
      { x: currentX - 1, y: currentY },
      { x: currentX + 1, y: currentY },
      { x: currentX, y: currentY - 1 },
      { x: currentX, y: currentY + 1 },
    ];
    // Filter out cells that are not ground cells
    const validAdjacentCells = adjacentCells.filter(cell =>
      groundCells.some(groundCell => groundCell.x === cell.x && groundCell.y === cell.y)
    );
    // If there are valid adjacent ground cells to move to
    if (validAdjacentCells.length > 0) {
      // Pick a random valid adjacent cell
      const randomIndex = Math.floor(Math.random() * validAdjacentCells.length);
      const selectedCell = validAdjacentCells[randomIndex];
      // Update the NPC's position to the new cell
      this.x = selectedCell.x * cellSize;
      this.y = selectedCell.y * cellSize;
    }
  }
  
  ageAndDie() {
    this.age++; // Increment the age by 1 year
    if (this.age >= 96 || (this.age > 80 && Math.random() < deathRate)) {
      this.die();
      deathsThisLoop++; // Increment deaths count
      return
    }

     // Update age in the table
  const ageCell = document.querySelector(`#npcRow-${this.myNumber} td:nth-child(2)`);
  if (ageCell) {
    ageCell.textContent = this.age;
  }
  }

  die() {
    // Remove the NPC from the array
    npcs.splice(npcs.indexOf(this), 1);
    console.log(this.name + " dead at age " + this.age + " 💀");
  
    // Remove the NPC's row from the table
    const npcRow = document.getElementById(`npcRow-${this.myNumber}`);
    if (npcRow) {
      npcRow.remove();
    }
  }
  

  generateRandomEmoji() {
    const emojis = [
      "😀",
      "😎",
      "👩‍🌾",
      "🕺",
      "👩‍🍳",
      "👨‍🎤",
      "👨‍🚀",
      "🤖",
      "🐶",
      "🐱",
      "🦄",
    ];
    const randomIndex = Math.floor(Math.random() * emojis.length);
    return emojis[randomIndex];
  }

  addChild(childNPC) {
    if (!this.children) {
      this.children = [];
    }
    this.children.push(childNPC);
  }

  generateProfession() {
    const professions = [
      "Doctor",
      "Teacher",
      "Engineer",
      "Artist",
      "Builder",
      "Cook",
      "Sailor",
      "Driver",
      "Bartender",
      "Student",
      "Unemployed",
      "none",
      "Retired",
      "Police",
      "Nurse",
      "Electrician",
      "Mechanic",
      "Lawyer",
      "Alchemist",
      "Enchanter",
      "Mage",
      "Bard",
      "Blacksmith",
      "Herbalist",
      "Hunter",
      "Thief",
      "Minstrel",
      "Farmer",
      "Priest",
      "Wizard",
      "Sorcerer",
      "Healer",
      "Librarian",
      "Scholar",
      "Apothecary",
      "Astrologer",
      "Jester",
      "Innkeeper",
      "Tailor",
      "Knight",
      "Archer",
      "Ranger",
      "Tinkerer",
      "Scribe",
      "Falconer",
      "Shipwright",
      "Cartographer",
      "Monk",
    ];
    
    const randomProfession =
      professions[Math.floor(Math.random() * professions.length)];
    return randomProfession;
  }

 

  // Method to generate a random name based on gender
  generateName() {
    const maleNames = [
      "Thiago",
      "Davi",
      "Gustavo",
      "Julio",
      "Carlos",
      "José",
      "Javier",
      "Rafael",
      "Antonio",
      "Alejandro",
      "Carlos",
      "Sergey",
      "Grimaldo",
      "Carlos",
      "Diego",
      "Alejandro",
      "Jose",
      "Mario",
      "Antonio",
      "Javier",
      "Rafael",
      "Fernando",
      "Eduardo",
      "Juan",
      "Miguel",
      "Pedro",
      "Mateo",
      "Sebastian",
      "Manuel",
      "Francisco",
      "Ricardo",
      "Andrés",
      "John",
      "Michael",
      "William",
      "David",
      "James",
      "Robert",
      "Joseph",
      "Daniel",
      "Thomas",
      "Charles",
      "Christopher",
      "Matthew",
      "George",
      "Richard",
      "Edward",
      "Brian",
      "Steven",
      "Kevin",
      "Paul",
      "Donald",
      "Mark",
      "Anthony",
      "Jeffrey",
      "Scott",
      "Kenneth",
      "Benjamin",
      "Joshua",
      "Jason",
      "Andrew",
      "Stephen",
    ];

    const femaleNames = [
      "Esmeralda",
      "Mary",
      "Jennifer",
      "Linda",
      "Patricia",
      "Elizabeth",
      "Susan",
      "Jessica",
      "Sarah",
      "Karen",
      "Nancy",
      "Lisa",
      "Margaret",
      "Betty",
      "Dorothy",
      "Helen",
      "Sandra",
      "Donna",
      "Carol",
      "Ruth",
      "Sharon",
      "Michelle",
      "Laura",
      "Kimberly",
      "Amy",
      "Angela",
      "Melissa",
      "Rebecca",
      "Deborah",
      "Stephanie",
      "Cynthia",
    ];

    let name = "";
    if (this.sex === "male") {
      name = maleNames[Math.floor(Math.random() * maleNames.length)];
    } else if (this.sex === "female") {
      name = femaleNames[Math.floor(Math.random() * femaleNames.length)];
    } 
    // Add a random capital letter at the end of the name
    const randomCapitalLetter = String.fromCharCode(
      65 + Math.floor(Math.random() * 26)
    );
    name += " " + randomCapitalLetter + ".";

    return name;
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
  console.log(`Started marrying people, Found: ${maleCandidates.length} 👨`);

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
    console.log(
      `Candidate: ${npc.emoji} ${npc.name}, ${npc.age}, single, ${npc.profession}.`
    );
    return true;
  });
  console.log(`Found: ${ageFilteredCandidates.length} reproductive males 🤵`);

  // Loop through ageFilteredCandidates and update their spouse
  ageFilteredCandidates.forEach((npc) => {
    const availableSpouses = npcs.filter((candidate) => {
      return (
        candidate.sex !== npc.sex &&
        candidate.age >= 22 &&
        candidate.age <= 40 &&
        (candidate.spouse === "" || candidate.spouse === undefined)
      );
    });

    // Log the length of available spouses for the current NPC
    console
      .log
      //`${npc.name} has ${availableSpouses.length} available spouses.`
      ();

      if (availableSpouses.length > 0) {
        const randomSpouse =
          availableSpouses[Math.floor(Math.random() * availableSpouses.length)];
        npc.spouse = randomSpouse.name;
        randomSpouse.spouse = npc.name;
      
        // Add the NPCs (couple) to a new house
        const randomIndex = Math.floor(Math.random() * groundCells.length);
        const selectedCell = groundCells.splice(randomIndex, 1)[0]; // Select and remove a ground cell
      
        const newHouseX = selectedCell.x;
        const newHouseY = selectedCell.y;
      
        const newHouse = new House(newHouseX, newHouseY, cellSize);
        newHouse.addInhabitant(npc); // Add the first NPC to the house
        newHouse.addInhabitant(randomSpouse); // Add the second NPC to the house
      
        houses.push(newHouse);
        newHouse.draw(npcCtx, cellSize);
        console.log(`${npc.name} married ${randomSpouse.name} 👰🤵👰🤵👰🤵👰🤵`);
        console.log(`🏠🏠🏠🏠🏠🏠🏠🏠 at ${newHouseX}, ${newHouseY}`);
      }
      
    });
  }

function babyMaker(npcs) {
  npcs.forEach((parentNPC) => {
    if (parentNPC.spouse) {
      const spouse = npcs.find((npc) => npc.name === parentNPC.spouse);

      if (spouse && spouse.isAlive) {
        // Check the number of children the couple has
        const numberOfChildren =
          parentNPC.children.length + spouse.children.length;
          //TODO 🈵🈵🈵🈵🈵🈵


        // Decrease the chance to 0 if they have 3 or more children
        const chanceOfChild = numberOfChildren < 3 ? 0.1 : 0;

        if (Math.random() < chanceOfChild) {
          console.log(
            `${parentNPC.name} and ${spouse.name} are trying to make a baby... 👶🍼, \r\nThey have ${numberOfChildren}`
          );

          const newChild = new NPC(
            parentNPC.x,
            parentNPC.y,
            cellSize,
            npcs.length + 1
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

          iziToast.success({
            title: `${newChild.name} 👶`,
            message: `born to ${parentNPC.name} and ${spouse.name}! 🍼`,
            position: "topRight",
            closeOnClick: true,
            position: "bottomLeft",
            zindex: 1002,
            closeOnEscape: true,
          });
        }
      }
    }
  });
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
    const previousAge = npc.age;
    npc.age = Math.floor(Math.random() * 16) + 20;

    // console.log(`${npc.emoji} ${npc.name} age changed from ${previousAge} to ${npc.age}`);
  });

  npcs.forEach((npc) => {
    const randomIndex = Math.floor(Math.random() * groundCells.length);
    const selectedCell = groundCells[randomIndex];
    npc.x = selectedCell.x * cellSize;
    npc.y = selectedCell.y * cellSize;
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
  ctx.font = "bold 20px Arial"; // Increase font size for the emoji
  ctx.fillText(emoji, npc.x, npc.y);
  const text = `${npc.name}, ${npc.age}`;
  ctx.fillStyle = 'black';
  ctx.font = "900 15px Arial"; // Use a bolder font weight
  ctx.fillText(text, npc.x, npc.y + 25); // Adjust Y-coordinate for the text
}



