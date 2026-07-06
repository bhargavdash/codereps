/**
 * Ghost-trace recorder — board S2-3 / architecture will-bite #3: record from
 * day one even though replay ships post-MVP (FF-1); retrofitting is
 * impossible.
 *
 * Every doc-changing transaction appends {dtMs, changes} (CM6 ChangeSet
 * JSON). A capacity cap keeps memory bounded: instead of dropping old
 * entries (which would break replay), overflow entries are composed into the
 * base document snapshot, so replay always starts from `baseDoc` and
 * reproduces the final code exactly.
 */

import { ChangeSet, Text } from "@codemirror/state";

export interface TraceEntry {
  dtMs: number;
  changes: unknown; // ChangeSet.toJSON()
}

export interface SerializedTrace {
  version: 1;
  /** Document the entries replay on top of (starter code unless compacted). */
  baseDoc: string;
  entries: TraceEntry[];
}

const now = (): number => performance.now();

export class TraceRecorder {
  private baseDoc: Text;
  private entries: { dtMs: number; changes: ChangeSet }[] = [];
  private lastAt: number;

  constructor(
    starterDoc: string,
    /** Max in-memory entries before oldest edits are compacted into baseDoc. */
    private readonly capacity = 5000,
  ) {
    this.baseDoc = Text.of(starterDoc.split("\n"));
    this.lastAt = now();
  }

  record(changes: ChangeSet): void {
    const at = now();
    this.entries.push({ dtMs: Math.max(0, Math.round(at - this.lastAt)), changes });
    this.lastAt = at;

    while (this.entries.length > this.capacity) {
      const oldest = this.entries.shift();
      if (oldest) this.baseDoc = oldest.changes.apply(this.baseDoc);
    }
  }

  get size(): number {
    return this.entries.length;
  }

  toJSON(): SerializedTrace {
    return {
      version: 1,
      baseDoc: this.baseDoc.toString(),
      entries: this.entries.map((e) => ({ dtMs: e.dtMs, changes: e.changes.toJSON() })),
    };
  }

  /** gzip + base64 — the shape the submit payload carries (~2-10KB gz). */
  async serialize(): Promise<string> {
    return gzipBase64(JSON.stringify(this.toJSON()));
  }
}

/** Replay a trace onto its base document; returns the reconstructed final code. */
export function replayTrace(trace: SerializedTrace): string {
  let doc = Text.of(trace.baseDoc.split("\n"));
  for (const entry of trace.entries) {
    doc = ChangeSet.fromJSON(entry.changes).apply(doc);
  }
  return doc.toString();
}

export async function gzipBase64(text: string): Promise<string> {
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream("gzip"));
  const bytes = new Uint8Array(await new Response(stream).arrayBuffer());
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

export async function gunzipBase64(b64: string): Promise<string> {
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
  return new Response(stream).text();
}
