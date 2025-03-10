const positive = new Audio('/assets/sounds/positive.mp3');

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
  
  const stateCell = newRow.insertCell();
  const stateSpan = document.createElement('span');
  stateSpan.id = `npcState-${npc.myNumber}`;
  stateSpan.textContent = npc.state || 'idle';
  
  // Set color based on state
  switch(npc.state) {
    case 'idle':
      stateSpan.style.color = 'lightgray';
      break;
    case 'moving':
      stateSpan.style.color = 'lightblue';
      break;
    case 'working':
      stateSpan.style.color = 'orange';
      break;
    case 'harvesting':
      stateSpan.style.color = 'lightgreen';
      break;
    default:
      stateSpan.style.color = 'white';
  }
  
  stateCell.appendChild(stateSpan);

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
