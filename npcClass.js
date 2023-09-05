class NPC {
  constructor(x, y, myNumber, parents, age) {
    this.x = x * cellSize;
    this.y = y * cellSize;
    this.race = this.chooseRace();
    this.age = 0;
    this.sex = Math.random() < 0.5 ? "male" : "female";
    this.color = Math.random() < 0.5 ? "#ba8247" : "#a382ab";
    this.isClickable = true; // Can be toggled on or off
    this.isAlive = true; // NPC is alive when created
    this.deathAge = Math.floor(Math.random() * 80 + 20); // Age at which NPC dies
    this.name = this.generateName(); // Generate a name for the NPC
    this.spouse;
    this.profession = this.generateProfession(age, this.race);
    this.movementSpeed = 1;
    this.children = []; // Array to store children
    this.emoji = this.generateRandomEmoji();
    this.myNumber = myNumber; // Sequential number for creation order
    this.parents = parents || null; // Set parents to null when not provided


    if (age >= 20) {
      this.profession = this.generateProfession(this.age, this.race);
      this.salary = this.calculateSalary();
    } else {
      this.profession = "novice";
      this.salary = 0;
    }
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

  generateProfession(race) {
  
  

    const raceProfessions = {
      Purries: [
        { profession: "Jester", probability: 0.05, salary: 1000 },   // Low probability
        { profession: "Innkeeper", probability: 0.1, salary: 1200 },  // Medium probability
        { profession: "Tailor", probability: 0.15, salary: 1300 },
        { profession: "Knight", probability: 0.05, salary: 6400 },
        { profession: "Archer", probability: 0.1, salary: 5500 }, 
        { profession: "Ranger", probability: 0.1, salary: 3500 }, 
        { profession: "Chef", probability: 0.1, salary: 1600 },
        { profession: "Cook", probability: 0.1, salary: 1600 }, 
        { profession: "Bard", probability: 0.1, salary: 1700 }, 
        { profession: "Drunk", probability: 0.1, salary: 1800 },
        { profession: "Researcher", probability: 0.1, salary: 1900 }, 
        { profession: "Poet", probability: 0.1, salary: 2000 }, 
        { profession: "Scientist", probability: 0.1, salary: 5200 },  
        { profession: "Tinkerer", probability: 0.1, salary: 2400 },
        { profession: "Miner", probability: 0.45, salary: 300 },
      ],

      Kurohi: [
        { profession: "Doctor", probability: 0.1, salary: 30000 },
        { profession: "Teacher", probability: 0.15, salary: 1200 },
        { profession: "Engineer", probability: 0.15, salary: 1500 },
        { profession: "Artist", probability: 0.1, salary: 1100 },
        { profession: "Builder", probability: 0.1, salary: 1200 },
        { profession: "Cook", probability: 0.1, salary: 1000 },
        { profession: "Sailor", probability: 0.05, salary: 1000 },
        { profession: "Driver", probability: 0.05, salary: 1000 },
        { profession: "Bartender", probability: 0.05, salary: 1000 },
        { profession: "Student", probability: 0.05, salary: 1000 },
        { profession: "Unemployed", probability: 0.05, salary: 1000 },
        { profession: "none", probability: 0.05, salary: 1000 },
        { profession: "Retired", probability: 0.05, salary: 1000 },
        { profession: "Police", probability: 0.05, salary: 1000 },
        { profession: "Nurse", probability: 0.1, salary: 1300 },
        { profession: "Electrician", probability: 0.1, salary: 1500 },
        { profession: "Mechanic", probability: 0.1, salary: 1500 },
        { profession: "Lawyer", probability: 0.1, salary: 1400 },
        { profession: "Blacksmith", probability: 0.1, salary: 1200 },
        { profession: "Farmer", probability: 0.05, salary: 1100 }],
        
        Elf: [
          { profession: "Alchemist", probability: 0.15, salary: 30000 },
          { profession: "Enchanter", probability: 0.15, salary: 28000 },
          { profession: "Mage", probability: 0.15, salary: 27000 },
          { profession: "Bard", probability: 0.1, salary: 2000 },
          { profession: "Blacksmith", probability: 0.1, salary: 1500 },
          { profession: "Herbalist", probability: 0.1, salary: 1200 },
          { profession: "Hunter", probability: 0.1, salary: 1400 },
          { profession: "Thief", probability: 0.05, salary: 1000 },
          { profession: "Minstrel", probability: 0.1, salary: 19000 },
          { profession: "Priest", probability: 0.1, salary: 17000 },
          { profession: "Wizard", probability: 0.15, salary: 25000 },
          { profession: "Sorcerer", probability: 0.15, salary: 26000 },
          { profession: "Healer", probability: 0.1, salary: 8000 },
          { profession: "Librarian", probability: 0.1, salary: 1300 },
          { profession: "Scholar", probability: 0.1, salary: 1700 },
          { profession: "Apothecary", probability: 0.1, salary: 19000 },
          { profession: "Astrologer", probability: 0.1, salary: 2100 },
        ]
    };


    
// Ensure that this.race matches one of the keys in raceProfessions
if (!(this.race in raceProfessions)) {
  // Handle the case where the race is not found
  return { profession: "race not found", salary: 1000 };
}

// Get the profession array for the NPC's race
const professionArray = raceProfessions[this.race];


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
      // return { profession: profession.profession, salary: profession.salary };
        return profession.profession;
      }
    }

    // If no profession is selected, return a default or handle it as needed
    return; // Example: Return "Unemployed" if nothing matches
  }


  calculateSalary() {
    // Calculate salary based on the profession
    if (this.profession) {
      const raceProfessions = {
        Purries: [
          { profession: "Jester", probability: 0.05, salary: 1000 },   // Low probability
          { profession: "Innkeeper", probability: 0.1, salary: 1200 },  // Medium probability
          { profession: "Tailor", probability: 0.15, salary: 1300 },
          { profession: "Knight", probability: 0.05, salary: 6400 },
          { profession: "Archer", probability: 0.1, salary: 5500 }, 
          { profession: "Ranger", probability: 0.1, salary: 3500 }, 
          { profession: "Chef", probability: 0.1, salary: 1600 },
          { profession: "Cook", probability: 0.1, salary: 1600 }, 
          { profession: "Bard", probability: 0.1, salary: 1700 }, 
          { profession: "Drunk", probability: 0.1, salary: 1800 },
          { profession: "Researcher", probability: 0.1, salary: 1900 }, 
          { profession: "Poet", probability: 0.1, salary: 2000 }, 
          { profession: "Scientist", probability: 0.1, salary: 5200 },  
          { profession: "Tinkerer", probability: 0.1, salary: 2400 },
          { profession: "Miner", probability: 0.45, salary: 300 },
        ],
  
        Kurohi: [
          { profession: "Doctor", probability: 0.1, salary: 30000 },
          { profession: "Teacher", probability: 0.15, salary: 1200 },
          { profession: "Engineer", probability: 0.15, salary: 1500 },
          { profession: "Artist", probability: 0.1, salary: 1100 },
          { profession: "Builder", probability: 0.1, salary: 1200 },
          { profession: "Cook", probability: 0.1, salary: 1000 },
          { profession: "Sailor", probability: 0.05, salary: 1000 },
          { profession: "Driver", probability: 0.05, salary: 1000 },
          { profession: "Bartender", probability: 0.05, salary: 1000 },
          { profession: "Student", probability: 0.05, salary: 1000 },
          { profession: "Unemployed", probability: 0.05, salary: 1000 },
          { profession: "none", probability: 0.05, salary: 1000 },
          { profession: "Retired", probability: 0.05, salary: 1000 },
          { profession: "Police", probability: 0.05, salary: 1000 },
          { profession: "Nurse", probability: 0.1, salary: 1300 },
          { profession: "Electrician", probability: 0.1, salary: 1500 },
          { profession: "Mechanic", probability: 0.1, salary: 1500 },
          { profession: "Lawyer", probability: 0.1, salary: 1400 },
          { profession: "Blacksmith", probability: 0.1, salary: 1200 },
          { profession: "Farmer", probability: 0.05, salary: 1100 }],
          
          Elf: [
            { profession: "Alchemist", probability: 0.15, salary: 30000 },
            { profession: "Enchanter", probability: 0.15, salary: 28000 },
            { profession: "Mage", probability: 0.15, salary: 27000 },
            { profession: "Bard", probability: 0.1, salary: 2000 },
            { profession: "Blacksmith", probability: 0.1, salary: 1500 },
            { profession: "Herbalist", probability: 0.1, salary: 1200 },
            { profession: "Hunter", probability: 0.1, salary: 1400 },
            { profession: "Thief", probability: 0.05, salary: 1000 },
            { profession: "Minstrel", probability: 0.1, salary: 19000 },
            { profession: "Priest", probability: 0.1, salary: 17000 },
            { profession: "Wizard", probability: 0.15, salary: 25000 },
            { profession: "Sorcerer", probability: 0.15, salary: 26000 },
            { profession: "Healer", probability: 0.1, salary: 8000 },
            { profession: "Librarian", probability: 0.1, salary: 1300 },
            { profession: "Scholar", probability: 0.1, salary: 1700 },
            { profession: "Apothecary", probability: 0.1, salary: 19000 },
            { profession: "Astrologer", probability: 0.1, salary: 2100 },
          ]
      };
      const professionArray = raceProfessions[this.race];
      const selectedProfession = professionArray.find(
        (profession) => profession.profession === this.profession
      );

      if (selectedProfession) {
        return selectedProfession.salary;
      }
    }
    // Return 0 if the profession is not found
    return 0;
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