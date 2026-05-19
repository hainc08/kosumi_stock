const DIACRITICS = /[̀-ͯ]/g;

/**
 * Generates a short, unique-ish code from a Vietnamese display name.
 *
 * Strategy:
 *   1. NFD decompose → strip combining diacritics (̀-ͯ)
 *   2. Replace đ/Đ → d
 *   3. Uppercase, keep only [A-Z0-9]
 *   4. Split on whitespace, take up to 4 chars per word, cap at 12 total
 *   5. Append 4-char random alphanumeric suffix for uniqueness
 *
 * Result is always non-empty, max ~16 chars (backend limit is 20).
 *
 * Examples:
 *   "ống"       → "ONGA3B2"
 *   "Tấm inox"  → "TAMINOA1C3"
 *   "Cây tre"   → "CAYTREA9F1"
 *
 * If the backend returns 409 DUPLICATE_CODE (collision), the modal
 * surfaces the error and lets the user enter a custom code manually.
 */
export function generateCode(name: string): string {
  const base = name
    .normalize('NFD')
    .replace(DIACRITICS, '')
    .replace(/[đĐ]/g, 'd')
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.slice(0, 4))
    .join('')
    .slice(0, 12);

  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return (base || 'CODE') + rand;
}
