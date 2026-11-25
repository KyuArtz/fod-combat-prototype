const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");

test("compact character reference stays under references and no duplicate JSON/ref folder ships", () => {
  assert.equal(fs.existsSync(path.join(root, "characterTerraData.json")), false);
  assert.equal(fs.existsSync(path.join(root, "ref")), false);
  assert.equal(fs.existsSync(path.join(root, "references", "characterTerraData.js")), true);
  assert.equal(fs.existsSync(path.join(root, "references", "characterTerraData.json")), false);
});

test("Evalete's five skill icons use the WebP asset format", () => {
  const reference = require("../references/characterTerraData");
  const evalete = reference.characters?.evalete;
  assert.ok(evalete, "Evalete must remain in the compact character reference");
  for (const key of ["passiveSkill", "skill1", "skill2", "skill3", "ultimate"]) {
    assert.match(evalete[key]?.icon || "", /\.webp$/i, `${key} must point to a WebP icon`);
  }
});
