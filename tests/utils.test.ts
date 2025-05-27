import { describe, expect, it, vi } from "vitest";
import { isCyclic, logCyclicError } from "../src/utils";

describe("utils", () => {
  it("isCyclic detects cycles", () => {
    const obj: any = { id: 1 };
    obj.self = obj;
    expect(isCyclic(obj)).toBe(true);

    const acyclic = { id: 1, data: { value: 2 } };
    expect(isCyclic(acyclic)).toBe(false);
  });

  it("logCyclicError logs in development", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    logCyclicError({ id: 1 }, ["root", "self"], "Test");
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
