function createBattleLog(state, output = console) {
  function say(message) {
    state.log.push(message);
    output.log(message);
  }

  return { say };
}

module.exports = { createBattleLog };