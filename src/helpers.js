const fs = require('fs'); // needed for reading & writing to files

/*
  Read a json file and return an object with the parsed json.
*/
function ingestPackageLockFile(inputFilePath) {
  try {
    // get the arguments starting at index 2. See https://nodejs.org/docs/latest/api/process.html#processargv
    const args = process.argv.slice(2);
    const inputFile = inputFilePath || args[0] || "package-lock.json";

    // read and parse the json in the input file
    const rawdata = fs.readFileSync(inputFile);
    const packageLock = JSON.parse(rawdata);

    return packageLock;
  } catch(error) {
    /*
      Why catch this just to throw it again? To show that
      we are aware of the error cases here, and to give
      an entry point for any error tracking.
    */
    throw error
  }
}

function writeJsonToFile(json, outputFilePath) {
  try {
    // get the arguments starting at index 2. See https://nodejs.org/docs/latest/api/process.html#processargv
    const args = process.argv.slice(2);
    const outputFile = outputFilePath || args[1] || "bom.json";

    // write to a file
    fs.writeFileSync(outputFile, json);

    return outputFile;
  } catch(error) {
    /*
      Why catch this just to throw it again? To show that
      we are aware of the error cases here, and to give
      an entry point for any error tracking.
    */
    throw error
  }
}

function makeNodeAttributes(dependencyGraphKey, version, dev) {
  return {
    name: dependencyGraphKey,
    versions: [version],
    dev: !!dev,
  }
}

/*
  This method creates a hash containing all the information
  from the package lock file. The hash key is the dependency
  graph key made by makeDependencyGraphKey. The value is the
  json object for the node.

  1. Create a hash with all the packages keyed by the same
  key as the graph. This way we don't have to track two data
  structures with different keys.

  2. Add a name field to each item in the package list. The 
  name is required for tracking multiple versions of the same
  package in a bom.

  Returns a hash.
*/
function preprocessPackageList(packages, rootDependencyGraphKey) {
  let newPackages = {};

  Object.keys(packages).forEach((packageLockKey) => {
    // if this node has no packageLockKey, then it is the root node
    if(packageLockKey === "") {
      newPackages[rootDependencyGraphKey] = packages[packageLockKey];
    } else {
      // make a key for the new node
      const newKey = makeDependencyGraphKey(packageLockKey, packages[packageLockKey].version);

      // add a name field to the node
      newPackages[newKey] = { ...packages[packageLockKey], name: extractPackageName(packageLockKey) };   
    }
  });

  return newPackages;
}

/*
  pull the package name out of the path to the module
*/
function makeDependencyGraphKey(packageLockKey, version = null) {
  const packageKeySplit = packageLockKey.split("node_modules/");
  return `${packageKeySplit[packageKeySplit.length - 1]}${version ? "-" + version : ""}`;
}

function extractPackageName(packageLockKey) {
  const packageKeySplit = packageLockKey.split("node_modules/");
  return packageKeySplit[packageKeySplit.length - 1];
}

/*
  Make a list of child packages for the package corresponding to dependencyGraphKey

  Example structure of items in the dependencies array:

  "mustache": {
    "version": "4.2.0",
    "resolved": "https://registry.npmjs.org/mustache/-/mustache-4.2.0.tgz",
    "integrity": "sha512-71ippSywq5Yb7/tVYyGbkBggbU8H3u5Rz56fH60jGFgr8uHwxs+aSKeqmluIVzM0m0kB7xQjKS6qPfd0b2ZoqQ=="
  }
*/
function getChildren(packages, dependencyGraphKey, ignoreDev = true) {
  const package = packages[dependencyGraphKey];

  let dependencies = { ...package.dependencies, ...package.peerDependencies };
  if(!ignoreDev) {
    dependencies = { ...dependencies, ...package.devDependencies };
  }

  let children = [];

  // if there are any dependencies
  if(dependencies && Object.keys(dependencies).length > 0) {
    // for each package in the dependencies
    Object.keys(dependencies).forEach((packageName) => {
      const childVersion = typeof dependencies[packageName] === 'string' ? dependencies[packageName] : dependencies[packageName].version;
      const childKey = helpers.makeDependencyGraphKey(packageName, childVersion.replace(/[^0123456789.]/g,''));

      // if that package shouldn't be ignored
      if(!packages[childKey]) {
        SimpleLogger.log(`Not adding ${childKey} as a child to ${dependencyGraphKey} because it is not in the package list.`);
      } else if(ignoreDev && packages[childKey].dev) {
        SimpleLogger.log(`Not adding ${childKey} as a child to ${dependencyGraphKey} because it is a development dependency.`);
      } else {
        // push it onto the children list
        children.push(childKey);

        SimpleLogger.log(`Added ${childKey} to child dependencies for ${dependencyGraphKey}...`);
      }
    });
  } else {
    SimpleLogger.log(`Found 0 dependencies for ${dependencyGraphKey}.`);
  }

  return children;
}

module.exports = {
  ingestPackageLockFile,
  makeDependencyGraphKey,
  makeNodeAttributes,
  preprocessPackageList,
  writeJsonToFile,
  getChildren,
};