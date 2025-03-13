graph TD
    A[Game Data Structure - JSON] --> B{Save Trigger?}
    B -- Yes --> C[Serialize Game Data]
    C --> D[Write to savegame.json]
    D --> E[Show Save Complete Toast]
    B -- No --> A

    A --> F[Map Data]
    A --> G[NPCs Data]
    A --> H[Buildings Data]
    A --> I[GameState Data]

    F --> J[terrainGrid]
    F --> K[trees]
    F --> L[waterData]

    L --> M[riverPaths]
    L --> N[oceanLevel]

    G --> O[NPC Objects]
    O --> P[id]
    O --> Q[position x,y]
    O --> R[inventory]
    O --> S[profession]

    H --> T[Building Objects]
    T --> U[type]
    T --> V[position x,y]
    T --> W[completion and workers]

    I --> X[currentTime]
    I --> Y[resources]
    I --> Z[player]

    subgraph "Load Process"
        AA[loadGame from saveData] --> AB[loadMap from map]
        AA --> AC[loadNPCs from npcs]
        AA --> AD[loadBuildings from buildings]
        AA --> AE[restoreGameState from gameState]

        AB --> AF[terrainGrid <- mapData]
        AB --> AG[restoreWater from waterData]
        AB --> AH[regenerateTrees from trees]

        AC --> AI[npcs loaded via mapping function]
    end

    subgraph "Dependencies"
        AJ[radialTerrainMapGenerator.js]
        AK[buildings directory]
        AL[animalClass.js]
    end

    subgraph "TO-DO Items"
        AM[Implement restoreWater]
        AN[Add building constructors]
        AO[Add animal data tracking]
        AP[Implement error handling]
        AQ[Add compression for large maps]
    end

    AJ --> AG
    AK --> AD
    AL --> AO
