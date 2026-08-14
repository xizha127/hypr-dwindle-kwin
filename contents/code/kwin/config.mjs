const DEFAULTS = Object.freeze({
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

function finiteNumber(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
}

function bool(value, fallback) {
    return typeof value === "boolean" ? value : fallback;
}

export function loadSettings(readConfig) {
    const raw = (key) => readConfig(key, DEFAULTS[key]);
    const ratioMinimum = Math.max(0.01, finiteNumber(raw("ratioMinimum"), DEFAULTS.ratioMinimum));
    const ratioMaximum = Math.max(ratioMinimum, finiteNumber(raw("ratioMaximum"), DEFAULTS.ratioMaximum));

    return {
        gapsIn: Math.max(0, finiteNumber(raw("gapsIn"), DEFAULTS.gapsIn)),
        gapsOut: Math.max(0, finiteNumber(raw("gapsOut"), DEFAULTS.gapsOut)),
        preserveSplit: bool(raw("preserveSplit"), DEFAULTS.preserveSplit),
        smartSplit: bool(raw("smartSplit"), DEFAULTS.smartSplit),
        smartResizing: bool(raw("smartResizing"), DEFAULTS.smartResizing),
        preciseMouseMove: bool(raw("preciseMouseMove"), DEFAULTS.preciseMouseMove),
        useActiveForSplits: bool(raw("useActiveForSplits"), DEFAULTS.useActiveForSplits),
        splitWidthMultiplier: Math.max(0.01, finiteNumber(raw("splitWidthMultiplier"), DEFAULTS.splitWidthMultiplier)),
        defaultSplitRatio: Math.min(
            ratioMaximum,
            Math.max(ratioMinimum, finiteNumber(raw("defaultSplitRatio"), DEFAULTS.defaultSplitRatio)),
        ),
        ratioMinimum,
        ratioMaximum,
        logLevel: typeof raw("logLevel") === "string" ? raw("logLevel") : DEFAULTS.logLevel,
    };
}

export { DEFAULTS };
