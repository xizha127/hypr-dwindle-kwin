// Copy into Caelestia only after disabling Hypr Dwindle's direct shortcuts.
// This sample is intentionally not installed or loaded by this project.
import QtQuick
import Quickshell
import qs.components.misc

Item {
    id: root
    property bool enabled: false

    function invoke(action) {
        Quickshell.execDetached([
            "qdbus6", "org.kde.kglobalaccel", "/component/kwin",
            "org.kde.kglobalaccel.Component.invokeShortcut", action,
        ]);
    }

    CustomShortcut { name: "hyprDwindleFocusLeft"; description: "Focus left"; key: root.enabled ? "Meta+Left" : ""; onPressed: root.invoke("HyprDwindleFocusLeft") }
    CustomShortcut { name: "hyprDwindleFocusRight"; description: "Focus right"; key: root.enabled ? "Meta+Right" : ""; onPressed: root.invoke("HyprDwindleFocusRight") }
    CustomShortcut { name: "hyprDwindleFocusUp"; description: "Focus up"; key: root.enabled ? "Meta+Up" : ""; onPressed: root.invoke("HyprDwindleFocusUp") }
    CustomShortcut { name: "hyprDwindleFocusDown"; description: "Focus down"; key: root.enabled ? "Meta+Down" : ""; onPressed: root.invoke("HyprDwindleFocusDown") }
    CustomShortcut { name: "hyprDwindleMoveLeft"; description: "Move left"; key: root.enabled ? "Meta+Shift+Left" : ""; onPressed: root.invoke("HyprDwindleMoveLeft") }
    CustomShortcut { name: "hyprDwindleMoveRight"; description: "Move right"; key: root.enabled ? "Meta+Shift+Right" : ""; onPressed: root.invoke("HyprDwindleMoveRight") }
    CustomShortcut { name: "hyprDwindleMoveUp"; description: "Move up"; key: root.enabled ? "Meta+Shift+Up" : ""; onPressed: root.invoke("HyprDwindleMoveUp") }
    CustomShortcut { name: "hyprDwindleMoveDown"; description: "Move down"; key: root.enabled ? "Meta+Shift+Down" : ""; onPressed: root.invoke("HyprDwindleMoveDown") }
}
