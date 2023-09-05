//all global variables



//map generation - global variables
let cellSize = 12;
var gridSize = 200;

let terrainGrid;
let perlinNoiseScale = 0.03; //original number is 0.025

let offset = 0.55; //og is 0.35
let noiseValues = [];
let terrainMap = [];
let groundCells = [];
let waterCells = [];
let trees = [];
let treePercentageofLand = 0.07
let usableLand = 0.045


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
let populationLimit = 300;  //hard limit to avoid game chrash

// Global array to store houses
let houses = [];
let building = []


//ui
let hideMenu = true;

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



