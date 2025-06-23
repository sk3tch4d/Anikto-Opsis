// ==============================
// FORMAT_DATE.JS
// ==============================

/**
 * ============================================
 * FORMAT DATE
 * ============================================
 * (date: Date, style: string = 'long', options?: { relative?: boolean, pad?: boolean })
 * Styles:
 * - 'long'        -> "Saturday June 21st"
 * - 'short-long'  -> "Sat, June 21st"
 * - 'short'       -> "6/21/2025"
 * - 'numeric'     -> "06/21/2025"
 * - 'short-month' -> "Jun 21st"
 * - 'iso'         -> "2025-06-21"
 *
 * Options:
 * - { relative: true } enables "Today", "Tomorrow", "Yesterday"
 * - { pad: false } disables leading zero padding (numeric only)
 * ============================================ */
export function formatDate(date, style = 'long', options = {}) {
  if (!(date instanceof Date) || isNaN(date)) throw new Error("Invalid Date object");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const compareDate = new Date(date);
  compareDate.setHours(0, 0, 0, 0);

  const diffDays = Math.floor((compareDate - today) / (1000 * 60 * 60 * 24));

  if (options.relative) {
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays === -1) return "Yesterday";
  }

  const day = date.getDate();
  const month = date.getMonth();
  const year = date.getFullYear();
  const weekdayIndex = date.getDay();

  const fullDayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const shortDayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  const getOrdinal = (n) => {
    if (n > 3 && n < 21) return "th";
    switch (n % 10) {
      case 1: return "st";
      case 2: return "nd";
      case 3: return "rd";
      default: return "th";
    }
  };

  const pad = options.pad !== false;

  switch (style) {
    case 'numeric':
      return `${pad ? String(month + 1).padStart(2, '0') : month + 1}/` +
             `${pad ? String(day).padStart(2, '0') : day}/${year}`;
    case 'short':
      return `${month + 1}/${day}/${year}`;
    case 'iso':
      return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    case 'short-month':
      return `${monthNames[month].slice(0, 3)} ${day}${getOrdinal(day)}`;
    case 'short-long':
      return `${shortDayNames[weekdayIndex]}, ${monthNames[month]} ${day}${getOrdinal(day)}`;
    case 'long':
    default:
      return `${fullDayNames[weekdayIndex]}, ${monthNames[month]} ${day}${getOrdinal(day)}`;
  }
}

/**
 * ============================================
 * PARSE DATE
 * ============================================
 * (str: string): Date | null
 * Supported input formats:
 * - "YYYY-MM-DD"
 * - "YYYY-MM-DDTHH:mm:ss"
 * - "MM/DD/YYYY"
 * Falls back to native Date parsing as last resort
 * ============================================ */
export function parseDate(str) {
  if (typeof str !== 'string') return null;

  const isoFullMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})T/);
  if (isoFullMatch) {
    const [_, y, m, d] = isoFullMatch;
    return new Date(Number(y), Number(m) - 1, Number(d));
  }

  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const [_, y, m, d] = isoMatch;
    return new Date(Number(y), Number(m) - 1, Number(d));
  }

  const numericMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (numericMatch) {
    const [_, m, d, y] = numericMatch;
    return new Date(Number(y), Number(m) - 1, Number(d));
  }

  const fallback = new Date(str);
  return isNaN(fallback) ? null : fallback;
}

/**
 * ============================================
 * PARSE AND FORMAT
 * ============================================
 * (input: string | Date, style = 'long', options?): string
 * Parses if needed, then formats. Returns '' if invalid.
 * ============================================ */
export function parseAndFormat(input, style = 'long', options = {}) {
  const date = typeof input === 'string' ? parseDate(input) : input;
  return (date instanceof Date && !isNaN(date)) ? formatDate(date, style, options) : '';
}
