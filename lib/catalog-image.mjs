// Encode filename characters in local asset paths without double-encoding URLs.
export function catalogImageUrl(source) {
  if (!source.startsWith("/") || source.startsWith("//")) return source;
  return source.split("/").map((segment) => {
    let decoded = segment;
    try { decoded = decodeURIComponent(segment); } catch { /* Literal percent signs in a filename. */ }
    return encodeURIComponent(decoded);
  }).join("/");
}
