// project/src/util/functions/Search.tsx
export type ParsedSearch = {
  raw: string;
  parts: string[];
};

export type MatchResult = {
  isMatch: boolean;
  score: number;
  matched: Record<string, string[]>;
};

// SCHEMA DEFINITIONS
export function customerSearchSchema(customer: any) {
  return {
    fields: {
      first: (customer.first_name ?? "").toLowerCase(),
      last: (customer.last_name ?? "").toLowerCase(),
    },
    order: ["first", "last"],
  };
}

export function customerPhoneSchema(customer: any) {
  return {
    fields: {
      phone: (customer.phone ?? "").replace(/\D/g, ""), // digits only
    },
    order: ["phone"],
  };
}

export function customerEmailSchema(customer: any) {
  return {
    fields: {
      email: (customer.email ?? "").toLowerCase(),
    },
    order: ["email"],
  };
}

// SEARCH CONTEXTS
export function determineSearchContext(
  raw: string,
  customers: any[]
): {
  type: "name" | "email" | "phone" | null;
  schema: (c: any) => any;
  bestMatch: any | null;
  parsed: ParsedSearch;
} {
  const parsed = parseSearchTerm(raw);

  if (isAllDigitsOrDashesOrParentheses(raw)) {
    const digits = raw.replace(/[^0-9]/g, "");
    console.log(digits);
    return {
      type: "phone",
      schema: customerPhoneSchema,
      bestMatch: getBestPhoneMatch(digits, customers, customerPhoneSchema),
      parsed: {
        raw: digits,
        parts: [digits],
      },
    };
  }

  if (raw.includes("@")) {
    return {
      type: "email",
      schema: customerEmailSchema,
      bestMatch: getBestEmailMatch(raw, customers, customerEmailSchema),
      parsed,
    };
  }

  // name search first
  let best = getBestNameMatchByFirstThenLast(
    raw,
    customers,
    customerSearchSchema
  );

  // fallback to email search even without @
  if (!best) {
    best = getBestEmailMatch(raw, customers, customerEmailSchema);
    return {
      type: "email",
      schema: customerEmailSchema,
      bestMatch: best,
      parsed,
    };
  }

  return {
    type: "name",
    schema: customerSearchSchema,
    bestMatch: best,
    parsed,
  };
}

// HELPER FUNCTIONS => GET BEST MATCH DEFINITIONS
export function getBestNameMatchByFirstThenLast<T>(
  searchTerm: string,
  list: T[],
  schemaBuilder: (item: T) => any
): T | null {
  const parsed = parseSearchTerm(searchTerm);

  for (const item of list) {
    const schema = schemaBuilder(item);
    const result = runSearchMatch(parsed, schema);
    if (result.isMatch && result.matched.first?.length) {
      return item;
    }
  }
  for (const item of list) {
    const schema = schemaBuilder(item);
    const result = runSearchMatch(parsed, schema);
    if (result.isMatch && result.matched.last?.length) {
      return item;
    }
  }
  return null;
}

export function getBestPhoneMatch<T>(
  searchTerm: string,
  list: T[],
  schemaBuilder: (item: T) => any
): T | null {
  const parsed = parseSearchTerm(searchTerm);

  for (const item of list) {
    const schema = schemaBuilder(item);
    const result = runSearchMatch(parsed, schema);
    if (result.isMatch && result.matched.phone?.length) {
      return item;
    }
  }
  return null;
}

export function getBestEmailMatch<T>(
  searchTerm: string,
  list: T[],
  schemaBuilder: (item: T) => any
): T | null {
  const parsed = parseSearchTerm(searchTerm);

  for (const item of list) {
    const schema = schemaBuilder(item);
    const result = runSearchMatch(parsed, schema);
    if (result.isMatch && result.matched.email?.length) {
      return item;
    }
  }
  return null;
}

// HELPER FUNCTIONS
export function isAllDigitsOrDashesOrParentheses(str: string): boolean {
  return /^[\d\-()]+$/.test(str);
}

export function parseSearchTerm(raw: string | null | undefined): ParsedSearch {
  if (!raw) return { raw: "", parts: [] };
  const cleaned = raw.toLowerCase().trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  return {
    raw: cleaned,
    parts,
  };
}

