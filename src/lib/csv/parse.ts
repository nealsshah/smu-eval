/**
 * Parse a CSV string into headers and rows.
 * Handles quoted fields (fields containing commas or newlines wrapped in double quotes),
 * BOM characters, and trims whitespace.
 */
export function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  // Strip BOM if present
  const cleaned = text.replace(/^\uFEFF/, "");
  const lines = splitCsvLines(cleaned);

  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = parseCsvLine(lines[0]).map((h) => h.trim());
  const rows = lines
    .slice(1)
    .filter((line) => line.trim() !== "")
    .map((line) => parseCsvLine(line).map((cell) => cell.trim()));

  return { headers, rows };
}

/** Split CSV text into lines, respecting quoted fields that may contain newlines. */
function splitCsvLines(text: string): string[] {
  const lines: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (ch === '"') {
      inQuotes = !inQuotes;
      current += ch;
    } else if ((ch === "\n" || ch === "\r") && !inQuotes) {
      // Handle \r\n
      if (ch === "\r" && text[i + 1] === "\n") {
        i++;
      }
      lines.push(current);
      current = "";
    } else {
      current += ch;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}

/** Parse a single CSV line into an array of field values. */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (inQuotes) {
      if (ch === '"') {
        // Escaped quote ("") or end of quoted field
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        fields.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
  }

  fields.push(current);
  return fields;
}

/** Normalize a header string for flexible matching. */
function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/[_\-]/g, "").replace(/\s+/g, "").trim();
}

const HEADER_MATCHERS: Record<string, (h: string) => boolean> = {
  "first name": (h) => {
    const n = normalizeHeader(h);
    return n === "firstname" || n === "first" || n === "fname";
  },
  "last name": (h) => {
    const n = normalizeHeader(h);
    return n === "lastname" || n === "last" || n === "lname";
  },
  email: (h) => {
    const n = normalizeHeader(h);
    return n === "email" || n === "emailaddress" || n === "e-mail" || n === "mail";
  },
  group: (h) => {
    const n = normalizeHeader(h);
    return n === "group" || n === "groupname" || n === "team";
  },
};

/** Validate that the CSV headers contain the required columns. */
export function validateCsvHeaders(headers: string[]): {
  valid: boolean;
  missing: string[];
} {
  const missing = Object.entries(HEADER_MATCHERS)
    .filter(([, matcher]) => !headers.some(matcher))
    .map(([label]) => label);

  return { valid: missing.length === 0, missing };
}

/** Map raw CSV headers to standard column indices. Returns -1 if not found. */
export function mapHeaderIndices(headers: string[]): {
  firstName: number;
  lastName: number;
  email: number;
  group: number;
} {
  return {
    firstName: headers.findIndex(HEADER_MATCHERS["first name"]),
    lastName: headers.findIndex(HEADER_MATCHERS["last name"]),
    email: headers.findIndex(HEADER_MATCHERS["email"]),
    group: headers.findIndex(HEADER_MATCHERS["group"]),
  };
}
