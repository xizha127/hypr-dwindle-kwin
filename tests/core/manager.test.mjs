import test from "node:test";
import assert from "node:assert/strict";

import { DwindleManager } from "../../contents/runtime/core/manager.mjs";

test("a new client splits the active tiled client before considering the cursor fallback", () => {
    const manager = new DwindleManager();
    const rootKey = "DP-2:desktop-1";
    const rootRect = { x: 0, y: 0, width: 1200, height: 1920 };

    manager.place("first", rootKey, { rootRect, cursorPos: { x: 600, y: 1700 } });
    manager.place("second", rootKey, {
        rootRect,
        activeWindowId: "first",
        cursorPos: { x: 600, y: 1700 },
    });
    manager.place("third", rootKey, {
        rootRect,
        activeWindowId: "first",
        cursorPos: { x: 600, y: 1700 },
    });

    assert.deepEqual(manager.layout(rootKey, rootRect).get("first"), {
        x: 0, y: 0, width: 599, height: 959,
    });
    assert.deepEqual(manager.layout(rootKey, rootRect).get("third"), {
        x: 601, y: 0, width: 599, height: 959,
    });
    assert.deepEqual(manager.layout(rootKey, rootRect).get("second"), {
        x: 0, y: 961, width: 1200, height: 959,
    });
});

test("parking a tiled client reclaims its space and restores it beside its prior sibling", () => {
    const manager = new DwindleManager();
    const rootKey = "DP-2:desktop-1";
    const rootRect = { x: 0, y: 0, width: 1200, height: 1920 };

    manager.place("first", rootKey, { rootRect });
    manager.place("second", rootKey, {
        rootRect,
        activeWindowId: "first",
        cursorPos: { x: 600, y: 1700 },
    });
    manager.park("second");

    assert.deepEqual(manager.layout(rootKey, rootRect), new Map([
        ["first", rootRect],
    ]));

    manager.restore("second", rootKey, { rootRect, cursorPos: { x: 600, y: 1700 } });
    assert.deepEqual(manager.layout(rootKey, rootRect), new Map([
        ["first", { x: 0, y: 0, width: 1200, height: 959 }],
        ["second", { x: 0, y: 961, width: 1200, height: 959 }],
    ]));
});

test("smartSplit changes a pointer-selected normal insertion into a cardinal split", () => {
    const manager = new DwindleManager({ smartSplit: true });
    const rootKey = "DP-3:desktop-1";
    const rootRect = { x: 0, y: 0, width: 1000, height: 600 };

    manager.place("first", rootKey, { rootRect });
    manager.place("second", rootKey, {
        rootRect,
        activeWindowId: "first",
        cursorPos: { x: 750, y: 500 },
    });

    assert.deepEqual(manager.layout(rootKey, rootRect).get("second"), {
        x: 0, y: 301, width: 1000, height: 299,
    });
});
