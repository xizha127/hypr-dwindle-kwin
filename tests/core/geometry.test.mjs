import test from "node:test";
import assert from "node:assert/strict";

import { insetRect } from "../../contents/code/core/geometry.mjs";

test("insetRect reserves the configured outer gap on every workspace edge", () => {
    assert.deepEqual(
        insetRect({ x: 100, y: 50, width: 1200, height: 1920 }, 4),
        { x: 104, y: 54, width: 1192, height: 1912 },
    );
});
