import test from "node:test";
import assert from "node:assert/strict";

import { isEligibleWindow } from "../../contents/code/kwin/window.mjs";

test("isEligibleWindow accepts a normal managed application window", () => {
    assert.equal(isEligibleWindow({
        normalWindow: true,
        specialWindow: false,
        popupWindow: false,
        transient: false,
        fullScreen: false,
        minimized: false,
        onAllDesktops: false,
    }), true);
});

test("isEligibleWindow excludes special and temporary non-tiled windows", () => {
    for (const window of [
        { normalWindow: false },
        { normalWindow: true, specialWindow: true },
        { normalWindow: true, popupWindow: true },
        { normalWindow: true, transient: true },
        { normalWindow: true, fullScreen: true },
        { normalWindow: true, minimized: true },
        { normalWindow: true, maximizedHorizontal: true, maximizedVertical: true },
        { normalWindow: true, onAllDesktops: true },
    ]) {
        assert.equal(isEligibleWindow(window), false);
    }
});
