graph TD
    A[All Functions]
    findNearestWaterCell[findNearestWaterCell]
    getDistanceFromShore[getDistanceFromShore]
    findWaterPath[findWaterPath]
    Function3[Function3]
    Function4[Function4]
    getWaterNeighbors[getWaterNeighbors]
    Function6[Function6]
    Function7[Function7]
    heuristic[heuristic]
    reconstructPath[reconstructPath]
    generateFishingSpotsForHarbor[generateFishingSpotsForHarbor]
    Function11[Function11]
    Function12[Function12]
    calculatePathsForHarbor[calculatePathsForHarbor]
    Function14[Function14]
    Function15[Function15]
    onHarborBuilt[onHarborBuilt]
    registerHarbor[registerHarbor]
    updateFisher[updateFisher]
    Function19[Function19]
    Function20[Function20]
    Function21[Function21]
    Function22[Function22]
    Function23[Function23]
    Function24[Function24]
    Function25[Function25]
    Function26[Function26]
    Function27[Function27]
    Function28[Function28]
    Function29[Function29]
    Function30[Function30]
    updateFishingBoats[updateFishingBoats]
    Function32[Function32]
    drawFishingBoats[drawFishingBoats]
    Function34[Function34]
    findRaceHarbor[findRaceHarbor]
    findHarborBeingBuilt[findHarborBeingBuilt]
    registerHarborBeingBuilt[registerHarborBeingBuilt]
    clearHarborBeingBuilt[clearHarborBeingBuilt]
    findNearestHarbor[findNearestHarbor]
    findHarborLocation[findHarborLocation]
    Function41[Function41]
    Function42[Function42]
    Function43[Function43]
    Function44[Function44]
    Function45[Function45]
    Function46[Function46]
    drawFisherInfo[drawFisherInfo]
    Function48[Function48]
    Function49[Function49]
    initializeFishingResources[initializeFishingResources]
    Function51[Function51]
    Function52[Function52]
    Function53[Function53]
    preCalculateAllPaths[preCalculateAllPaths]
    Function55[Function55]
    Function56[Function56]
    updateAndDrawFishingBoats[updateAndDrawFishingBoats]
    followWaterPath[followWaterPath]
    isWaterCell[isWaterCell]
    Function60[Function60]
    isHarborCell[isHarborCell]
    Function62[Function62]
    A --> findNearestWaterCell
    subgraph "findNearestWaterCell"
        getDistanceFromShore
    end
    A --> findNearestWaterCell
    subgraph "getDistanceFromShore"
        findWaterPath
    end
    A --> getDistanceFromShore
    subgraph "findWaterPath"
        Function3
    end
    A --> findWaterPath
    subgraph "Function3"
        Function4
    end
    A --> Function3
    subgraph "Function4"
        getWaterNeighbors
    end
    A --> Function4
    subgraph "getWaterNeighbors"
        Function6
    end
    A --> getWaterNeighbors
    subgraph "Function6"
        Function7
    end
    A --> Function6
    subgraph "Function7"
        heuristic
    end
    A --> Function7
    subgraph "heuristic"
        reconstructPath
    end
    A --> heuristic
    subgraph "reconstructPath"
        generateFishingSpotsForHarbor
    end
    A --> reconstructPath
    subgraph "generateFishingSpotsForHarbor"
        Function11
    end
    A --> generateFishingSpotsForHarbor
    subgraph "Function11"
        Function12
    end
    A --> Function11
    subgraph "Function12"
        calculatePathsForHarbor
    end
    A --> Function12
    subgraph "calculatePathsForHarbor"
        Function14
    end
    A --> calculatePathsForHarbor
    subgraph "Function14"
        Function15
    end
    A --> Function14
    subgraph "Function15"
        onHarborBuilt
    end
    A --> Function15
    subgraph "onHarborBuilt"
        registerHarbor
    end
    A --> onHarborBuilt
    subgraph "registerHarbor"
        updateFisher
    end
    A --> registerHarbor
    subgraph "updateFisher"
        Function19
    end
    A --> updateFisher
    subgraph "Function19"
        Function20
    end
    A --> Function19
    subgraph "Function20"
        Function21
    end
    A --> Function20
    subgraph "Function21"
        Function22
    end
    A --> Function21
    subgraph "Function22"
        Function23
    end
    A --> Function22
    subgraph "Function23"
        Function24
    end
    A --> Function23
    subgraph "Function24"
        Function25
    end
    A --> Function24
    subgraph "Function25"
        Function26
    end
    A --> Function25
    subgraph "Function26"
        Function27
    end
    A --> Function26
    subgraph "Function27"
        Function28
    end
    A --> Function27
    subgraph "Function28"
        Function29
    end
    A --> Function28
    subgraph "Function29"
        Function30
    end
    A --> Function29
    subgraph "Function30"
        updateFishingBoats
    end
    A --> Function30
    subgraph "updateFishingBoats"
        Function32
    end
    A --> updateFishingBoats
    subgraph "Function32"
        drawFishingBoats
    end
    A --> Function32
    subgraph "drawFishingBoats"
        Function34
    end
    A --> drawFishingBoats
    subgraph "Function34"
        findRaceHarbor
    end
    A --> Function34
    subgraph "findRaceHarbor"
        findHarborBeingBuilt
    end
    A --> findRaceHarbor
    subgraph "findHarborBeingBuilt"
        registerHarborBeingBuilt
    end
    A --> findHarborBeingBuilt
    subgraph "registerHarborBeingBuilt"
        clearHarborBeingBuilt
    end
    A --> registerHarborBeingBuilt
    subgraph "clearHarborBeingBuilt"
        findNearestHarbor
    end
    A --> clearHarborBeingBuilt
    subgraph "findNearestHarbor"
        findHarborLocation
    end
    A --> findNearestHarbor
    subgraph "findHarborLocation"
        Function41
    end
    A --> findHarborLocation
    subgraph "Function41"
        Function42
    end
    A --> Function41
    subgraph "Function42"
        Function43
    end
    A --> Function42
    subgraph "Function43"
        Function44
    end
    A --> Function43
    subgraph "Function44"
        Function45
    end
    A --> Function44
    subgraph "Function45"
        Function46
    end
    A --> Function45
    subgraph "Function46"
        drawFisherInfo
    end
    A --> Function46
    subgraph "drawFisherInfo"
        Function48
    end
    A --> drawFisherInfo
    subgraph "Function48"
        Function49
    end
    A --> Function48
    subgraph "Function49"
        initializeFishingResources
    end
    A --> Function49
    subgraph "initializeFishingResources"
        Function51
    end
    A --> initializeFishingResources
    subgraph "Function51"
        Function52
    end
    A --> Function51
    subgraph "Function52"
        Function53
    end
    A --> Function52
    subgraph "Function53"
        preCalculateAllPaths
    end
    A --> Function53
    subgraph "preCalculateAllPaths"
        Function55
    end
    A --> preCalculateAllPaths
    subgraph "Function55"
        Function56
    end
    A --> Function55
    subgraph "Function56"
        updateAndDrawFishingBoats
    end
    A --> Function56
    subgraph "updateAndDrawFishingBoats"
        followWaterPath
    end
    A --> updateAndDrawFishingBoats
    subgraph "followWaterPath"
        isWaterCell
    end
    A --> followWaterPath
    subgraph "isWaterCell"
        Function60
    end
    A --> isWaterCell
    subgraph "Function60"
        isHarborCell
    end
    A --> Function60
    subgraph "isHarborCell"
        Function62
    end
    A --> isHarborCell

classDef default fill:#000000,stroke:#90EE90,stroke-width:2px;
