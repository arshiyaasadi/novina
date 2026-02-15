/**
 * Converts Persian and Arabic digits to English digits.
 * Use this for any user-facing text that may contain Persian/Arabic numerals.
 *
 * @example
 * convertToEnglishDigits("۰۹۱۲۳۴۵۶۷۸۹") // "09123456789"
 * convertToEnglishDigits("٠٩١٢٣٤٥٦٧٨٩") // "09123456789"
 */
export function convertToEnglishDigits(text: string): string {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  const arabicDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];

  let result = text;
  persianDigits.forEach((persian, index) => {
    result = result.replace(new RegExp(persian, "g"), index.toString());
  });
  arabicDigits.forEach((arabic, index) => {
    result = result.replace(new RegExp(arabic, "g"), index.toString());
  });
  return result;
}

export type NormalizeNumericInputOptions = {
  /** If true (default), strip everything except 0-9. If false, only convert digits. */
  digitsOnly?: boolean;
};

/**
 * Normalizes numeric input: Persian/Arabic digits → English, optionally digits only.
 * Use in onChange for any input that expects numbers (amount, percentage, phone, OTP, etc.).
 *
 * @example
 * // Percentage / integer only
 * onChange={(e) => setValue(normalizeNumericInput(e.target.value))}
 * // Allow commas (e.g. formatted amount) then strip when parsing
 * onChange={(e) => setValue(normalizeNumericInput(e.target.value, { digitsOnly: false }))}
 */
export function normalizeNumericInput(
  value: string,
  options: NormalizeNumericInputOptions = {}
): string {
  const { digitsOnly = true } = options;
  const normalized = convertToEnglishDigits(value);
  return digitsOnly ? normalized.replace(/\D/g, "") : normalized;
}

