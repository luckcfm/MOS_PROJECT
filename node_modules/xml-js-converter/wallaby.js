module.exports = function (wallaby) {
  return {
    files: [
      "index.js",
      "lib/*.js"
    ],
    tests: [
      "tests/*.spec.js"
    ],
    env: {
      type: 'node'
    }
  };
};
