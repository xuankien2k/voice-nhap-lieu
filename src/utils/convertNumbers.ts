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

    // Số đơn 0-9
    [/\bKhông\b/gi, '0'],
    [/\bMột\b/gi, '1'],
    [/\bHai\b/gi, '2'],
    [/\bBa\b/gi, '3'],
    [/\bBốn\b/gi, '4'],
    [/\bTư\b/gi, '4'], // số ghép (hai mươi tư...) đã xử lý trước
    [/\bNăm\b/gi, '5'], // số ghép (năm mươi, mười năm...) đã xử lý trước
    [/\bSáu\b/gi, '6'],
    [/\bBảy\b/gi, '7'],
    [/\bTám\b/gi, '8'],
    [/\bChín\b/gi, '9'],
]

export function convertVietnameseNumbersToDigits(text: string): string {
  console.debug('[convertNumbers] Được gọi. Đầu vào:', JSON.stringify(text))

  let result = text

  // Sau đó thay từ đơn
  for (const [pattern, replacement] of WORD_TO_CHAR) {
    if (typeof pattern === 'string') {
      result = result.split(pattern).join(replacement)
    } else {
      result = result.replace(pattern, replacement)
    }
  }

  console.debug('[convertNumbers] Sau khi convert:', JSON.stringify(result))
  return result
}
