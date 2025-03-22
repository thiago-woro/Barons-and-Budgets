  let selectedEmoji = '';
  let selectedToolName = '';

document.addEventListener('DOMContentLoaded', () => {
    const ToolState = {
        SELECTING: 'selecting',
        PLACING_ANIMAL: 'placing_animal',
        PLACING_BUILDING: 'placing_building',
        TERRAIN_TOOL: 'terrain_tool',
        SELECTING_NPC: 'selecting_npc'
    };

    let currentToolState = ToolState.SELECTING;
    let selectedTool = null;

 
    const removeActiveClass = (selector) => document.querySelectorAll(selector).forEach(el => el.classList.remove('active'));
    const addActiveClass = (selector, id) => document.getElementById(id).classList.add('active');

    document.querySelectorAll('.bottomCard').forEach(card => card.addEventListener('click', () => {
        const cardId = card.id;
        selectedEmoji = card.dataset.emoji;
        selectedToolName = card.dataset.text;
        removeActiveClass('.bottomCard');
        addActiveClass('.bottomCard', cardId);

        switch (window.activeTabBottomLeft) {
            case 'animals': currentToolState = ToolState.PLACING_ANIMAL; break;
            case 'buildings': currentToolState = ToolState.PLACING_BUILDING; break;
            case 'terrain': currentToolState = ToolState.TERRAIN_TOOL; break;
            case 'creatures': currentToolState = ToolState.SELECTING_NPC; break;
        }
        selectedTool = cardId;
        document.body.style.cursor = 'auto';
        //log tool
        console.log(`Tool selected: ${cardId}`);
    }));

    const getClickCoordinates = (event) => {
        const rect = container.getBoundingClientRect();
        const { x: worldX, y: worldY } = camera.screenToWorld(event.clientX - rect.left, event.clientY - rect.top);
        return { cellRow: Math.floor(worldY / cellSize), cellCol: Math.floor(worldX / cellSize), worldX, worldY };
    };

    const placeAnimal = (coords, toolId) => {
        // Check if the placement is on water
        if (!emptyCells.some(cell => cell.x === coords.cellCol && cell.y === coords.cellRow)) {
            console.log("Animal drowning in water!");
            
            // Create a temporary animal for drowning animation
            const drowningAnimal = new Animal(coords.cellCol, coords.cellRow, toolId);
            drowningAnimal.isDrowning = true; // Mark as drowning
            
            // Add to animals array temporarily so it gets drawn in animation loops
            animals.push(drowningAnimal);
            //TODO: skip the animals push array manipulation and just do the emoji animations!!!!!!!!
            
            // Show drowning animation
            drowningAnimal.animateEmoji('drown', drowningAnimal.emoji, 1500);
            
            // Force an immediate redraw
            animalCtx.clearRect(0, 0, animalCanvas.width, animalCanvas.height);
            animals.forEach(animal => animal.draw(animalCtx));
            
            // After animation completes, remove the drowning animal
            setTimeout(() => {
                const index = animals.indexOf(drowningAnimal);
                if (index > -1) {
                    animals.splice(index, 1);
                }
                animalCtx.clearRect(0, 0, animalCanvas.width, animalCanvas.height);
                animals.forEach(animal => animal.draw(animalCtx));
            }, 2000);
            
            return;
        }

        // Generate a random age between 15-90% of the animal's lifespan
        const maxAge = toolId.includes('Coyote') || toolId.includes('Bear') ? 
            Animal.PREDATOR_MAX_AGE : Animal.MAX_AGE;
        const randomAge = Math.floor(Math.random() * (maxAge * 0.9 - maxAge * 0.15) + maxAge * 0.15);
        
        animals.push(new Animal(coords.cellCol, coords.cellRow, toolId, randomAge));
        animalCtx.clearRect(0, 0, animalCanvas.width, animalCanvas.height);
        animals.forEach(animal => animal.draw(animalCtx));
        console.log("Placed animal:", animals[animals.length - 1]);
    };

    const placeBuilding = (coords, toolId) => {
        console.log(`Placing building: ${toolId} at`, coords);
        buildings.push(new Building(coords.cellCol, coords.cellRow, cellSize, null, toolId));
        
        // Clear and redraw buildings on the canvas, similar to animals
        homesCtx.clearRect(0, 0, animalCanvas.width, animalCanvas.height);
        buildings.forEach(building => building.draw(homesCtx));
        console.log("Placed building:", buildings[buildings.length - 1]);
    };

    const handleTerrainTool = (coords, toolId) => {
        console.log(`> terrain >> ${toolId}`);
        if (toolId === "terrainCardBush") placeTree(coords.cellCol, coords.cellRow, "🌳");
        if (toolId === "terrainCardTree") placeTree(coords.cellCol, coords.cellRow, "🌲");
        if (toolId === "terrainCardPath") viewPath(coords);
    };

    const selectNPC = (coords) => {
        console.log("Selecting NPC at", coords.cellCol, coords.cellRow,  coords);
        for (const npc of npcs) {
            if (npc.x === coords.cellCol && npc.y === coords.cellRow) {
                console.log("Found NPC at", coords);
                alert("NPC found at", coords);
                break;
            }
        }
    };

    const placeNPC = (coords, toolId) => {
        console.log(`Placing NPC of type: ${toolId} at`, coords);
        // Assuming you have a NPC class and a way to determine the NPC type based on toolId
        npcs.push(new NPC(coords.cellCol, coords.cellRow, npcs.length, null, 0));
        //draw
        npcCanvas.getContext('2d').clearRect(0, 0, npcCanvas.width, npcCanvas.height);
    };

    const selectBuilding = (coords) => {
        console.log("Selecting buildings or houses at coords:", coords);
        
        // First, check in the houses array
        const foundHouse = houses.find(house => 
            Math.floor(house.x / cellSize) === coords.cellCol && 
            Math.floor(house.y / cellSize) === coords.cellRow
        );
        
        // Then, check in the buildings array if no house was found
        const foundBuilding = !foundHouse ? buildings.find(building => 
            Math.floor(building.x / cellSize) === coords.cellCol && 
            Math.floor(building.y / cellSize) === coords.cellRow
        ) : null;
        
        // Use either the found house or building
        const foundStructure = foundHouse || foundBuilding;
        
        if (foundStructure) {
            const insideBuilding = document.getElementById('insideBuilding');
            if (insideBuilding) {
                insideBuilding.style.visibility = 'visible';
                insideBuilding.style.display = 'flex';
                populateBuildingDetails(foundStructure);
            }
        } else {
            console.log(`No building or house found at cell (${coords.cellCol}, ${coords.cellRow})`);
        }
    };

    const populateBuildingDetails = (structure) => {
        container.style.visibility = 'collapse';
        container.style.display = "none";
        
        // Determine if it's a house or a building
        const isHouse = houses.includes(structure);
        const structureType = isHouse ? (structure.type || 'House') : (structure.type || 'Building');
        
        document.getElementById('buildingTitle').textContent = structureType;
        
        // Common details
        let detailsHtml = `
            <p>Type: ${structureType}</p>
            <p>Position: (${isHouse ? Math.floor(structure.x / cellSize) : structure.x}, 
                         ${isHouse ? Math.floor(structure.y / cellSize) : structure.y})</p>
        `;
        
        // Additional details based on structure type
        if (structure.owner) detailsHtml += `<p>Owner: ${structure.owner}</p>`;
        if (structure.size) detailsHtml += `<p>Size: ${structure.size}</p>`;
        if (structure.id) detailsHtml += `<p>ID: ${structure.id}</p>`;
        
        // Add building-specific details if available
        if (!isHouse) {
            if (structure.buildingType) detailsHtml += `<p>Building Type: ${structure.buildingType}</p>`;
            if (structure.resources) detailsHtml += `<p>Resources: ${structure.resources}</p>`;
        }
        
        document.getElementById('buildingDetails').innerHTML = detailsHtml;
        document.getElementById('buildingDetails').style.display = "block";
        //old code




  console.log('importing rooms');


        //new code
        //import interior
    fetch('buildings/interior.html')
      .then(res => res.text())
      .then(html => {
        let temp = document.createElement('div');
        temp.innerHTML = html;

        // move non-script nodes into existing #interior
        let interior = document.getElementById('buildingDetails');
        Array.from(temp.childNodes).forEach(node => {
          if (node.tagName !== 'SCRIPT') {
            interior.appendChild(node);
          }
        });

        // evaluate scripts in global scope
        Array.from(temp.querySelectorAll('script')).forEach(script => {
          let newScript = document.createElement('script');
          if (script.src) {
            newScript.src = script.src;
          } else {
            newScript.textContent = script.textContent;
          }
          document.head.appendChild(newScript);
        });
      })
      .then(() => {
        console.log('rooms imported');
          //generate rooms1
  console.log('generating rooms');
  severalRooms(3); // Default to 3 rooms
      });
  

    
  
  




    };

//MAIN CLICK DETECTOR    THIAGO
    container.addEventListener("click", (event) => {
        if (isDragging) return;
        const coords = getClickCoordinates(event); //NEVER MODIFY THE getClickCoordinates function.
        switch (currentToolState) {
            case ToolState.PLACING_ANIMAL: placeAnimal(coords, selectedTool); break;
            case ToolState.PLACING_BUILDING: selectedTool === "buildingsCardSelectTool" ? selectBuilding(coords) : placeBuilding(coords, selectedTool); break;
            case ToolState.TERRAIN_TOOL: handleTerrainTool(coords, selectedTool); break;
            case ToolState.SELECTING_NPC: selectedTool === "creaturesCardSelectTool" ? selectNPC(coords) : placeNPC(coords, selectedTool); break;
        }
    });

    document.getElementById('closeBuildingButton').addEventListener('click', () => {
        document.getElementById('insideBuilding').style.display = 'none';
        container.style.display = "block";
        container.style.visibility = 'visible';
    });

    function setActiveAnimalCard(name, emoji) {
        removeActiveClass('#animalsRow .bottomCard');
        const card = document.querySelector(`#animalsRow .bottomCard#creaturesCard${name}`);
        if (card) {
            card.classList.add('active');
            document.body.style.cursor = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><text x="0" y="24" font-size="14">${emoji}</text></svg>'), auto`;
            window.activeTabBottomLeft = "animals";
        } else {
            document.body.style.cursor = 'auto';
        }
    }

    document.querySelectorAll('#animalsRow .bottomCard').forEach(c => c.addEventListener('click', function() {
        setActiveAnimalCard(this.id.replace('creaturesCard', ''), this.querySelector('h3').textContent.trim());
    }));

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.bottomTabs') && window.activeTabBottomLeft !== "animals") {
            document.body.style.cursor = 'auto';
        }
    });

    document.querySelectorAll('#leftMenuHeaderTabs .bottomTabs span').forEach(tab => {
        tab.addEventListener('click', () => {
            window.activeTabBottomLeft = tab.id.replace('Tab', '').toLowerCase();
            removeActiveClass('#leftMenuHeaderTabs .bottomTabs');
            tab.parentElement.classList.add('active');
            ['terrainRow', 'creaturesRow', 'animalsRow', 'budgetsRow', 'buildingsRow'].forEach(rowId => {
                document.getElementById(rowId).style.display = rowId.replace('Row', '').toLowerCase() === window.activeTabBottomLeft ? 'flex' : 'none';
            });
            document.body.style.cursor = 'auto';
            console.log(`Tool tab selected: ${window.activeTabBottomLeft}`)
        });
    });
});

