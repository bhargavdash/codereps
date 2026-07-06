import { describe, expect, it } from "vitest";
import { EditorState } from "@codemirror/state";
import { gunzipBase64, replayTrace, TraceRecorder, type SerializedTrace } from "./trace";

/** Drive a real EditorState through edits, recording each transaction's changes. */
function simulateSession(starter: string, edits: { at: number; insert?: string; del?: number }[]) {
  let state = EditorState.create({ doc: starter });
  const recorder = new TraceRecorder(starter);
  for (const edit of edits) {
    const tr = state.update({
      changes: edit.del
        ? { from: edit.at, to: edit.at + edit.del }
        : { from: edit.at, insert: edit.insert ?? "" },
    });
    recorder.record(tr.changes);
    state = tr.state;
  }
  return { recorder, finalDoc: state.doc.toString() };
}

describe("TraceRecorder", () => {
  it("round-trips: gzip → base64 → decompress → replay reproduces the final code", async () => {
    const starter = "function debounce(fn, wait) {\n\n}\n";
    const { recorder, finalDoc } = simulateSession(starter, [
      { at: 30, insert: "  let timer = null;" },
      { at: 49, insert: "\n  return function (...args) {};" },
      { at: 60, del: 8 },
      { at: 60, insert: "FUNCTION" },
      { at: 60, del: 8 },
      { at: 60, insert: "function" },
    ]);

    const b64 = await recorder.serialize();
    const decoded = JSON.parse(await gunzipBase64(b64)) as SerializedTrace;
    expect(decoded.version).toBe(1);
    expect(decoded.baseDoc).toBe(starter);
    expect(replayTrace(decoded)).toBe(finalDoc);
  });

  it("a ~3-minute typing session serializes under 15KB gzipped", async () => {
    // ~1200 single-char inserts ≈ a 3-min session at ~7 keys/sec with pauses
    let state = EditorState.create({ doc: "" });
    const recorder = new TraceRecorder("");
    const source = "function pairSum(nums, target) { let left = 0; let right = nums.length - 1; }\n".repeat(16);
    for (let i = 0; i < 1200; i++) {
      const tr = state.update({ changes: { from: state.doc.length, insert: source[i % source.length] } });
      recorder.record(tr.changes);
      state = tr.state;
    }
    const b64 = await recorder.serialize();
    const gzBytes = Math.ceil((b64.length * 3) / 4);
    expect(gzBytes).toBeLessThan(15 * 1024);
    // and it still replays exactly
    const decoded = JSON.parse(await gunzipBase64(b64)) as SerializedTrace;
    expect(replayTrace(decoded)).toBe(state.doc.toString());
  });

  it("compacts overflow into the base doc without corrupting replay", () => {
    const starter = "abc";
    let state = EditorState.create({ doc: starter });
    const recorder = new TraceRecorder(starter, 10); // tiny capacity to force compaction
    for (let i = 0; i < 50; i++) {
      const tr = state.update({ changes: { from: state.doc.length, insert: String(i % 10) } });
      recorder.record(tr.changes);
      state = tr.state;
    }
    expect(recorder.size).toBe(10);
    const trace = recorder.toJSON();
    expect(trace.baseDoc).not.toBe(starter); // compaction really happened
    expect(replayTrace(trace)).toBe(state.doc.toString());
  });
});
