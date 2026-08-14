import test from "node:test";
import assert from "node:assert/strict";

import {
    automaticOrientation,
    cardinalDirection,
} from "../../contents/runtime/core/placement.mjs";

test("automaticOrientation stacks a tall target instead of creating portrait pillars", () => {
    assert.equal(
        automaticOrientation({ x: 0, y: 0, width: 1200, height: 1920 }, 1),
        "vertical",
    );
});

test("cardinalDirection assigns a lower drop to down rather than a corner quadrant", () => {
    assert.equal(
        cardinalDirection(
            { x: 100, y: 100, width: 600, height: 400 },
            { x: 500, y: 420 },
        ),
        "down",
    );
});
