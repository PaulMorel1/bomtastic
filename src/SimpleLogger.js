
/*
  Really simple logging class made up just to avoid
  a logging dependency.
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
