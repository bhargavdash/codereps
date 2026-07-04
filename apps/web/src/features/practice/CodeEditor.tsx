import { useMemo } from "react";
import CodeMirror, { type Extension } from "@uiw/react-codemirror";
import { EditorView } from "@codemirror/view";
import { javascript } from "@codemirror/lang-javascript";
import { codeRepsTheme } from "./editorTheme";
import type { RepSession } from "./useRepSession";
import type { Challenge } from "../../data/types";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: Challenge["language"];
  handlers: RepSession["handlers"];
  onCursor?: (line: number, col: number) => void;
}

export function CodeEditor({ value, onChange, language, handlers, onCursor }: CodeEditorProps) {
  const extensions = useMemo<Extension[]>(() => {
    const ext: Extension[] = [...codeRepsTheme];
    if (language !== "css") {
      ext.push(javascript({ typescript: language !== "javascript", jsx: language === "tsx" }));
    }
    ext.push(
      EditorView.domEventHandlers({
        keydown: (e) => {
          handlers.keydown(e);
          return false;
        },
        paste: (e) => handlers.paste(e),
        focus: () => {
          handlers.focus();
          return false;
        },
        blur: () => {
          handlers.blur();
          return false;
        },
      }),
    );
    return ext;
  }, [language, handlers]);

  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      height="100%"
      style={{ height: "100%", fontSize: "13.5px" }}
      theme="none"
      extensions={extensions}
      basicSetup={{
        lineNumbers: true,
        highlightActiveLine: true,
        highlightActiveLineGutter: true,
        foldGutter: false,
        // this is a fluency tool: no autocomplete, no auto-close, no hints
        autocompletion: false,
        closeBrackets: false,
        bracketMatching: true,
        indentOnInput: true,
        highlightSelectionMatches: false,
      }}
      indentWithTab
      spellCheck={false}
      onUpdate={(u) => {
        if (!onCursor || !u.selectionSet) return;
        const head = u.state.selection.main.head;
        const line = u.state.doc.lineAt(head);
        onCursor(line.number, head - line.from + 1);
      }}
    />
  );
}
