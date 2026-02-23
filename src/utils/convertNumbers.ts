/**
 * Chuyển từ số tiếng Việt sang chữ số
 * VD: 'tám' => '8', 'chấm' => '.', 'phẩy' => ','
 */

// Từ đơn -> ký tự (ưu tiên thay thế theo thứ tự dài -> ngắn để tránh "mười" bị tách thành "m" + "ười")
const WORD_TO_CHAR: [RegExp | string, string][] = [
  // Dấu câu
  [/\bchấm\b/gi, '.'],
  [/\bphẩy\b/gi, ','],

  // Số đơn 0-9
  [/\bkhông\b/gi, '0'],
  [/\bmột\b/gi, '1'],
  [/\bhai\b/gi, '2'],
  [/\bba\b/gi, '3'],
  [/\bbốn\b/gi, '4'],
  [/\btư\b/gi, '4'], // số ghép (hai mươi tư...) đã xử lý trước
  [/\bnăm\b/gi, '5'], // số ghép (năm mươi, mười năm...) đã xử lý trước
  [/\bsáu\b/gi, '6'],
  [/\bbảy\b/gi, '7'],
  [/\btám\b/gi, '8'],
  [/\bchín\b/gi, '9'],

  // Mốt (trong hai mốt, ba mốt...)
  [/\bmốt\b/gi, '1'],
  [/\blẻ\b/gi, ' '], // "lẻ" trong "mười lẻ năm" -> space
]

// Số ghép: mười một, hai mươi, v.v.
const COMPOUND_PATTERNS: [RegExp, () => string][] = [
  // mười một (11) -> mười chín (19)
  [/\bmười\s+một\b/gi, () => '11'],
  [/\bmười\s+hai\b/gi, () => '12'],
  [/\bmười\s+ba\b/gi, () => '13'],
  [/\bmười\s+bốn\b/gi, () => '14'],
  [/\bmười\s+lăm\b/gi, () => '15'],
  [/\bmười\s+năm\b/gi, () => '15'],
  [/\bmười\s+sáu\b/gi, () => '16'],
  [/\bmười\s+bảy\b/gi, () => '17'],
  [/\bmười\s+tám\b/gi, () => '18'],
  [/\bmười\s+chín\b/gi, () => '19'],
  [/\bmười\b/gi, () => '10'],

  // hai mươi, hai mươi mốt, ...
  [/\bhai\s+mươi\s+mốt\b/gi, () => '21'],
  [/\bhai\s+mươi\s+hai\b/gi, () => '22'],
  [/\bhai\s+mươi\s+ba\b/gi, () => '23'],
  [/\bhai\s+mươi\s+tư\b/gi, () => '24'],
  [/\bhai\s+mươi\s+lăm\b/gi, () => '25'],
  [/\bhai\s+mươi\s+năm\b/gi, () => '25'],
  [/\bhai\s+mươi\s+sáu\b/gi, () => '26'],
  [/\bhai\s+mươi\s+bảy\b/gi, () => '27'],
  [/\bhai\s+mươi\s+tám\b/gi, () => '28'],
  [/\bhai\s+mươi\s+chín\b/gi, () => '29'],
  [/\bhai\s+mươi\b/gi, () => '20'],

  [/\bba\s+mươi\s+mốt\b/gi, () => '31'],
  [/\bba\s+mươi\s+hai\b/gi, () => '32'],
  [/\bba\s+mươi\s+ba\b/gi, () => '33'],
  [/\bba\s+mươi\s+tư\b/gi, () => '34'],
  [/\bba\s+mươi\s+lăm\b/gi, () => '35'],
  [/\bba\s+mươi\s+năm\b/gi, () => '35'],
  [/\bba\s+mươi\s+sáu\b/gi, () => '36'],
  [/\bba\s+mươi\s+bảy\b/gi, () => '37'],
  [/\bba\s+mươi\s+tám\b/gi, () => '38'],
  [/\bba\s+mươi\s+chín\b/gi, () => '39'],
  [/\bba\s+mươi\b/gi, () => '30'],

  [/\bbốn\s+mươi\s+mốt\b/gi, () => '41'],
  [/\bbốn\s+mươi\s+hai\b/gi, () => '42'],
  [/\bbốn\s+mươi\s+tư\b/gi, () => '44'],
  [/\bbốn\s+mươi\s+lăm\b/gi, () => '45'],
  [/\bbốn\s+mươi\b/gi, () => '40'],
  [/\bnăm\s+mươi\s+mốt\b/gi, () => '51'],
  [/\bnăm\s+mươi\s+lăm\b/gi, () => '55'],
  [/\bnăm\s+mươi\s+năm\b/gi, () => '55'],
  [/\bnăm\s+mươi\b/gi, () => '50'],
  [/\bsáu\s+mươi\b/gi, () => '60'],
  [/\bbảy\s+mươi\b/gi, () => '70'],
  [/\btám\s+mươi\b/gi, () => '80'],
  [/\bchín\s+mươi\b/gi, () => '90'],

  // trăm, nghìn
  [/\bmột\s+trăm\b/gi, () => '100'],
  [/\bhai\s+trăm\b/gi, () => '200'],
  [/\bba\s+trăm\b/gi, () => '300'],
  [/\bbốn\s+trăm\b/gi, () => '400'],
  [/\bnăm\s+trăm\b/gi, () => '500'],
  [/\bsáu\s+trăm\b/gi, () => '600'],
  [/\bbảy\s+trăm\b/gi, () => '700'],
  [/\btám\s+trăm\b/gi, () => '800'],
  [/\bchín\s+trăm\b/gi, () => '900'],
]

export function convertVietnameseNumbersToDigits(text: string): string {
  let result = text

  // Ưu tiên thay số ghép trước (dài hơn)
  for (const [pattern, replacer] of COMPOUND_PATTERNS) {
    result = result.replace(pattern, () => replacer())
  }

  // Sau đó thay từ đơn
  for (const [pattern, replacement] of WORD_TO_CHAR) {
    if (typeof pattern === 'string') {
      result = result.split(pattern).join(replacement)
    } else {
      result = result.replace(pattern, replacement)
    }
  }

  return result
}
