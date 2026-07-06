import { useMemo, useRef } from "react";
import CodeMirror, { type Extension } from "@uiw/react-codemirror";
import {
  EditorView,
  drawSelection,
  dropCursor,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
} from "@codemirror/view";
import { EditorState, type ChangeSet } from "@codemirror/state";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { bracketMatching, indentOnInput, indentUnit } from "@codemirror/language";
// closeBrackets happens to live in the @codemirror/autocomplete package; the
// architecture §8 ban is on the autocompletion() extension (completion
// popups), which never enters this file. closeBrackets is a mechanical aid
// the board explicitly keeps.
import { closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
import { javascript } from "@codemirror/lang-javascript";
import { codeRepsTheme } from "./editorTheme";
import type { Language } from "@codereps/shared";

export type FaultKind = "paste" | "drop" | "middle-click-paste";

interface RepEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: Language;
  /** strict: block AND count (default). relaxed: count only — Profile.settings.strictPaste. */
  strictPaste?: boolean;
  onFault?: (kind: FaultKind) => void;
  /** Called with the number of counted keystrokes (user-event transactions only). */
  onKeystrokes?: (delta: number) => void;
  /** Every doc-changing transaction's ChangeSet — feed the TraceRecorder (S2-3). */
  onTraceChanges?: (changes: ChangeSet) => void;
  onCursor?: (line: number, col: number) => void;
  onFocusChange?: (focused: boolean) => void;
}

/**
 * The rep editor — board S2-1/S2-2. Hand-picked extensions ONLY; no
 * basicSetup (it bundles autocompletion), no completion popups ever.
 */
export function RepEditor({
  value,
  onChange,
  language,
  strictPaste = true,
  onFault,
  onKeystrokes,
  onTraceChanges,
  onCursor,
  onFocusChange,
}: RepEditorProps) {
  // Callbacks live in a ref so the extension set only reconfigures when
  // language/strictPaste change, not on every parent render.
  const cb = useRef({ onFault, onKeystrokes, onTraceChanges, onCursor, onFocusChange });
  cb.current = { onFault, onKeystrokes, onTraceChanges, onCursor, onFocusChange };

  const extensions = useMemo<Extension[]>(() => {
    const guard = (kind: FaultKind, e: Event): boolean => {
      cb.current.onFault?.(kind);
      if (strictPaste) {
        e.preventDefault();
        return true; // handled — CM must not process it either
      }
      return false;
    };

    return [
      ...codeRepsTheme,

      // --- the hand-picked set (architecture §8) ---
      lineNumbers(),
      highlightActiveLine(),
      highlightActiveLineGutter(),
      history(),
      drawSelection(),
      dropCursor(),
      bracketMatching(),
      closeBrackets(),
      indentOnInput(),
      indentUnit.of("  "),
      EditorState.tabSize.of(2),
      keymap.of([...closeBracketsKeymap, ...defaultKeymap, ...historyKeymap, indentWithTab]),
      javascript({ typescript: language === "typescript" || language === "tsx", jsx: language === "tsx" }),

      // --- anti-AI posture: paste/drop guard + fault counting ---
      EditorView.domEventHandlers({
        paste: (e) => guard("paste", e),
        drop: (e) => guard("drop", e),
        // Linux X11 primary-selection paste arrives via middle click
        mousedown: (e) => (e.button === 1 ? guard("middle-click-paste", e) : false),
      }),
      // belt-and-braces: even if a paste slips past the DOM handler, it inserts nothing
      ...(strictPaste ? [EditorView.clipboardInputFilter.of(() => "")] : []),

      // --- metrics + ghost trace ---
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          let typed = 0;
          for (const tr of update.transactions) {
            if (!tr.docChanged) continue;
            cb.current.onTraceChanges?.(tr.changes);
            // keystrokes = typing effort: real input + deletions; undo/redo
            // and programmatic updates don't count
            if (tr.isUserEvent("input.type") || tr.isUserEvent("delete")) typed += 1;
          }
          if (typed > 0) cb.current.onKeystrokes?.(typed);
        }
        if (update.selectionSet && cb.current.onCursor) {
          const head = update.state.selection.main.head;
          const line = update.state.doc.lineAt(head);
          cb.current.onCursor(line.number, head - line.from + 1);
        }
        if (update.focusChanged) cb.current.onFocusChange?.(update.view.hasFocus);
      }),
    ];
  }, [language, strictPaste]);

  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      height="100%"
      style={{ height: "100%", fontSize: "13.5px" }}
      theme="none"
      basicSetup={false}
      extensions={extensions}
      spellCheck={false}
    />
  );
}