// A* pathfinding algorithm to find a path between two cells
function findPath(start, target) {
    // Helper function to calculate Manhattan distance heuristic
    const heuristic = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    
    // Helper function to check if a cell is walkable
    const isWalkable = (x, y) => {
        // Check if cell is within grid bounds
        if (x < 0 || y < 0 || x >= rows || y >= rows) {
            return false;
        }
        
        // Check if cell is not water (is in emptyCells)
        const cellInEmptyCells = emptyCells.some(cell => cell.x === x && cell.y === y);
        
        // Check if cell is occupied by a tree
        // Trees are stored with pixel coordinates, so we need to convert grid coordinates to pixel
        // Trees are centered at (x+0.5)*cellSize, (y+0.5)*cellSize
        const treePresent = treePositions.some(tree => {
            // Convert tree's pixel coordinates back to grid coordinates
            const treeGridX = Math.floor(tree.x / cellSize);
            const treeGridY = Math.floor(tree.y / cellSize);
            return treeGridX === x && treeGridY === y;
        });
        
        // A cell is walkable if it's in emptyCells AND doesn't have a tree
        return cellInEmptyCells && !treePresent;
    };
    
    // Create open and closed sets
    const openSet = [];
    const closedSet = [];
    
    // Add start node to open set
    openSet.push({
        x: start.x,
        y: start.y,
        g: 0,                          // Cost from start to current node
        h: heuristic(start, target),   // Estimated cost from current to target
        f: heuristic(start, target),   // Total cost (g + h)
        parent: null                   // Reference to parent node
    });
    
    // While there are nodes to explore
    while (openSet.length > 0) {
        // Sort openSet by f score (lowest first)
        openSet.sort((a, b) => a.f - b.f);
        
        // Get the node with lowest f score
        const current = openSet.shift();
        
        // Add current to closed set
        closedSet.push(current);
        
        // If reached the target
        if (current.x === target.x && current.y === target.y) {
            // Reconstruct the path
            const path = [];
            let temp = current;
            
            while (temp !== null) {
                path.push({ x: temp.x, y: temp.y });
                temp = temp.parent;
            }
            
            // Return the path in reverse (from start to target)
            return path.reverse();
        }
        
        // Get neighboring cells
        const neighbors = [
            { x: current.x - 1, y: current.y },     // Left
            { x: current.x + 1, y: current.y },     // Right
            { x: current.x, y: current.y - 1 },     // Up
            { x: current.x, y: current.y + 1 }      // Down
        ];
        
        for (const neighbor of neighbors) {
            // Skip if not walkable or in closed set
            if (!isWalkable(neighbor.x, neighbor.y) || 
                closedSet.some(n => n.x === neighbor.x && n.y === neighbor.y)) {
                continue;
            }
            
            // Calculate g score for this neighbor
            const gScore = current.g + 1; // Assuming cost of 1 to move to adjacent cell
            
            // Check if neighbor is already in open set
            const existingNeighborIndex = openSet.findIndex(n => 
                n.x === neighbor.x && n.y === neighbor.y
            );
            
            if (existingNeighborIndex === -1) {
                // Not in open set, add it
                openSet.push({
                    x: neighbor.x,
                    y: neighbor.y,
                    g: gScore,
                    h: heuristic(neighbor, target),
                    f: gScore + heuristic(neighbor, target),
                    parent: current
                });
            } else if (gScore < openSet[existingNeighborIndex].g) {
                // Already in open set, but this path is better
                openSet[existingNeighborIndex].g = gScore;
                openSet[existingNeighborIndex].f = gScore + openSet[existingNeighborIndex].h;
                openSet[existingNeighborIndex].parent = current;
            }
        }
    }
    
    // No path found
    return null;
}

