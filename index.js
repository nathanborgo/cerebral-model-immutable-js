var Immutable = require('immutable');
var deepmerge = require('deepmerge');

var Model = function (initialState) {

  var state = Immutable.fromJS(initialState);

  var model = function (controller) {

    controller.on('reset', function () {
      state = Immutable.fromJS(initialState);
    });

    controller.on('seek', function (seek, isPlaying, recording) {
      state = Immutable.fromJS(recording.initialState);
    });

    return {
        accessors: {
          get: function (path) {
            return state.getIn(path);
          },
          export: function () {
            return state.toJS();
          },
          import: function (newState) {
            return state = state.mergeDeep(newState);
          }
        },

        // Use default mutators
        mutators: {
          set: function (path, value) {
            state = state.setIn(path, value);
          },
          unset: function (path, keys) {
            if (keys) {
              keys.forEach(function (key) {
                state = state.deleteIn(path.concat(key));
              });
            } else {
              state = state.deleteIn(path);
            }

          },
          push: function (path, value) {
            state = state.updateIn(path, function (array) {
              return array.push(value);
            });
          },
          splice: function () {
            var args = [].slice.call(arguments);
            var path = args.shift();
            state = state.updateIn(path, function (array) {
              return array.splice.apply(array, args);
            });
          },
          merge: function (path, value) {
            state = state.mergeIn(path, value);
          },
          concat: function () {
            var args = [].slice.call(arguments);
            var path = args.shift();
            state = state.updateIn(path, function (array) {
              return array.concat.apply(array, args);
            });
          },
          pop: function (path) {
            state = state.updateIn(path, function (array) {
              return array.pop();
            });
          },
          shift: function (path) {
            state = state.updateIn(path, function (array) {
              return array.shift();
            });
          },
          unshift: function (path, value) {
            var args = [].slice.call(arguments);
            var path = args.shift();
            state = state.updateIn(path, function (array) {
              return array.unshift.apply(array, args);
            });
          }
        }
    };

  };

  return model;

};

module.exports = Model;