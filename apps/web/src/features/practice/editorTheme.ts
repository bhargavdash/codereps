import { EditorView } from "@codemirror/view";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";

/** CodeMirror dark theme matching the CodeReps editor surface. */
const theme = EditorView.theme(
  {
    "&": {
      color: "var(--color-ink)",
      backgroundColor: "transparent",
      fontSize: "13.5px",
      height: "100%",
    },
    "&.cm-focused": { outline: "none" },
    ".cm-scroller": {
      fontFamily: "var(--font-mono)",
      lineHeight: "22px",
      overflow: "auto",
    },
    ".cm-content": {
      padding: "16px 0",
      caretColor: "var(--color-primary)",
    },
    ".cm-line": { padding: "0 20px" },
    ".cm-gutters": {
      backgroundColor: "var(--color-surface-2)",
      color: "var(--color-faint)",
      border: "none",
      borderRight: "1px solid var(--color-hair)",
      fontFamily: "var(--font-mono)",
    },
    ".cm-lineNumbers .cm-gutterElement": {
      padding: "0 12px 0 18px",
      minWidth: "36px",
    },
    ".cm-activeLine": { backgroundColor: "var(--color-line)" },
    ".cm-activeLineGutter": {
      backgroundColor: "transparent",
      color: "var(--color-ink-mute)",
    },
    ".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--color-primary)" },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection":
      {
        backgroundColor: "oklch(0.65 0.16 250 / 0.24)",
      },
    ".cm-selectionMatch": { backgroundColor: "oklch(0.65 0.16 250 / 0.12)" },
  },
  { dark: true },
);

const highlight = HighlightStyle.define([
  { tag: [t.keyword, t.controlKeyword, t.moduleKeyword, t.operatorKeyword], color: "var(--color-syn-key)" },
  { tag: [t.self, t.definitionKeyword], color: "var(--color-syn-key)" },
  {
    tag: [t.function(t.variableName), t.function(t.propertyName), t.definition(t.function(t.variableName))],
    color: "var(--color-syn-fn)",
  },
  { tag: [t.bool, t.null, t.number, t.atom], color: "var(--color-syn-lit)" },
  { tag: [t.string, t.special(t.string), t.regexp], color: "var(--color-syn-lit)" },
  { tag: [t.comment, t.lineComment, t.blockComment], color: "var(--color-syn-com)", fontStyle: "normal" },
  {
    tag: [t.operator, t.punctuation, t.separator, t.bracket, t.brace, t.paren, t.angleBracket],
    color: "var(--color-syn-punc)",
  },
  { tag: [t.variableName, t.propertyName, t.typeName, t.className], color: "var(--color-ink)" },
]);

export const codeRepsTheme = [theme, syntaxHighlighting(highlight)];
