import assert from "node:assert/strict";
import {
  biomeTheme,
  polluterVisual,
  pollutionVisual
} from "../src/visualConfig.js";

const coast = biomeTheme("Kueste");
assert.equal(coast.surface, "water");
assert.equal(coast.horizon.length >= 2, true);
assert.equal(coast.style.outline, "#08303a");
assert.equal(coast.props.includes("oil-slick"), true);

const forest = biomeTheme("Wald");
assert.equal(forest.surface, "forest");

const drone = polluterVisual("smogDrone");
assert.equal(drone.label, "Smog-Drohne");
assert.equal(drone.body, "drone");
assert.equal(drone.icon, "smog");

const cutter = polluterVisual("cutterBot");
assert.equal(cutter.body, "sawbot");
assert.equal(cutter.icon, "saw");

const boss = polluterVisual("megaEmitter");
assert.equal(boss.label, "Oel-Tanker");
assert.equal(boss.body, "tanker");
assert.equal(boss.icon, "oil");

const unknown = polluterVisual("unknownMachine");
assert.equal(unknown.label, "Umweltmaschine");

assert.equal(pollutionVisual("Waldgesundheit").shape, "flame");
assert.equal(pollutionVisual("Luftqualitaet am Hafen").shape, "smog");

console.log("visualConfig tests passed");
