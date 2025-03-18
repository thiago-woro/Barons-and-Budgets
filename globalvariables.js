//all global variables

// Player's selected race - will be set to "Elf", "Kurohi", or "Purries" based on player choice
let playerRace = "Elf";
let kingdomName = "Elven Kingdom";
let playerName = "OrcXSlayer777";
let playedHours = 0;

// Global variable for mouse tracking
let isDragging = false; // Ensure isDragging is defined globally

//map generation - global variables
let cellSize = 20;
var gridSize = 10; // seems to be unused

let terrainGrid;
let perlinNoiseScale = 0.03; //original number is 0.025
rows = 200;  //maximum 300 rows recommend, mid range gpu


let offset = 0.75; //og is 0.35
let noiseValues = [];
let terrainMap = [];
let groundCells = [];
let waterCells = [];
let sandCells = [];
let trees = [];
let treePositions = [];  //array format: treePositions.push({ x, y, emoji: selectedEmoji });

let treePercentageofLand = 0.07
let usableLand = 0.045

let flatLandCells = [];

let pathCells = [];


//npcs
const NPC_LIMIT = 700; // Maximum number of NPCs allowed
let npcs = [];
let animals = [];
let huntedAnimalsCount = 0; // Track number of animals hunted by Hunter NPCs
let year = 2700;
const startingPopulation = 25;
const populationIncreaseSpeed = 0.15;
let isPaused = false;
var deathRate = 0.001;
let npcSize = cellSize;
let babies = [];
let maxLandPopulation = 100 //varies/updates according to usable land
let populationLimit = 700;  //hard limit to avoid game crashing
let onScreenNPCSlimit = 50 //limits move(), draw() to only these,
// npcs on screen still rotate because babies and deaths are processed in other loop. 
//this is done for performance mainly


//resources count
let elfWoodCount = 0;
let elfFoodCount = 0;
let elfCrystalliteCount = 0;

let purriesWoodCount = 0;
let purriesFoodCount = 0;
let purriesCrystalliteCount = 0;

let kurohiWoodCount = 0;
let kurohiFoodCount = 0;
let kurohiCrystalliteCount = 0;



//cache reusable elements
const playStatusImg = document.getElementById("playStatusImg");
const npcTableHeader = document.getElementById("npcTableHeader");
const currentPopulation = document.getElementById("currentPopulation");
const growthRate = document.getElementById("growthRate");
const gameSpeed = document.getElementById("gameSpeed");
const economicGDP = document.getElementById("economicGDP");
const tableBody = document.querySelector("#npcTable tbody");
const container = document.getElementById("container");




// Global array to store houses
let houses = [];
let buildings = []; // Array to store all buildings (farms, harbors, etc.)
let lastHouseCoords = []
let validCells = [];


//ui
let hideMenu = false;
const gameNotifications = [];




//Mining
let oreDeposits = []

let occupiedCells = []
let adjacentOreCells = [];
let freeCells = []




//geo
var SAND = "#b0ad58";

var WATER_SHADES = [
  "#c2e5f9", // Shallowest (keep original)
  "#b4ddf7", // Very shallow (keep original)
  "#a6d4f5", // Shallow (keep original)
  "#98cbf2", // Medium-shallow (keep original)
  "#7cb9ec", // Medium (keep original)
  "#5ca5e8", // Medium-deep (transition)
  "#4389e9", // Deep (as specified)
  "#3a7ad2", // Very deep (transition)
  "#3068bb"  // Deepest (as specified)
];



var LAND_SHADES = [
  "#dbd997", 
  "#9ac558", 
  "#88b14b", 
  "#759e42", 
  "#648a3b", 
  "#547637",
  "#7fbf6e",

];



//#b3b18f


  //og sand color very happy tone      "#fffdbd",