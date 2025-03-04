// Woodcutter profession behaviors
// This file contains all the logic for woodcutter NPCs

// State machine for woodcutter behavior
function updateWoodcutter(npc) {
  // Log current state
  console.log(`woodcutter: ${npc.name} - state=${npc.state}`);
  
  switch (npc.state) {
    case "idle":
      npc.transitionTo("findingTree");
      break;
      
    case "findingTree":
      const tree = findNearestTree(npc);
      if (tree) {
        console.log(`woodcutter: ${npc.name} found tree at ${tree.x}, ${tree.y}`);
        npc.currentPath = findPathTo(npc, tree);
        npc.pathIndex = 0;
        npc.stateData.targetTree = tree;
        npc.transitionTo("movingToTree");
      } else {
        console.log(`woodcutter: ${npc.name} couldn't find any trees!`);
        npc.transitionTo("idle");
      }
      break;
      
    case "movingToTree":
      if (followPath(npc)) {
        // Path completed
        npc.transitionTo("cuttingTree");
        npc.waitTime = npc.maxWaitTime;
      }
      break;
      
    case "cuttingTree":
      if (npc.waitTime > 0) {
        npc.waitTime--;
      } else {
        npc.transitionTo("findingHome");
      }
      break;
      
    case "findingHome":
      const home = findNearestHome(npc);
      if (home) {
        console.log(`woodcutter: ${npc.name} found home at ${home.x}, ${home.y}`);
        npc.currentPath = findPathTo(npc, home);
        npc.pathIndex = 0;
        npc.stateData.targetHome = home;
        npc.transitionTo("movingToHome");
      } else {
        console.log(`woodcutter: ${npc.name} couldn't find any homes!`);
        npc.transitionTo("idle");
      }
      break;
      
    case "movingToHome":
      if (followPath(npc)) {
        // Path completed
        npc.transitionTo("restingAtHome");
        npc.waitTime = npc.maxWaitTime;
      }
      break;
      
    case "restingAtHome":
      if (npc.waitTime > 0) {
        npc.waitTime--;
      } else {
        npc.transitionTo("findingTree");
      }
      break;
  }
}

// Draw woodcutter info based on state
function drawWoodcutterInfo(npc, ctx) {
  // Variables always at the top
  const font = "12px Arial";
  const fillColor = "black";
  
  ctx.font = font;
  ctx.fillStyle = fillColor;
  ctx.textAlign = "center";
  
  // Determine text based on current state
  let text = "";
  switch (npc.state) {
    case "idle": text = "🔍 Idle"; break;
    case "findingTree": text = "🔍 Finding tree"; break;
    case "movingToTree": text = "🚶 To tree"; break;
    case "cuttingTree": text = "🪓 Cutting"; break;
    case "findingHome": text = "🔍 Finding home"; break;
    case "movingToHome": text = "🚶 To home"; break;
    case "restingAtHome": text = "🏠 Resting"; break;
    default: text = npc.state;
  }
  
  // Draw a text shadow
  ctx.fillStyle = "white";
  ctx.fillText(text, npc.x, npc.y - 25);
  ctx.fillStyle = fillColor;
  ctx.fillText(text, npc.x, npc.y - 24);
} 