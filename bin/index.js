#! /usr/bin/env node
const helpers = require('../src/helpers.js');
const { SimpleLogger } = require('../src/SimpleLogger.js');
const { DirectedGraph } = require('graphology'); // See https://graphology.github.io/properties.html

/*
  bomtastic
  by Evan X. Merz
  https://github.com/PaulMorel1/bomtastic
*/

/*
  This method is the main entry point for creating a SBOM.

  It returns a dependency graph as a graphology.js DirectedGraph.
*/
function analyze({ packageLockFilePath, outputFilePath, saveToFile, ignoreDev = true }) {

  // PHASE 0: Read package-lock.json file and set up the data structures we will use.

  // read the package-lock.json file and preprocess it
  SimpleLogger.log("Reading package lock file...");
  const packageLock = helpers.ingestPackageLockFile(packageLockFilePath);

  // make the key for the root node of the dependency graph (we will need this in multiple places)
  const rootDependencyGraphKey = helpers.makeDependencyGraphKey(packageLock.name, packageLock.version);

  // Preprocess the package lock file into a hash
  SimpleLogger.log("Preprocessing package list...");
  let packages = helpers.preprocessPackageList(packageLock.packages, rootDependencyGraphKey);

  // instantiate the variables that will be used to analyze the package-lock.json file
  const dependencyGraph = new DirectedGraph({ allowSelfLoops: false }); // instantiate the graphology graph data structure

  // these will be used to track dependencies in your project that are included with multiple versions
  let versions = {}; 
  let dependenciesWithMultipleVersions = [];

  // PHASE 1: Build dependency graph

  // Create all nodes: loop through each item in the packages list and add a node for it
  SimpleLogger.log(`Building dependency graph...`);
  Object.keys(packages).forEach((dependencyGraphKey) => {
    SimpleLogger.log(`Analyzing package "${dependencyGraphKey}"...`);
    const package = packages[dependencyGraphKey];

    // check if this is a dev dependency that we should ignore, or a new dependency that we should add
    if(ignoreDev && package && package.dev) {
      SimpleLogger.log(`Ignoring ${dependencyGraphKey} because it is a development dependency.`);
    } else if(package && !dependencyGraph[dependencyGraphKey]) {
      dependencyGraph.addNode(dependencyGraphKey, helpers.makeNodeAttributes(dependencyGraphKey, package.version, package.dev));
      SimpleLogger.log(`Added ${dependencyGraphKey} to new node in dependency graph...`);

      // Also add it to a hash where they key is the package lock key, and the value is an array of versions
      if(versions[package.name] && !versions[package.name].includes(package.version)) {
        versions[package.name].push(package.version);
      } else {
        versions[package.name] = [package.version];
      }
    }
  });

  // Create all the edges: go through each item in the packages list and add edges
  SimpleLogger.log(`Analyzing package relationships...`);
  Object.keys(packages).forEach((dependencyGraphKey) => {
    SimpleLogger.log(`Analyzing relationships for package "${dependencyGraphKey}"...`);

    // get the package object from the package lock hash
    const package = packages[dependencyGraphKey];

    if(!(ignoreDev && package && package.dev)) {
      // get the children from package-lock hash
      const children = helpers.getChildren(packages, dependencyGraphKey, ignoreDev);

      // for each child of the current node
      children.forEach((childKey) => {
        // if the child isn't in the dependency graph, then something went wrong
        if(!dependencyGraph.hasNode(childKey)) {
          SimpleLogger.warn(`Unknown package name encountered: "${packageName}"! This probably indicates that this is an optional dependency that is not installed.`);
        } else {
          // add an edge from the parent to the child
          dependencyGraph.addEdge(dependencyGraphKey, childKey);
        }
      });
    }
  });


  // PHASE 2: Analyze dependency graph

  // annotate each node with the number of items in its subgraph that occur multiple times in the graph
  Object.keys(versions).forEach((key) => {
    if(versions[key].length > 1) {
      dependenciesWithMultipleVersions.push(key);
    }
  });

  // topLevelDependencies = list of keys
  const topLevelDependencies = dependencyGraph.outDegree(rootDependencyGraphKey);

  // totalDependencies = total edge count = size
  const totalDependencies = dependencyGraph.size;

  // build an object containing the analyzed bom
  const bom = {
    name: packageLock.name,
    version: packageLock.version,
    topLevelDependencies,
    totalDependencies, 
    dependenciesWithMultipleVersions,
  };

  // write the bom to a json file
  if(saveToFile) {
    helpers.writeJsonToFile(JSON.stringify(bom), outputFilePath);
  }

  // return the graphology.js DirectedGraph
  return dependencyGraph;
}



module.exports = {
  analyze,
};

// If called using npx, then run bomtastic and save to a file
// See https://stackoverflow.com/questions/6398196/detect-if-called-through-require-or-directly-by-command-line
if (require.main === module) {
  SimpleLogger.setVerbose(true);
  analyze({ saveToFile: true, ignoreDev: false });
}

