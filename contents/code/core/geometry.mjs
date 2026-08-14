export function insetRect(rect, amount) {
    const inset = Math.max(0, amount);
    return {
        x: rect.x + inset,
        y: rect.y + inset,
        width: Math.max(0, rect.width - inset * 2),
        height: Math.max(0, rect.height - inset * 2),
    };
}
