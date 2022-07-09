#! /usr/bin/env node
const helpers = require('../src/helpers.js');
const { SimpleLogger } = require('../src/SimpleLogger.js');

/*
  bomtastic
  by Evan X. Merz
  https://www.npmjs.com/package/bomtastic
*/

/*
  This method is the main entry point for creating a SBOM.
*/
function analyze({ packageLockFilePath, outputFilePath, saveToFile, ignoreDev = true }) {
  // read the package-lock.json file and preprocess it
  SimpleLogger.log("Reading package lock file...");
  const packageLock = helpers.ingestPackageLockFile(packageLockFilePath);

  // make the key for the root node of the dependency graph (we will need this in multiple places)
  const rootDependencyGraphKey = helpers.makeDependencyGraphKey(packageLock.name, packageLock.version);

  // Preprocess the package list into a hash
  SimpleLogger.log("Preprocessing package list...");
  let packages = helpers.preprocessPackageList(packageLock.packages, rootDependencyGraphKey);

  // PHASE 1: Build dependency graph

  // loop through each item in the packages list and make a node for it
  SimpleLogger.log(`Building dependency graph...`);
  let dependencyGraph = {};
  let versions = {}; // this will be used to track dependencies in your project that are included with multiple versions
  Object.keys(packages).forEach((dependencyGraphKey) => {
    SimpleLogger.log(`Analyzing package "${dependencyGraphKey}"...`);
    const package = packages[dependencyGraphKey];
    const packageName = package.name;

    // check if this is a dev dependency that we should ignore, or a new dependency that we should add
    if(ignoreDev && package && package.dev) {
      SimpleLogger.log(`Ignoring ${dependencyGraphKey} because it is a development dependency.`);
    } else if(package && !dependencyGraph[dependencyGraphKey]) {
        dependencyGraph[dependencyGraphKey] = helpers.makeNode(dependencyGraphKey, package.version, package.dev);
        SimpleLogger.log(`Added ${dependencyGraphKey} to new node in dependency graph...`);

        // Also add it to a hash where they key is the package lock key, and the value is an array of versions
        if(versions[packageName] && !versions[packageName].includes(package.version)) {
          versions[packageName].push(package.version);
        } else {
          versions[packageName] = [package.version];
        }
    }
  });

  // go through each item in the packages list and add parent/child relationships
  SimpleLogger.log(`Analyzing package relationships...`);
  Object.keys(packages).forEach((dependencyGraphKey) => {
    SimpleLogger.log(`Analyzing relationships for package "${dependencyGraphKey}"...`);
    const package = packages[dependencyGraphKey];

    if(!(ignoreDev && package && package.dev)) {
      SimpleLogger.log(`Getting children of ${dependencyGraphKey}...`);

      // get the number of children from package-lock
      const children = helpers.getChildren(packages, dependencyGraphKey, ignoreDev);
      dependencyGraph[dependencyGraphKey].children = children;
      dependencyGraph[dependencyGraphKey].childCount = children.length;

      SimpleLogger.log(`${dependencyGraphKey} has ${children.length} dependencies...`);

      // for each child of the current node
      dependencyGraph[dependencyGraphKey].children.forEach((packageName) => {
        // if the child isn't in the dependency graph, then something went wrong
        if(!dependencyGraph[packageName]) {
          SimpleLogger.warn(`Unknown package name encountered: "${packageName}"! This probably indicates that this is an optional dependency that is not installed.`);
        } else {
          // push the parent package name into the list of parents
          dependencyGraph[packageName].parents.push(dependencyGraphKey);
        }
      });
    }
  });


  // PHASE 2: Analyze dependency graph

  // annotate each node with the size of its subgraph
  helpers.annotateSubgraphSize(rootDependencyGraphKey, dependencyGraph);

  // annotate each node with the number of items in its subgraph that occur multiple times in the graph
  let dependenciesWithMultipleVersions = [];
  Object.keys(versions).forEach((key) => {
    if(versions[key].length > 1) {
      dependenciesWithMultipleVersions.push(key);
    }
  });

  // topLevelDependencies = list of keys
  const topLevelDependencies = dependencyGraph[rootDependencyGraphKey].childCount;

  // totalDependencies = total count
  const totalDependencies = dependencyGraph[rootDependencyGraphKey].subgraphSize;

  // TODO: Add devDependencies, peer?

  // returned the analyzed bom
  const bom = {
    name: packageLock.name,
    version: packageLock.version,
    topLevelDependencies,
    totalDependencies, 
    dependenciesWithMultipleVersions,
    dependencyGraph
  };

  // save to a json file
  if(saveToFile) {
    helpers.writeJsonToFile(JSON.stringify(bom), outputFilePath);
  }

  return bom;
}



module.exports = {
  analyze,
};

// If called using npx, then run viewBom. Otherwise, do nothing
// See https://stackoverflow.com/questions/6398196/detect-if-called-through-require-or-directly-by-command-line
if (require.main === module) {
  SimpleLogger.setVerbose(true);
  analyze({ saveToFile: true, ignoreDev: false });
}

