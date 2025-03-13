/**
 * Restores NPC relationships (parents, children, spouse) after loading from saved game
 * This function handles the circular references that can't be directly serialized to JSON
 * 
 * @param {Array} npcs - Array of NPC objects with proper prototypes
 * @param {Array} npcDataArray - Array of raw NPC data from saved game
 */
function restoreNPCRelationships(npcs, npcDataArray) {
  // Log the start of the restoration process
  console.log(`Restoring relationships for ${npcs.length} NPCs...`);
  
  // Create a lookup map for faster NPC finding by myNumber
  const npcMap = new Map();
  npcs.forEach(npc => {
    npcMap.set(npc.myNumber, npc);
  });
  
  // Process each NPC to restore its relationships
  npcDataArray.forEach((npcData, index) => {
    const npc = npcs[index];
    
    // Skip if NPC is not found (should not happen)
    if (!npc) {
      console.warn(`NPC at index ${index} not found during relationship restoration`);
      return;
    }
    
    // Restore parents
    if (npcData.parentIds && Array.isArray(npcData.parentIds)) {
      npc.parents = npcData.parentIds
        .map(id => npcMap.get(id) || id) // Get NPC object or keep ID if not found
        .filter(parent => parent !== undefined);
      
      // Log warning if any parent wasn't found
      const missingParents = npcData.parentIds.filter(id => !npcMap.has(id));
      if (missingParents.length > 0) {
        console.warn(`NPC ${npc.name} (${npc.myNumber}) has missing parents: ${missingParents.join(', ')}`);
      }
    }
    
    // Restore children
    if (npcData.childrenIds && Array.isArray(npcData.childrenIds)) {
      npc.children = npcData.childrenIds
        .map(id => npcMap.get(id) || id) // Get NPC object or keep ID if not found
        .filter(child => child !== undefined);
      
      // Log warning if any child wasn't found
      const missingChildren = npcData.childrenIds.filter(id => !npcMap.has(id));
      if (missingChildren.length > 0) {
        console.warn(`NPC ${npc.name} (${npc.myNumber}) has missing children: ${missingChildren.join(', ')}`);
      }
    }
    
    // Restore spouse
    if (npcData.spouseId !== undefined) {
      npc.spouse = npcMap.get(npcData.spouseId);
      
      // Log warning if spouse wasn't found
      if (npcData.spouseId && !npc.spouse) {
        console.warn(`NPC ${npc.name} (${npc.myNumber}) has missing spouse: ${npcData.spouseId}`);
      }
    }
  });
  
  // Verify relationships are bidirectional
  verifyRelationships(npcs);
  
  console.log("NPC relationships restored successfully");
  return npcs;
}

/**
 * Verifies that relationships between NPCs are properly bidirectional
 * This helps catch any inconsistencies in the relationship data
 * 
 * @param {Array} npcs - Array of NPC objects with restored relationships
 */
function verifyRelationships(npcs) {
  // Verify parent-child relationships
  npcs.forEach(npc => {
    // Check if this NPC is in all its children's parents array
    if (npc.children && npc.children.length > 0) {
      npc.children.forEach(child => {
        if (typeof child === 'object' && child !== null && Array.isArray(child.parents)) {
          if (!child.parents.some(parent => parent === npc)) {
            console.warn(`Relationship inconsistency: ${npc.name} (${npc.myNumber}) is parent of ${child.name} (${child.myNumber}) but not in their parents array`);
            // Fix the relationship
            child.parents = child.parents || [];
            child.parents.push(npc);
          }
        }
      });
    }
    
    // Check if this NPC is in all its parents' children array
    if (npc.parents && npc.parents.length > 0) {
      npc.parents.forEach(parent => {
        if (typeof parent === 'object' && parent !== null && Array.isArray(parent.children)) {
          if (!parent.children.some(child => child === npc)) {
            console.warn(`Relationship inconsistency: ${parent.name} (${parent.myNumber}) is parent of ${npc.name} (${npc.myNumber}) but doesn't have them in children array`);
            // Fix the relationship
            parent.children = parent.children || [];
            parent.children.push(npc);
          }
        }
      });
    }
    
    // Check spouse relationship is bidirectional
    if (npc.spouse && typeof npc.spouse === 'object') {
      if (npc.spouse.spouse !== npc) {
        console.warn(`Spouse relationship inconsistency: ${npc.name} (${npc.myNumber}) has spouse ${npc.spouse.name} (${npc.spouse.myNumber}) but not vice versa`);
        // Fix the relationship
        npc.spouse.spouse = npc;
      }
    }
  });
}

// Make the function available globally
if (typeof window !== 'undefined') {
  window.restoreNPCRelationships = restoreNPCRelationships;
}
