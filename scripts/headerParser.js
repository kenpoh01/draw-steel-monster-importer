export function parseHeaderLine(line) {
  const maliceMatch = line.match(/^([a-z])\s+(.+?)\s+(\d+)\s+malice$/i);
  if (maliceMatch) {
    return {
      type: maliceMatch[1],
      name: maliceMatch[2],
      cost: parseInt(maliceMatch[3], 10),
      category: "malice"
    };
  }

  const signatureMatch = line.match(/^([a-z])\s+(.+?)\s+signature ability$/i);
  if (signatureMatch) {
    return {
      type: signatureMatch[1],
      name: signatureMatch[2],
      cost: null,
      category: "signature"
    };
  }

  return null;
}