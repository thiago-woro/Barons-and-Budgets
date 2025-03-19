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
                console.log("Drowning animation complete");
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
    };

    const handleTerrainTool = (coords, toolId) => {
        console.log(`> terrain >> ${toolId}`);
        if (toolId === "terrainCardBush") placeTree(coords.cellCol, coords.cellRow, "🌳");
        if (toolId === "terrainCardTree") placeTree(coords.cellCol, coords.cellRow, "🌲");
    };

    const selectNPC = (coords) => {
        console.log("Selecting NPC at", coords);
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
        console.log("Selecting homes in the homes array, received coords:", coords);
        const foundHouse = houses.find(house => Math.floor(house.x / cellSize) === coords.cellCol && Math.floor(house.y / cellSize) === coords.cellRow);
        if (foundHouse) {
            const insideBuilding = document.getElementById('insideBuilding');
            if (insideBuilding) {
                insideBuilding.style.visibility = 'visible';
                insideBuilding.style.display = 'flex';
                populateBuildingDetails(foundHouse);
            }
        } else {
            console.log(`No house found at exact cell (${coords.cellCol}, ${coords.cellRow})`);
        }
    };

    const populateBuildingDetails = (house) => {
        container.style.visibility = 'collapse';
        container.style.display = "none";
        document.getElementById('buildingTitle').textContent = house.type || 'Building';
        let detailsHtml = `<p>ID: ${house.id || 'Unknown'}</p><p>Position: (${Math.floor(house.x / cellSize)}, ${Math.floor(house.y / cellSize)})</p>`;
        if (house.owner) detailsHtml += `<p>Owner: ${house.owner}</p>`;
        if (house.size) detailsHtml += `<p>Size: ${house.size}</p>`;
        document.getElementById('buildingDetails').innerHTML = detailsHtml;
        document.getElementById('buildingDetails').style.display = "block";
    };

//MAIN CLICK DETECTOR    THIAGO
    container.addEventListener("click", (event) => {
        if (isDragging) return;
        const coords = getClickCoordinates(event);
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