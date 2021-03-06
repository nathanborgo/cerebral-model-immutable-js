var Immutable = require('immutable');


var Model = function (initialState) {
  var state = Immutable.fromJS(initialState);
  var statePath = {};

  function pushPath(path) {
    function traverse(path, object) {
      var immutablePath = path;
      if (immutablePath.length) {
        object[immutablePath[0]] = traverse(immutablePath.slice(1), {});
        return object;
      } else { return true; }
    }
    if (!path.length) { return; }
    Object.assign(statePath, traverse(path, {}));
  }

  var model = function (controller) {

    controller.on('change', function(event) {
      controller.emit('flush', statePath);
      statePath = {};
    })

    controller.on('reset', function () {
      state = Immutable.fromJS(initialState);
    });

    controller.on('seek', function (seek, recording) {
      recording.initialState.forEach(function (stateUpdate) {
        state = state.setIn(stateUpdate.path, Immutable.fromJS(stateUpdate.value));
      });
    });

    return {
        logModel: function () {
          return state.toJS();
        },
        accessors: {
          get: function (path) {
            return state.getIn(path);
          },
          toJS: function (path) {
            return state.getIn(path).toJS();
          },
          export: function () {
            return state.toJS();
          },
          keys: function (path) {
            return state.getIn(path).keySeq().toArray();
          },
          findWhere: function (path, predicate) {
            var keysCount = Object.keys(predicate).length;
            return state.getIn(path).find(function (item) {
              return item.keySeq().toArray().filter(function (key) {
                return key in predicate && predicate[key] === item.get(key);
              }).length === keysCount;
            });
          }
        },

        // Use default mutators
        mutators: {
          import: function (newState) {
            return state = state.mergeDeep(Immutable.fromJS(newState));
          },
          set: function (path, value) {
            pushPath(path);
            state = state.setIn(path, Immutable.fromJS(value));
          },
          unset: function (path, keys) {
            if (keys) {
              keys.forEach(function (key) {
                state = state.deleteIn(path.concat(key));
              });
            } else {
              pushPath(path);
              state = state.deleteIn(path);
            }

          },
          push: function (path, value) {
            pushPath(path);
            state = state.updateIn(path, function (array) {
              return array.push(Immutable.fromJS(value));
            });
          },
          splice: function () {
            var args = [].slice.call(arguments);
            var path = args.shift();
            pushPath(path);
            state = state.updateIn(path, function (array) {
              return array.splice.apply(array, args.map(Immutable.fromJS.bind(Immutable)));
            });
          },
          /**
           * Merges an object into the state tree
           * @param {Array} - empty array since merging requires no path
           * @param {Object} - object that contains the keys and values to be merged into the state tree
           * @return null
           */
          merge: function (nullPath, object) {
            // pushPath needs an Array to traverse
            Object.keys(object).forEach(function(path) {
              pushPath([path]);
            });
            state = state.merge(Immutable.fromJS(object));
          },
          concat: function () {
            var args = [].slice.call(arguments);
            var path = args.shift();
            pushPath(path);
            state = state.updateIn(path, function (array) {
              return array.concat.apply(array, args.map(Immutable.fromJS.bind(Immutable)));
            });
          },
          pop: function (path) {
            pushPath(path);
            state = state.updateIn(path, function (array) {
              return array.pop();
            });
          },
          shift: function (path) {
            pushPath(path);
            state = state.updateIn(path, function (array) {
              return array.shift();
            });
          },
          unshift: function (path, value) {
            var args = [].slice.call(arguments);
            var path = args.shift();
            pushPath(path);
            state = state.updateIn(path, function (array) {
              return array.unshift.apply(array, args.map(Immutable.fromJS.bind(Immutable)));
            });
          }
        }
    };

  };

  return model;

};

module.exports = Model;
