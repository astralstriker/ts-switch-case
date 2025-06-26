export function logCyclicError(
  obj: any,
  path: string[],
  context: string,
): void {
  console.warn("[Cyclic Reference]", {
    timestamp: new Date().toISOString(),
    context,
    path: path.join(" -> "),
    objectType: obj?.constructor?.name || "unknown",
  });
}

export function isCyclic(
  obj: any,
  currentPath = new WeakSet(),
  pathArray: any[] = [],
  path = ["root"],
) {
  if (obj && typeof obj === "object") {
    if (currentPath.has(obj)) {
      return true;
    }
    currentPath.add(obj);
    pathArray.push(obj);

    for (const key in obj) {
      // Create new WeakSet and populate it
      const newPath = new WeakSet();
      pathArray.forEach((item) => newPath.add(item));

      if (isCyclic(obj[key], newPath, [...pathArray], [...path, key])) {
        return true;
      }
    }
  }
  return false;
}
