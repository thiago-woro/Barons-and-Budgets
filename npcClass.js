class NPC {
  constructor(x, y, myNumber, parents) {
    this.x = x * cellSize;
    this.y = y * cellSize;
    this.race = this.chooseRace();
    this.age = 0;
    this.salary = Math.floor(Math.random() * 9800);   ///TODO make this based on profession
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
    this.parents = parents || null; // Set parents to null when not provided
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
    const validAdjacentCells = adjacentCells.filter((cell) =>
      groundCells.some(
        (groundCell) => groundCell.x === cell.x && groundCell.y === cell.y
      )
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
      return;
    }

    // Update age in the table
    const ageCell = document.querySelector(
      `#npcRow-${this.myNumber} td:nth-child(2)`
    );
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



  chooseRace() {

    if (this.parents && this.parents.length > 0) {
    console.error('parents: ' + this.parents.length)

      return this.parents[0].race; // Set race to the race of the first parent
    } else {
      const race = ["Elf", "Purries", "Kurohi"];
      const randomIndex = Math.floor(Math.random() * race.length);
      return race[randomIndex];
    }
  }


  addChild(childNPC) {
    if (!this.children) {
      this.children = [];
    }
    this.children.push(childNPC);
  }

  generateProfession(age) {
    if (age < 20) {
      // Return null for professions when age is less than 20
      return null;
    }

    const raceProfessions = {
      Purries: [
        { profession: "Jester", probability: 0.05 }, // Low probability
        { profession: "Innkeeper", probability: 0.1 }, // Medium probability
        { profession: "Tailor", probability: 0.15 },
        { profession: "Knight", probability: 0.05 },
        { profession: "Archer", probability: 0.1 }, 
        { profession: "Ranger", probability: 0.1 }, 
        { profession: "Chef", probability: 0.1 },
        { profession: "Cook", probability: 0.1 }, 
        { profession: "Bard", probability: 0.1 }, 
        { profession: "Drunk", probability: 0.1 },
        { profession: "Researcher", probability: 0.1 }, 
        { profession: "Poet", probability: 0.1 }, 
        { profession: "Scientist", probability: 0.1 },  
        { profession: "Tinkerer", probability: 0.1 },
        { profession: "Miner", probability: 0.45 },
        
      ],
      Kurohi: [
        // Professions for Humans
        { profession: "Doctor", probability: 0.1 },
        { profession: "Teacher", probability: 0.15 },
        { profession: "Engineer", probability: 0.15 },
        { profession: "Artist", probability: 0.1 },
        { profession: "Builder", probability: 0.1 },
        { profession: "Cook", probability: 0.1 },
        { profession: "Sailor", probability: 0.05 },
        { profession: "Driver", probability: 0.05 },
        { profession: "Bartender", probability: 0.05 },
        { profession: "Student", probability: 0.05 },
        { profession: "Unemployed", probability: 0.05 },
        { profession: "none", probability: 0.05 },
        { profession: "Retired", probability: 0.05 },
        { profession: "Police", probability: 0.05 },
        { profession: "Nurse", probability: 0.1 },
        { profession: "Electrician", probability: 0.1 },
        { profession: "Mechanic", probability: 0.1 },
        { profession: "Lawyer", probability: 0.1 },
        { profession: "Blacksmith", probability: 0.1 },
        { profession: "Farmer", probability: 0.05 }

      ],
      Elf: [
        // Professions for Elves
        { profession: "Alchemist", probability: 0.15 },
        { profession: "Enchanter", probability: 0.15 },
        { profession: "Mage", probability: 0.15 },
        { profession: "Bard", probability: 0.1 },
        { profession: "Blacksmith", probability: 0.1 },
        { profession: "Herbalist", probability: 0.1 },
        { profession: "Hunter", probability: 0.1 },
        { profession: "Thief", probability: 0.05 },
        { profession: "Minstrel", probability: 0.1 },
        { profession: "Priest", probability: 0.1 },
        { profession: "Wizard", probability: 0.15 },
        { profession: "Sorcerer", probability: 0.15 },
        { profession: "Healer", probability: 0.1 },
        { profession: "Librarian", probability: 0.1 },
        { profession: "Scholar", probability: 0.1 },
        { profession: "Apothecary", probability: 0.1 },
        { profession: "Astrologer", probability: 0.1 },
      ],
    };

    // Get the profession array for the NPC's race
    const professionArray = raceProfessions[this.race];

    if (!professionArray) {
      // Handle the case where the race is not found
      return "Unemployed"; // Example: Return "Unemployed" if race is not found
    }

    // Calculate total probability for the race's professions
    const totalProbability = professionArray.reduce(
      (sum, profession) => sum + profession.probability,
      0
    );

    // Generate a random value within the total probability range
    const randomValue = Math.random() * totalProbability;

    // Select a profession based on the probabilities
    let cumulativeProbability = 0;
    for (const profession of professionArray) {
      cumulativeProbability += profession.probability;
      if (randomValue <= cumulativeProbability) {
        return profession.profession;
      }
    }

    // If no profession is selected, return a default or handle it as needed
    return "Unemployed"; // Example: Return "Unemployed" if nothing matches
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
}
