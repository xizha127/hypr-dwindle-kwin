export function isEligibleWindow(window) {
    return window?.normalWindow === true
        && window.specialWindow !== true
        && window.popupWindow !== true
        && window.transient !== true
        && window.fullScreen !== true
        && window.minimized !== true
        && !(window.maximizedHorizontal === true && window.maximizedVertical === true)
        && window.onAllDesktops !== true;
}

export function windowId(window) {
    return String(window.internalId);
}
