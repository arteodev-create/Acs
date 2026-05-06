# Google Service Account Configuration

Để tính năng **Google Indexing** hoạt động, bạn cần đặt file `service_account.json` tại thư mục này.

## Các bước lấy file:
1.  Truy cập **Google Cloud Console** (https://console.cloud.google.com/).
2.  Tạo Project mới hoặc chọn Project hiện có.
3.  Vào menu **IAM & Admin** > **Service Accounts**.
4.  Nhấn **Create Service Account**.
    -   Name: `indexing-bot` (hoặc tùy ý).
    -   Role: Chọn **Owner** (hoặc custom role thâp hơn nếu biết config). thực tế Indexing API cần quyền Owner trên Search Console.
5.  Sau khi tạo, nhấn vào Email của Service Account > Tab **Keys**.
6.  Nhấn **Add Key** > **Create new key** > Chọn **JSON**.
7.  File sẽ tự động tải về máy.

## Cấu hình:
1.  Đổi tên file vừa tải thành `service_account.json`.
2.  Copy file đó vào thư mục này:
    `c:\Users\Huy\Downloads\App\api.recode.arteosocial.com\`
3.  **Quan trọng**: Vào **Google Search Console** (https://search.google.com/search-console).
4.  Chọn Property (domain) của bạn -> **Settings** -> **Users and permissions**.
5.  Nhấn **Add User** -> Nhập email của Service Account (dạng `bot@project.iam.gserviceaccount.com`) -> Quyền **Owner**.

Sau khi làm xong, quay lại trang Admin Indexing và reload để thấy trạng thái "ACTIVE".