export function runSearchMatch(
  parsed: ParsedSearch,
  schema: { fields: Record<string, string>; order: string[] }
): MatchResult {
  const { parts } = parsed;
  if (!parts.length) return { isMatch: false, score: 0, matched: {} };
  const matched: Record<string, string[]> = {};
  let score = 0;

  if (parts.length === 1) {
    const token = parts[0];
    for (const field of Object.keys(schema.fields)) {
      const value = schema.fields[field];
      if (value.startsWith(token)) {
        score++;
        if (!matched[field]) matched[field] = [];
        matched[field].push(token);
      }
    }
    return {
      isMatch: score > 0,
      score,
      matched,
    };
  }

  let allMatched = true;
  parts.forEach((token, index) => {
    const field = schema.order[index] || schema.order[schema.order.length - 1];
    const value = schema.fields[field];
    if (value.startsWith(token)) {
      score++;
      if (!matched[field]) matched[field] = [];
      matched[field].push(token);
    } else {
      allMatched = false;
    }
  });

  return {
    isMatch: allMatched,
    score: allMatched ? score : 0,
    matched: allMatched ? matched : {},
  };
}

export function scrollToItem(
  id: string,
  itemRefs: React.RefObject<Record<string, HTMLDivElement | null>>,
  scrollRef: React.RefObject<HTMLDivElement | null>,
  offset: number = 0
): void {
  const el = itemRefs.current[id];
  const container = scrollRef.current;
  if (!el || !container) return;
  container.scrollTo({
    top: el.offsetTop - offset,
    behavior: "auto",
  });
}
export function highlightText(
  text: string,
  matches: string[],
  getStyle: () => React.CSSProperties
) {
  if (!matches.length) return text;

  const isPhoneMatch = matches.every((m) => /^\d+$/.test(m));

  return isPhoneMatch
    ? highlightPhone(text, matches, getStyle)
    : highlightNormal(text, matches, getStyle);
}


function highlightNormal(
  text: string,
  matches: string[],
  getStyle: () => React.CSSProperties
) {
  const result: any[] = [];
  let remaining = text;
  let keyCounter = 0;

  matches.forEach((match) => {
    const lower = remaining.toLowerCase();
    const idx = lower.indexOf(match.toLowerCase());
    if (idx === -1) return;

    const before = remaining.slice(0, idx);
    const hit = remaining.slice(idx, idx + match.length);
    const after = remaining.slice(idx + match.length);

    if (before) {
      result.push(<span key={`n-${keyCounter++}`}>{before}</span>);
    }

    result.push(
      <span key={`h-${keyCounter++}`} style={getStyle()}>
        {hit}
      </span>
    );

    remaining = after;
  });

  if (remaining) {
    result.push(<span key={`n-${keyCounter++}`}>{remaining}</span>);
  }

  return <>{result}</>;
}

function highlightPhone(
  text: string,
  matches: string[],
  getStyle: () => React.CSSProperties
) {
  const formatted = text;
  const raw = text.replace(/\D/g, "");

  const rawToFmtIndex: number[] = [];
  let rawIndex = 0;

  for (let fmtIndex = 0; fmtIndex < formatted.length; fmtIndex++) {
    if (/\d/.test(formatted[fmtIndex])) {
      rawToFmtIndex[rawIndex] = fmtIndex;
      rawIndex++;
    }
  }

  const spans: { startFmt: number; endFmt: number }[] = [];

  for (const match of matches) {
    const rawStart = raw.indexOf(match);
    if (rawStart === -1) continue;

    const rawEnd = rawStart + match.length - 1;

    spans.push({
      startFmt: rawToFmtIndex[rawStart],
      endFmt: rawToFmtIndex[rawEnd],
    });
  }

  if (!spans.length) return text;

  const result: any[] = [];
  let i = 0;
  let spanIndex = 0;

  while (i < formatted.length) {
    const span = spans[spanIndex];

    if (!span) {
      result.push(<span key={`p-${i}`}>{formatted.slice(i)}</span>);
      break;
    }

    if (i < span.startFmt) {
      result.push(<span key={`p-${i}`}>{formatted[i]}</span>);
      i++;
      continue;
    }

    if (i >= span.startFmt && i <= span.endFmt) {
      let chunk = "";
      const style = getStyle();

      while (i <= span.endFmt) {
        chunk += formatted[i];
        i++;
      }

      result.push(
        <span key={`h-${i}`} style={style}>
          {chunk}
        </span>
      );

      spanIndex++;
      continue;
    }
  }

  return <>{result}</>;
}