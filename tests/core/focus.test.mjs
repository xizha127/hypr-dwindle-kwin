import test from "node:test";
import assert from "node:assert/strict";

import { directionalNeighbor } from "../../contents/code/core/focus.mjs";

const layout = new Map([
    ["left", { x: 0, y: 0, width: 499, height: 1000 }],
    ["top-right", { x: 501, y: 0, width: 499, height: 499 }],
    ["bottom-right", { x: 501, y: 501, width: 499, height: 499 }],
]);

test("directionalNeighbor chooses the overlapping neighbor in the requested direction", () => {
    assert.equal(directionalNeighbor(layout, "left", "right"), "top-right");
    assert.equal(directionalNeighbor(layout, "bottom-right", "up"), "top-right");
});

test("directionalNeighbor returns null when no tiled neighbor exists", () => {
    assert.equal(directionalNeighbor(layout, "left", "left"), null);
});
