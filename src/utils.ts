export function logCyclicError(
  obj: any,
  path: string[],
  context: string,
): void {
  console.error("[Cyclic Reference]", {
    timestamp: new Date().toISOString(),
    context,
    path: path.join(" -> "),
    objectType: obj?.constructor?.name || "unknown",
  });
}

export function isCyclic(
  obj: any,
  seen = new WeakSet(),
  path: string[] = ["root"],
): boolean {
  if (obj && typeof obj === "object") {
    if (seen.has(obj)) {
      logCyclicError(obj, path, "Cycle detected");
      return true;
    }
    seen.add(obj);
    for (const key in obj) {
      if (isCyclic(obj[key], seen, [...path, key])) return true;
    }
  }
  return false;
}
