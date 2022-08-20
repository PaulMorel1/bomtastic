# bomtastic

by Evan X. Merz

https://github.com/PaulMorel1/bomtastic

https://www.npmjs.com/package/bomtastic

## About

TLDR: This package reads a package-lock.json file and returns a
dependency graph as a [graphology.js](https://www.npmjs.com/package/graphology) graph. It also renders some
possibly-useful graph statistics into a json file when run using
npx.

This is a tool I created to try to create a useful representation
of a software bill of materials that is more programmatically
useful as a data structure than the xml or json BOMs built by other
tools. In other words, I want a SBOM structured as a graph.

This is loosely based on the cyclonedx bom specification, but I'm
trying to make this as useful to developers as possible without
adhering to external limitations. I'd prefer to let this tool grow 
organically from the bottom-up, rather than limit it based on a 
spec (top-down).

Top-down specification of SBOMs does make sense, as they 
are used in top-down software procurement scenarios, such as when
a hospital wants to purchase a new software tool.

The problem I'm seeing with the existing specifications is that
they discard structural information, such as parent-child
relationships. The information provided in the cyclonedx spec that relates to
unique identifiers, authors, and external links is useful,
but I suspect the information in the graph itself is equally,
if not more useful.

But this is just a hunch. I started this effort as an exploration
to figure out if SBOMs become more useful and practical if
we open up the spec a little bit and allow developers to lead the
process.

I also wanted to allow smaller companies to start taking advantage
of SBOMs. I wanted to give web developers an easy way into SBOMs
that provides value to the organization, but also to
the developers and managers who may need to quickly decide
whether to incorporate a new package from npm.

### What do you want to know about the materials in your node project?

For me, I think some basic graph information may be best at
revealing the problems in a SBOM. Here's a list of some 
questions that I think should be answerable in any SBOM.

1. How many total dependencies? subgraphSize on root node
1. How many top level dependencies? childCount
1. Which subgraph is the largest? subgraphSize
1. Which subgraph contains the most outdated versions?

I would also like to add some information that should
fit within the existing specifications, such as information from
the National Vulnerability Database, or from socket.dev.
This, however, may be better in an additional layer.

## References

For more about the cyclonedx SBOM specification,
see https://cyclonedx.org/specification/overview/

For more about the national vulnerability database,
see https://nvd.nist.gov/

For more detailed reports on npm packages,
see https://socket.dev/

## Running using npx

Bomtastic only requires a package lock file. The first parameter
is the package lock file. The second parameter is the output file.

```
npx bomtastix PATH_TO_PACKAGE_LOCK_FILE PATH_TO_OUTPUT_JSON_FILE
```

For example

```
npx bomtastic package-lock.json bom.jsom
npx bomtastic examples/empress-package-lock.json empress-bom.json
npx bomtastic examples/viewbom-package-lock.json viewbom-bom.json
```

If nothing is provided for either argument, then it will assume
you are running this from the root directory of your node project.
It will try to open `package-lock.json` and write to `bom.json` in the
current directory.

## Using in node

TODO: Write some examples. Why don't you contribute an example here?

pseudocode:
```
import analyze from bomtastic;
let graph = analyze({ 
  packageLockFilePath: "./package-lock.json", 
  outputFilePath: "bom.json", 
  saveToFile: true, 
  ignoreDev: true });
// do some graph analysis with the graph
```

## Contributing

The main entry point is `bin/index.js`. I'm open to all new features,
but I am hesitant to add any new dependencies unless they significantly
enhance the utility of bomtastic.

## License

I haven't decided on a license yet. For now, bomtastic is free to
use for anyone. You are not permitted to to distribute
bomtastic or repackage it into a product with the same or a related purpose.

No guarantees are made about bomtastic. It is experimental software.