const { Project } = require("ts-morph");
const path = require("path");

const repoRoot = process.argv[2];

const project = new Project({
  skipAddingFilesFromTsConfig: true,
});

project.addSourceFilesAtPaths([
  `${repoRoot}/**/*.ts`,
  `${repoRoot}/**/*.tsx`,
  `${repoRoot}/**/*.js`,
  `${repoRoot}/**/*.jsx`,
  `!${repoRoot}/**/node_modules/**`,
]);

const nodes = [];
const edges = [];
let idCounter = 0;

function nextId() {
  idCounter += 1;
  return `ts_${idCounter}`;
}

for (const sourceFile of project.getSourceFiles()) {
  const relativePath = path.relative(repoRoot, sourceFile.getFilePath()).replace(/\\/g, "/");

  const fileId = nextId();
  nodes.push({
    id: fileId,
    type: "file",
    name: relativePath,
    file_path: relativePath,
    line_number: 0,
    docstring: null,
  });

  // Functions (including arrow functions assigned to consts, and class methods)
  for (const fn of sourceFile.getFunctions()) {
    nodes.push({
      id: nextId(),
      type: "function",
      name: fn.getName() || "anonymous",
      file_path: relativePath,
      line_number: fn.getStartLineNumber(),
      docstring: fn.getJsDocs().map(d => d.getComment()).join("\n") || null,
    });
  }

  // Classes
  for (const cls of sourceFile.getClasses()) {
    const classId = nextId();
    nodes.push({
      id: classId,
      type: "class",
      name: cls.getName() || "anonymous",
      file_path: relativePath,
      line_number: cls.getStartLineNumber(),
      docstring: cls.getJsDocs().map(d => d.getComment()).join("\n") || null,
    });

    const baseClass = cls.getExtends();
    if (baseClass) {
      edges.push({
        source_id: classId,
        target_name: baseClass.getText(),
        type: "inherits",
      });
    }
  }

  // Imports
  for (const imp of sourceFile.getImportDeclarations()) {
    edges.push({
      source_id: fileId,
      target_name: imp.getModuleSpecifierValue(),
      type: "imports",
    });
  }
}

console.log(JSON.stringify({ nodes, edges }));