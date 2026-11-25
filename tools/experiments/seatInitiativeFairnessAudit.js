const fs = require("node:fs");
const path = require("node:path");
const { playFactionDuel } = require("../lib/factionDuel");
const { createSerpentTacticsController } = require("../../ai/serpentTactics");

const seedStart = Number(process.argv[2] || 20263000);
const seedCount = Number(process.argv[3] || 20);
const policy = { standardThreshold: 0.12, verraThreshold: 0.10, poisonThreshold: 0.22 };
const results = { seedStart, seedCount, policy, seats: { ally: { wins: 0, rounds: 0, battles: 0 }, enemy: { wins: 0, rounds: 0, battles: 0 } }, perSeed: [] };

(async () => {
  for (let seed = seedStart; seed < seedStart + seedCount; seed++) {
    const allySeat = await playFactionDuel({ seed, playerFaction: "serpent", opponentFaction: "phantom", controllerOverrides: { serpent: createSerpentTacticsController(policy) } });
    const enemySeat = await playFactionDuel({ seed, playerFaction: "phantom", opponentFaction: "serpent", controllerOverrides: { serpent: createSerpentTacticsController(policy) } });
    const allyWin = allySeat.result === "VICTORY";
    const enemyWin = enemySeat.result === "DEFEAT";
    results.seats.ally.wins += Number(allyWin); results.seats.ally.rounds += allySeat.rounds; results.seats.ally.battles++;
    results.seats.enemy.wins += Number(enemyWin); results.seats.enemy.rounds += enemySeat.rounds; results.seats.enemy.battles++;
    results.perSeed.push({ seed, serpentAllySeat: { result: allySeat.result, win: allyWin, rounds: allySeat.rounds }, serpentEnemySeat: { result: enemySeat.result, win: enemyWin, rounds: enemySeat.rounds } });
  }
  for (const seat of Object.values(results.seats)) { seat.winRate = seat.wins / seat.battles; seat.averageRounds = seat.rounds / seat.battles; }
  const out = path.resolve(process.argv[4] || "reports/experiments/seat-initiative-fairness-audit.json");
  fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results.seats, null, 2));
})().catch((error) => { console.error(error); process.exitCode = 1; });
