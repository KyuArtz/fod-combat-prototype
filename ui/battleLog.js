const { createEventBus } = require("../core/eventBus");

// say(message) records the line, emits it as a "Log" event, and the terminal
// printer (subscribed here) writes it to the console. A GUI or test can subscribe
// to the same bus ("Log" or onAny) instead of parsing console output.
function createBattleLog(state, output = console, events = createEventBus()) {
  events.on("Log", (event) => output.log(event.message));

  function say(message) {
    state.log.push(message);
    events.emit("Log", { message, round: state.round });
  }

  return { say, events };
}

module.exports = { createBattleLog };
