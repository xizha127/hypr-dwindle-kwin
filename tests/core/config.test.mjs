import test from "node:test";
import assert from "node:assert/strict";

import { loadSettings } from "../../contents/runtime/kwin/config.mjs";

test("loadSettings exposes the configured Hyprland dwindle defaults", () => {
    const settings = loadSettings((_key, fallback) => fallback);

    assert.deepEqual(settings, {
        gapsIn: 2,
        gapsOut: 4,
        preserveSplit: true,
        smartSplit: false,
        smartResizing: true,
        preciseMouseMove: true,
        useActiveForSplits: true,
        splitWidthMultiplier: 1,
        defaultSplitRatio: 1,
        ratioMinimum: 0.1,
        ratioMaximum: 1.9,
        logLevel: "warn",
    });
});

test("loadSettings clamps an unsafe configured split ratio into Hyprland bounds", () => {
    const values = new Map([["defaultSplitRatio", 9]]);
    const settings = loadSettings((key, fallback) => values.get(key) ?? fallback);

    assert.equal(settings.defaultSplitRatio, 1.9);
});
