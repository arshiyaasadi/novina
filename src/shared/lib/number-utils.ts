/**
 * Converts Persian and Arabic digits to English digits
 * @param text - The text containing Persian/Arabic digits
 * @returns The text with all digits converted to English
 * 
 * @example
 * convertToEnglishDigits("۰۹۱۲۳۴۵۶۷۸۹") // returns "09123456789"
 * convertToEnglishDigits("٠٩١٢٣٤٥٦٧٨٩") // returns "09123456789"
 */
export function convertToEnglishDigits(text: string): string {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  const arabicDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  
  let result = text;
  
  // Convert Persian digits
  persianDigits.forEach((persian, index) => {
    result = result.replace(new RegExp(persian, "g"), index.toString());
  });
  
  // Convert Arabic digits
  arabicDigits.forEach((arabic, index) => {
    result = result.replace(new RegExp(arabic, "g"), index.toString());
  });
  
  return result;
}

