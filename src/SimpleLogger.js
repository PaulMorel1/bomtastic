
/*
  Really simple logging class made up just to avoid
  adding a logging dependency.

  As I am creating this project, I am starting to think
  that it's not worth the trade-off to add new dependencies
  for simple tasks. So I don't think it's worth it to add
  a commonly used package for logging when I have no input
  into the development or dependencies used in that package.
*/
class SimpleLogger {
  static verbose = false;

  static setVerbose(value) {
    SimpleLogger.verbose = value;
  }

  static log(message) {
    if(SimpleLogger.verbose) {
      console.log(message);
    }
  }

  static warn(message) {
    console.warn(message);
  }
}

module.exports = {
  SimpleLogger,
}
