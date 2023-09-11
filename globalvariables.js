//all global variables



//map generation - global variables
let cellSize = 20;
var gridSize = 20;

let terrainGrid;
let perlinNoiseScale = 0.03; //original number is 0.025
rows = 90;


let offset = 0.55; //og is 0.35
let noiseValues = [];
let terrainMap = [];
let groundCells = [];
let waterCells = [];
let trees = [];
let treePositions = [];  //array format: treePositions.push({ x, y, emoji: selectedEmoji });

let treePercentageofLand = 0.07
let usableLand = 0.045

let flatLandCells = [];




//npcs
let npcs = [];
let year = 2700;
const startingPopulation = 10;
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
let building = []
let lastHouseCoords = []
let validCells = [];


//ui
let hideMenu = true;
const gameNotifications = [];




//Mining
let oreDeposits = []




//geo
var SAND = "#b0ad58";

var WATER_SHADES = [
  "#b9e0fa", 
  "#9ecbf3", 
  "#7ab3e9", 
  "#5c91d1", 
  "#4b7cb8", 
  "#4173b0", 
  "#3d76b",
  "#84a1c8", 
  "#6b9bbf", 
  "#5690b7"
];
var LAND_SHADES = [
  "#fffdbd", 
  "#9ac558", 
  "#88b14b", 
  "#759e42", 
  "#648a3b", 
  "#547637",
  "#7fbf6e",
  "#6bb556",
  "#5aa748"
];



