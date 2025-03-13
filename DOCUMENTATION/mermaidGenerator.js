const fs = require('fs');
const acorn = require('acorn');

function generateMermaidFunctionDiagram(sourceFilePath, outputFilePath) {
  try {
    const sourceCode = fs.readFileSync(sourceFilePath, 'utf-8');
    const ast = acorn.parse(sourceCode, { ecmaVersion: 2020 });

    const functionNodes = [];

    function walk(node, parentKey = null, parentName = null) {
      if (!node || typeof node !== 'object') return;

      if (
        node.type === 'FunctionDeclaration' ||
        node.type === 'FunctionExpression' ||
        node.type === 'ArrowFunctionExpression'
      ) {
        let functionName;

        if (node.type === 'FunctionDeclaration' && node.id && node.id.name) {
          functionName = node.id.name;
        }
        else if (parentKey === 'init' && node.parent && node.parent.type === 'VariableDeclarator' && node.parent.id && node.parent.id.name) {
          functionName = node.parent.id.name;
        }
        else if (parentKey && node.parent && node.parent.type === 'Property' && node.parent.key && node.parent.key.name) {
          functionName = node.parent.key.name;
        }
        else {
          functionName = `Function${functionNodes.length}`;
        }

        functionNodes.push({ name: functionName, node, parent: parentName });
        node.parent = parentKey ? node.parent : null;
      }

      for (const key in node) {
        if (node.hasOwnProperty(key)) {
          const value = node[key];
          if (Array.isArray(value)) {
            value.forEach(item => walk(item, key, functionNodes[functionNodes.length - 1]?.name));
          } else {
            walk(value, key, functionNodes[functionNodes.length - 1]?.name);
          }
        }
      }
    }

    walk(ast);

    let mermaidCode = 'graph TD\n';

    const root = 'A[All Functions]';
    mermaidCode += `    ${root}\n`;

    const subgraphs = {};

    functionNodes.forEach(func => {
      if (!subgraphs[func.parent || 'root']) {
        subgraphs[func.parent || 'root'] = [];
      }
      subgraphs[func.parent || 'root'].push(func.name);
      mermaidCode += `    ${func.name}[${func.name}]\n`;
    });

    Object.keys(subgraphs).forEach(parent => {
      if (parent === 'root') {
        subgraphs[parent].forEach(func => {
          mermaidCode += `    A --> ${func}\n`;
        });
      } else {
        mermaidCode += `    subgraph "${parent}"\n`;
        subgraphs[parent].forEach(func => {
          mermaidCode += `        ${func}\n`;
        });
        mermaidCode += `    end\n`;
        mermaidCode += `    A --> ${parent}\n`;
      }
    });

    mermaidCode += '\nclassDef default fill:#000000,stroke:#90EE90,stroke-width:2px;\n';

    fs.writeFileSync(outputFilePath, mermaidCode);
    console.log(`Mermaid diagram generated at ${outputFilePath}`);
  } catch (error) {
    console.error('Error:', error);
  }
}

const sourceFile = '../professions/fisher.js';
const outputFile = 'mermaid_diagram.md';

generateMermaidFunctionDiagram(sourceFile, outputFile);