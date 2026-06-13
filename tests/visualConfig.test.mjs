import assert from "node:assert/strict";
import {
  biomeTheme,
  polluterVisual,
  pollutionVisual
} from "../src/visualConfig.js";

const coast = biomeTheme("Kueste");
assert.equal(coast.surface, "water");
assert.equal(coast.horizon.length >= 2, true);

const forest = biomeTheme("Wald");
assert.equal(forest.surface, "forest");

const drone = polluterVisual("smogDrone");
assert.equal(drone.label, "Smog-Drohne");
assert.equal(drone.body, "drone");

const cutter = polluterVisual("cutterBot");
assert.equal(cutter.body, "sawbot");

const unknown = polluterVisual("unknownMachine");
assert.equal(unknown.label, "Umweltmaschine");

assert.equal(pollutionVisual("Waldgesundheit").shape, "flame");
assert.equal(pollutionVisual("Luftqualitaet am Hafen").shape, "smog");

console.log("visualConfig tests passed");
