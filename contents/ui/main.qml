// Required KWin package entry point; metadata selects Entry.qml.
import QtQuick
import org.kde.kwin
import "../runtime/main.mjs" as HyprDwindle

Item {
    id: root

    ShortcutHandler { id: focusLeft; name: "HyprDwindleFocusLeft"; text: "Hypr Dwindle: Focus left"; sequence: "Meta+Left" }
    ShortcutHandler { id: focusRight; name: "HyprDwindleFocusRight"; text: "Hypr Dwindle: Focus right"; sequence: "Meta+Right" }
    ShortcutHandler { id: focusUp; name: "HyprDwindleFocusUp"; text: "Hypr Dwindle: Focus up"; sequence: "Meta+Up" }
    ShortcutHandler { id: focusDown; name: "HyprDwindleFocusDown"; text: "Hypr Dwindle: Focus down"; sequence: "Meta+Down" }
    ShortcutHandler { id: moveLeft; name: "HyprDwindleMoveLeft"; text: "Hypr Dwindle: Move left"; sequence: "Meta+Shift+Left" }
    ShortcutHandler { id: moveRight; name: "HyprDwindleMoveRight"; text: "Hypr Dwindle: Move right"; sequence: "Meta+Shift+Right" }
    ShortcutHandler { id: moveUp; name: "HyprDwindleMoveUp"; text: "Hypr Dwindle: Move up"; sequence: "Meta+Shift+Up" }
    ShortcutHandler { id: moveDown; name: "HyprDwindleMoveDown"; text: "Hypr Dwindle: Move down"; sequence: "Meta+Shift+Down" }
    ShortcutHandler { id: toggleFloat; name: "HyprDwindleToggleFloat"; text: "Hypr Dwindle: Toggle floating"; sequence: "Meta+Alt+Space" }
    ShortcutHandler { id: toggleMaximize; name: "HyprDwindleToggleMaximize"; text: "Hypr Dwindle: Toggle maximize"; sequence: "Meta+D" }
    ShortcutHandler { id: toggleFullscreen; name: "HyprDwindleToggleFullscreen"; text: "Hypr Dwindle: Toggle fullscreen"; sequence: "Meta+F" }
    ShortcutHandler { id: shrinkSplit; name: "HyprDwindleAdjustSplitDecrease"; text: "Hypr Dwindle: Shrink split"; sequence: "Meta+;" }
    ShortcutHandler { id: growSplit; name: "HyprDwindleAdjustSplitIncrease"; text: "Hypr Dwindle: Grow split"; sequence: "Meta+'" }
    ShortcutHandler { id: rebuild; name: "HyprDwindleRebuildCurrentRoot"; text: "Hypr Dwindle: Rebuild current root"; sequence: "" }

    Component.onCompleted: HyprDwindle.main({
        workspace: Workspace,
        kwin: KWin,
        qt: Qt,
        console: console,
        shortcuts: {
            focusLeft, focusRight, focusUp, focusDown,
            moveLeft, moveRight, moveUp, moveDown,
            toggleFloat, toggleMaximize, toggleFullscreen,
            shrinkSplit, growSplit, rebuild
        }
    })
}
