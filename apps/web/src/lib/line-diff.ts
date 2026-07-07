/**
 * Line-level diff for the debrief's YOUR REP | THE STANDARD panes (S3-4).
 * Classic LCS on lines; returns 1-based line numbers that are NOT part of
 * the common subsequence on each side. Inputs are a few dozen lines, so the
 * O(n·m) table is nothing.
 */
export function diffLines(a: string, b: string): { aChanged: number[]; bChanged: number[] } {
  const aLines = a.split("\n");
  const bLines = b.split("\n");
  const n = aLines.length;
  const m = bLines.length;

  const lcs: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i]![j] =
        aLines[i] === bLines[j]
          ? lcs[i + 1]![j + 1]! + 1
          : Math.max(lcs[i + 1]![j]!, lcs[i]![j + 1]!);
    }
  }

  const aChanged: number[] = [];
  const bChanged: number[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (aLines[i] === bLines[j]) {
      i++;
      j++;
    } else if (lcs[i + 1]![j]! >= lcs[i]![j + 1]!) {
      aChanged.push(i + 1);
      i++;
    } else {
      bChanged.push(j + 1);
      j++;
    }
  }
  while (i < n) aChanged.push(++i);
  while (j < m) bChanged.push(++j);

  return { aChanged, bChanged };
}
