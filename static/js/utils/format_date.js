// ==============================
// FORMAT_DATE.JS
// ==============================

/**
* ============================================
* FORMAT DATE
* ============================================
* (date: Date, style: string = 'long', options?: { relative?: boolean })
* Styles:
* - 'long'        -> "Saturday June 21st"
* - 'short-long'  -> "Sat, June 21st"
* - 'short'       -> "6/21/2025"
* - 'numeric'     -> "06/21/2025"
* - 'iso'         -> "2025-06-21"
*
* Options:
* - { relative: true } enables "Today", "Tomorrow", "Yesterday" override
* ============================================ */
export function formatDate(date, style = 'long', options = {}) {
  if (!(date instanceof Date)) throw new Error("Invalid Date object");

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

  switch (style) {
    case 'numeric':
      return `${String(month + 1).padStart(2, '0')}/${String(day).padStart(2, '0')}/${year}`;
    case 'short':
      return `${month + 1}/${day}/${year}`;
    case 'iso':
      return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    case 'short-long':
      return `${shortDayNames[weekdayIndex]}, ${monthNames[month]} ${day}${getOrdinal(day)}`;
    case 'long':
    default:
      return `${fullDayNames[weekdayIndex]} ${monthNames[month]} ${day}${getOrdinal(day)}`;
  }
}

/**
* ============================================
* PARSE DATE
* ============================================
* (str: string): Date | null
* Supported input formats:
* - "MM/DD/YYYY"
* - "YYYY-MM-DD"
* Ignores invalid or unknown formats and returns null
* ============================================ */
export function parseDate(str) {
  if (typeof str !== 'string') return null;

  // Full ISO with time
  const isoFullMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})T/);
  if (isoFullMatch) {
    const y = Number(isoFullMatch[1]);
    const m = Number(isoFullMatch[2]);
    const d = Number(isoFullMatch[3]);
    return new Date(y, m - 1, d);
  }

  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const y = Number(isoMatch[1]);
    const m = Number(isoMatch[2]);
    const d = Number(isoMatch[3]);
    return new Date(y, m - 1, d);
  }

  const numericMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (numericMatch) {
    const m = Number(numericMatch[1]);
    const d = Number(numericMatch[2]);
    const y = Number(numericMatch[3]);
    return new Date(y, m - 1, d);
  }

  return null;
}

/**
* ============================================
* PARSE AND FORMAT
* ============================================
* (input: string | Date, style: string = 'long', options?: { relative?: boolean }): string
* Parses if needed, then formats. Returns '' if invalid.
* ============================================ */
export function parseAndFormat(input, style = 'long', options = {}) {
  const date = (typeof input === 'string') ? parseDate(input) : input;
  return date instanceof Date ? formatDate(date, style, options) : '';
}
