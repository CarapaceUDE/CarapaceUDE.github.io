/** Normalize clause-separator dashes in user-facing copy. */
const UNICODE_DASHES = /[\u2010\u2011\u2012\u2013\u2014\u2015\u2212\uFE58\uFE63\uFF0D]/g;
const SPACED_CLAUSE_DASH =
  /\s*(?:[\u2010\u2011\u2012\u2013\u2014\u2015\u2212]|\s-\s)\s*(?=[A-Za-z"'])/g;

export function sanitizeCopyText(text) {
  if (!text || typeof text !== "string") return text;
  return text
    .replace(SPACED_CLAUSE_DASH, ", ")
    .replace(UNICODE_DASHES, ",")
    .replace(/,\s*,+/g, ", ")
    .replace(/\s+,/g, ",")
    .replace(/,\s+$/g, "")
    .trim();
}

export function sanitizeSlide(slide) {
  if (!slide || typeof slide !== "object") return slide;
  const out = { ...slide };
  for (const field of ["eyebrow", "title", "sub", "note"]) {
    if (out[field]) out[field] = sanitizeCopyText(out[field]);
  }
  if (Array.isArray(out.proof)) {
    out.proof = out.proof.map((chip) => {
      const next = { ...chip };
      if (next.label) next.label = sanitizeCopyText(next.label);
      if (next.detail) next.detail = sanitizeCopyText(next.detail);
      if (Array.isArray(next.nodes)) {
        next.nodes = next.nodes.map((line) => (line ? sanitizeCopyText(line) : line));
      }
      return next;
    });
  }
  return out;
}

export function copyHasClauseDash(text) {
  if (!text) return false;
  return UNICODE_DASHES.test(text) || /\s-\s+[A-Za-z"']/.test(text);
}