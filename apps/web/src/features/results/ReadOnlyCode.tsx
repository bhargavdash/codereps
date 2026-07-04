import { useMemo } from "react";
import CodeMirror, { type Extension } from "@uiw/react-codemirror";
import { EditorView, Decoration, type DecorationSet } from "@codemirror/view";
import { StateField, RangeSetBuilder } from "@codemirror/state";
import { javascript } from "@codemirror/lang-javascript";
import { codeRepsTheme } from "../practice/editorTheme";
import type { Challenge } from "../../data/types";

/** Static, read-only code with tinted changed-lines — for the debrief diff. */
function lineHighlight(lines: number[], cls: string): Extension {
  const set = new Set(lines);
  const build = (view: EditorView): DecorationSet => {
    const b = new RangeSetBuilder<Decoration>();
    for (let i = 1; i <= view.state.doc.lines; i++) {
      if (set.has(i)) {
        const line = view.state.doc.line(i);
        b.add(line.from, line.from, Decoration.line({ attributes: { class: cls } }));
      }
    }
    return b.finish();
  };
  return StateField.define<DecorationSet>({
    create: () => Decoration.none,
    update: (deco) => deco,
    provide: (f) => EditorView.decorations.from(f),
  }).init((state) => build({ state } as EditorView));
}

export function ReadOnlyCode({
  value,
  language,
  highlightLines,
  highlightKind = "your",
}: {
  value: string;
  language: Challenge["language"];
  highlightLines?: number[];
  highlightKind?: "your" | "ref";
}) {
  const extensions = useMemo<Extension[]>(() => {
    const ext: Extension[] = [...codeRepsTheme, EditorView.editable.of(false)];
    if (language !== "css") {
      ext.push(javascript({ typescript: language !== "javascript", jsx: language === "tsx" }));
    }
    if (highlightLines?.length) {
      ext.push(lineHighlight(highlightLines, highlightKind === "your" ? "cr-diff-your" : "cr-diff-ref"));
    }
    return ext;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, highlightKind, JSON.stringify(highlightLines)]);

  return (
    <CodeMirror
      value={value}
      editable={false}
      height="100%"
      style={{ height: "100%", fontSize: "12.5px" }}
      theme="none"
      extensions={extensions}
      basicSetup={{
        lineNumbers: false,
        foldGutter: false,
        highlightActiveLine: false,
        highlightActiveLineGutter: false,
        autocompletion: false,
        closeBrackets: false,
        bracketMatching: false,
        highlightSelectionMatches: false,
        drawSelection: false,
      }}
    />
  );
}
