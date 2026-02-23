# Đẩy project lên GitHub

Repository đã sẵn sàng (đã `git init` và `git commit`). Để đẩy lên GitHub:

## Cách 1: Tạo repo mới trên GitHub (khuyến nghị)

1. Truy cập https://github.com/new
2. Đặt tên repository: **voice-nhap-lieu**
3. Chọn **Public**
4. **Không** tick "Add a README file" (đã có sẵn)
5. Nhấn **Create repository**

6. Trong terminal, chạy:

```bash
cd /Users/xuankien/Desktop/voice-nhap-lieu

# Thay YOUR_USERNAME bằng username GitHub của bạn
git remote add origin https://github.com/YOUR_USERNAME/voice-nhap-lieu.git

git push -u origin main
```

## Cách 2: Dùng GitHub CLI (nếu đã cài)

```bash
# Cài gh: brew install gh
# Đăng nhập: gh auth login

cd /Users/xuankien/Desktop/voice-nhap-lieu
gh repo create voice-nhap-lieu --public --source=. --remote=origin --push
```