// Variable to store the start cell for pathfinding
let pathStart = null;

// Function to handle path visualization when using the path tool
function viewPath(coords) {
    if (!pathStart) {
        // First click - set start cell
        pathStart = { x: coords.cellCol, y: coords.cellRow };
        console.log("Path start cell selected:", pathStart);
    } else {
        // Second click - set target cell and calculate path
        const target = { x: coords.cellCol, y: coords.cellRow };
        console.log("Path target cell selected:", target);
        
        // Calculate path using A* algorithm
        const path = findPath(pathStart, target);
        
        if (path) {
            console.log("Path found:", path);
            
            // Clear previous paths
            boatCtx.clearRect(0, 0, boatCtx.canvas.width, boatCtx.canvas.height);
            
            // Draw path as purple line
            boatCtx.strokeStyle = "#8A2BE2"; // Purple color
            boatCtx.lineWidth = 2;
            boatCtx.beginPath();
            
            // Move to the first point
            const firstCell = path[0];
            boatCtx.moveTo(
                (firstCell.x * cellSize) + (cellSize / 2), 
                (firstCell.y * cellSize) + (cellSize / 2)
            );
            
            // Draw lines to each subsequent point
            for (let i = 1; i < path.length; i++) {
                const cell = path[i];
                boatCtx.lineTo(
                    (cell.x * cellSize) + (cellSize / 2), 
                    (cell.y * cellSize) + (cellSize / 2)
                );
            }
            
            boatCtx.stroke();
        } else {
            console.log("No path found between start and target");
            
            // Clear previous paths when no path is found
            boatCtx.clearRect(0, 0, boatCtx.canvas.width, boatCtx.canvas.height);
        }
        
        // Reset the start cell for the next path
        pathStart = null;
    }
}