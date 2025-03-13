const fs = require('fs');
const path = require('path');

let allFunctions = [];
let allVariables = [];
let functionVariableRelations = {};
let globalVariables = [];

function findFunctions(fileContent) {
  const functionMatches = [...fileContent.matchAll(/function\s+(\w+)\s*\(/g)];
  allFunctions = functionMatches.map(match => ({ name: match[1] }));
  allFunctions.forEach(func => functionVariableRelations[func.name] = []);
  return functionMatches;
}

function findVariables(fileContent) {
  const variableMatches = [
    ...fileContent.matchAll(/(var|let|const)\s+(\w+)\s*=/g)
  ];
  allVariables = variableMatches.map(match => ({ name: match[2] }));
  return variableMatches;
}

function analyzeVariableScope(fileContent) {
    allFunctions.forEach(func => {
        const functionRegex = new RegExp(`function\\s+${func.name}\\s*\\([^)]*\\)\\s*\\{([\\s\\S]*?)\\}`, 'g');
        const functionBodyMatch = functionRegex.exec(fileContent);
        if (functionBodyMatch && functionBodyMatch[1]) {
            const functionBody = functionBodyMatch[1];
            allVariables.forEach(variable => {
                const variableRegex = new RegExp(`\\b${variable.name}\\b`, 'g');
                if (variableRegex.test(functionBody)) {
                    functionVariableRelations[func.name].push(variable.name);
                }
            });
        }
    });

    const globalVariableMatches = [...fileContent.matchAll(/(var|let|const)\s+(\w+)\s*=/g)];
    globalVariableMatches.forEach(match => {
        let isGlobal = true;
        allFunctions.forEach(func => {
            const functionRegex = new RegExp(`function\\s+${func.name}\\s*\\([^)]*\\)\\s*\\{([\\s\\S]*?)\\}`, 'g');
            const functionBodyMatch = functionRegex.exec(fileContent);
            if (functionBodyMatch && functionBodyMatch[1]) {
                const functionBody = functionBodyMatch[1];
                const variableRegex = new RegExp(`\\b${match[2]}\\b`, 'g');
                if (variableRegex.test(functionBody)) {
                    isGlobal = false;
                }
            }
        });
        if(isGlobal){
            globalVariables.push(match[2]);
        }
    });
}

function mainDiagram(sourceFile, outputFile) {
  try {
    const fileContent = fs.readFileSync(sourceFile, 'utf8');
    const styleContent = fs.readFileSync(styleSource, 'utf8');
    findFunctions(fileContent);
    findVariables(fileContent);
    analyzeVariableScope(fileContent);

    const functionCount = allFunctions.length;
    const variableCount = allVariables.length;

    console.log(`Function count in ${sourceFile}: ${functionCount}`);
    console.log(`Variable count in ${sourceFile}: ${variableCount}`);
    console.log("Function Variable Relations:", functionVariableRelations);
    console.log("Global Variables:", globalVariables);

    let globalVariableDivs = '';
    globalVariables.forEach(variable => {
      globalVariableDivs += `<div class="variable">Global: ${variable}</div>`;
    });

    let functionDivs = '';
    allFunctions.forEach(func => {
      let functionVariablesDivs = '';
      functionVariableRelations[func.name].forEach(variableName => {
        functionVariablesDivs += `<div class="variable">${variableName}</div>`;
      });
      functionDivs += `
        <div class="function">
          ${func.name}
          <div class="function-variables">
            ${functionVariablesDivs}
          </div>
        </div>
      `;
    });

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
    <title>Function Diagram</title>
    <style>
      ${styleContent}
    </style>
    </head>
    <body>
    <div id="container">
      <div class="row">
        ${globalVariableDivs}
      </div>
      <div class="row">
        ${functionDivs}
      </div>
      </div>
    </body>
    </html>
    `;

    fs.writeFileSync(outputFile, htmlContent);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

const styleSource = 'diagramStyle.css';
const sourceFile = '../professions/fisher.js';
const outputFile = 'diagram.html';

mainDiagram(sourceFile, outputFile);