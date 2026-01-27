/**
 * 精度工具
 * 从币对接口的 precision 字符串得到小数位数
 * quote_precision: "0.1" -> 1位小数（价格）
 * base_asset_precision: "0.001" -> 3位小数（数量）
 */

/**
 * 从精度字符串得到小数位数
 * @param {string|number} precision - 如 "0.1"（一位小数）、"0.001"（三位小数）
 * @param {number} defaultDecimals - 无法解析时的默认小数位
 * @returns {number} 小数位数
 */
export function getPrecisionDecimals(precision, defaultDecimals = 2) {
  if (precision == null || precision === '') return defaultDecimals;
  const s = String(precision);
  if (s.includes('.')) {
    return s.split('.')[1].length;
  }
  if (Number(s) >= 1) return 0;
  return defaultDecimals;
}
