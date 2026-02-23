# 🎤 Voice Nhập Liệu

Ứng dụng desktop nhập liệu bằng giọng nói, chạy trên **Windows** và **macOS**. Thu âm qua microphone, chuyển thành văn bản (Speech-to-Text), rồi:

1. **Lưu vào khay nhớ tạm** – sao chép để dán (Ctrl+V/⌘V) vào bất kỳ đâu  
2. **Tự động nhập tại vị trí con trỏ** – gõ trực tiếp vào Excel, Word, VSCode, v.v.

## Công nghệ

- **Tauri 2** + **React** + **TypeScript**
- **Web Speech API** cho Speech-to-Text
- **Enigo** (Rust) mô phỏng gõ phím
- **Global Hotkey**: `Ctrl+Shift+Space` (Windows) / `⌘⇧Space` (macOS)

## Yêu cầu

- **Node.js** 20+ hoặc 22.12+
- **Rust** (cài qua [rustup](https://rustup.rs/))
- **macOS**: quyền Microphone và **Accessibility** (cho chế độ tự động nhập)

## Cài đặt

```bash
# Clone và vào thư mục
cd voice-nhap-lieu

# Cài npm dependencies (đã chạy nếu tạo project mới)
npm install

# Chạy development
npm run tauri dev

# Build app cài đặt được (tạo file .app trên macOS / .exe trên Windows)
npm run tauri build

# Hoặc dùng script rút gọn:
npm run build:app
```

## Cách dùng

1. Mở ứng dụng (hoặc để chạy nền)
2. Chọn chế độ xuất: **Clipboard** hoặc **Tự động nhập tại con trỏ**
3. Đặt con trỏ chuột tại vị trí muốn nhập (Excel, Word, v.v.)
4. Nhấn **⌘⇧Space** (macOS) hoặc **Ctrl+Shift+Space** (Windows) để **bắt đầu thu âm**
5. Nói vào microphone
6. Nhấn lại **⌘⇧Space** / **Ctrl+Shift+Space** để **dừng** và chuyển giọng nói thành văn bản

## Cài đặt (Settings)

Nhấn nút **⚙️ Cài đặt** để mở:

- **Chế độ thu âm**
  - **Toggle**: Nhấn phím tắt để bật thu âm, nhấn lại để tắt
  - **Push-to-talk**: Giữ phím tắt để nói, thả ra để tự động lưu/nhập
- **Phím tắt**: Đổi tổ hợp phím thu âm – nhấn "Đổi phím tắt" rồi nhấn tổ hợp phím mới
- **Cách xuất văn bản**: Lưu vào clipboard hoặc tự động nhập tại con trỏ

Cài đặt được lưu tự động khi thay đổi.

## Quyền trên macOS

| Quyền            | Mục đích                          |
|------------------|-----------------------------------|
| **Microphone**   | Thu âm giọng nói                  |
| **Accessibility**| Gõ văn bản tại vị trí con trỏ     |

Vào **System Settings → Privacy & Security → Accessibility** và thêm ứng dụng nếu chế độ “Tự động nhập” không hoạt động.

## Cấu trúc project

```
voice-nhap-lieu/
├── src/                 # React frontend
│   ├── App.tsx          # UI + logic thu âm, STT, gọi backend
│   └── ...
├── src-tauri/           # Tauri backend (Rust)
│   ├── src/
│   │   └── lib.rs       # simulate_keyboard_type, global shortcut
│   └── ...
└── ...
```

## Mở rộng (STT)

Hiện dùng **Web Speech API** (mặc định của trình duyệt). Có thể thêm:

- **OpenAI Whisper API** – chất lượng tốt, cần API key
- **faster-whisper** – chạy local, offline

## Build & Cài đặt app

Sau khi chạy `npm run tauri build`, file app nằm tại:

| Hệ điều hành | Đường dẫn |
|--------------|-----------|
| **macOS** | `src-tauri/target/release/bundle/macos/Voice Nhập Liệu.app` |
| **Windows** | `src-tauri/target/release/bundle/nsis/Voice Nhập Liệu_0.1.0_x64-setup.exe` |

Kéo file `.app` vào **Applications** (macOS) hoặc chạy file cài đặt (Windows).

## Trang tải xuống & Phát hành

**Trang tải:** [xuankien2k.github.io/voice-nhap-lieu](https://xuankien2k.github.io/voice-nhap-lieu/)

### Bật GitHub Pages
1. Đẩy repo lên GitHub (vd: `xuankien2k/voice-nhap-lieu`)
2. Vào **Settings → Pages**
3. **Source**: Deploy from a branch
4. **Branch**: main, thư mục `/docs`

### Phát hành phiên bản mới
1. Cập nhật version trong `src-tauri/tauri.conf.json` và `package.json` (nếu cần)
2. Tạo tag và đẩy lên GitHub:
   ```bash
   git tag v0.1.0
   git push origin v0.1.0
   ```
3. GitHub Actions sẽ build cho **Windows** và **macOS** (Intel + Apple Silicon) rồi tạo Draft Release
4. Vào **Releases** → mở Draft → Publish release
5. Trang tải sẽ tự lấy link từ release mới nhất

## License

MIT
