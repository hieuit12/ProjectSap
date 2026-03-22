# BÁO CÁO BÀI TẬP NHÓM
## HỆ THỐNG QUẢN LÝ KHO THÔNG MINH (SMART WAREHOUSE)

---

## 1. TÊN ĐỀ TÀI

**Hệ Thống Quản Lý Kho Thông Minh - Smart Warehouse Management System**

Ứng dụng SAP Fiori quản lý kho hàng tích hợp với SAP Backend (OData Service), hỗ trợ quản lý vật tư, tồn kho, và giao dịch nhập kho theo chuẩn nghiệp vụ SAP MM.

---

## 2. MỤC TIÊU / NỘI DUNG THỰC HIỆN / CÁC CHỨC NĂNG CHÍNH

### 2.1. Mục tiêu dự án
- Xây dựng hệ thống quản lý kho hiện đại với giao diện SAP Fiori
- Tích hợp với SAP Backend thông qua OData Service
- Áp dụng chuẩn nghiệp vụ SAP MM (Material Management)
- Cung cấp dashboard trực quan với KPI và biểu đồ phân tích
- Hỗ trợ đa thiết bị (Desktop, Tablet, Mobile)

### 2.2. Các chức năng chính

#### A. Dashboard (Trang chủ)
- **KPI Tiles**: Hiển thị 4 chỉ số quan trọng
  - Tổng số vật tư trong catalog
  - Tổng số lượng hàng trong kho
  - Số lượng vật tư cảnh báo tồn kho thấp (≤ 10)
  - Số lượng nhà máy/địa điểm hoạt động
- **Biểu đồ tương tác**: Click vào KPI để xem biểu đồ chi tiết
- **Low Stock Alert Table**: Cảnh báo vật tư sắp hết hàng
- **Recent Activity**: Lịch sử giao dịch gần đây
- **Quick Actions**: Nút truy cập nhanh các chức năng

#### B. Quản lý Vật tư (Material Management)
- **Danh sách vật tư**: Hiển thị toàn bộ vật tư
- **Tìm kiếm**: Theo Material ID hoặc Material Name
- **Lọc**: Theo loại vật tư (Material Type)
- **Thêm vật tư mới**: Dialog tạo vật tư với validation
- **Chi tiết vật tư**: Xem thông tin đầy đủ của từng vật tư
- **Goods Receipt nhanh**: Nhập kho trực tiếp từ danh sách

#### C. Quản lý Tồn kho (Stock Management)
- **Danh sách tồn kho**: Hiển thị theo Material/Plant/Storage Location
- **Tìm kiếm & Lọc**: Theo Material, Plant, Storage Location
- **Group by Plant**: Nhóm dữ liệu theo nhà máy
- **Cập nhật tồn kho**: Chỉnh sửa số lượng tồn kho
- **Chi tiết tồn kho**: Xem thông tin chi tiết từng dòng stock
- **Tổng kết số lượng**: Hiển thị tổng quantity của kết quả lọc
- **Export Excel**: Xuất dữ liệu ra file Excel

#### D. Nhập kho (Goods Receipt)
- **Dialog nhập kho**: Form nhập thông tin
  - Material ID (required)
  - Plant (required, có filter động)
  - Storage Location (required, lọc theo Plant)
  - Quantity (required, validation > 0)
  - Posting Date
  - Document Date
  - Remark
- **Validation nghiệp vụ SAP**:
  - ✅ Quantity phải > 0
  - ❌ KHÔNG cho phép = 0
  - ❌ KHÔNG cho phép < 0
- **Tự động uppercase**: Material ID, Plant, Storage Location
- **Refresh CSRF Token**: Đảm bảo POST request thành công

#### E. Lịch sử giao dịch (Transaction History)
- **Danh sách lịch sử**: Hiển thị toàn bộ Material Document
- **Tìm kiếm & Lọc nâng cao**:
  - Material ID
  - Plant
  - Storage Location
  - Posting Date Range (From - To)
  - Document Date Range (From - To)
- **Fix Timezone**: Xử lý đúng múi giờ GMT+7
- **Chi tiết chứng từ**: Dialog hiển thị đầy đủ 12 fields
- **Export Excel**: Xuất lịch sử ra file Excel

---

## 3. ĐẶC TẢ CẤU TRÚC DỮ LIỆU

### 3.1. OData Service
- **Service URL**: `https://s40lp1.ucc.cit.tum.de/sap/opu/odata/sap/ZGW_WH_ODATA_SRV/`
- **OData Version**: 2.0
- **SAP Client**: 324

### 3.2. Entity Sets chính

#### MaterialSet
```
- MaterialId (Key): Mã vật tư
- MaterialName: Tên vật tư
- MaterialType: Loại vật tư
- BaseUnit: Đơn vị cơ bản
```

#### StockSet
```
- MaterialId (Key): Mã vật tư
- Plant (Key): Nhà máy
- StorageLocation (Key): Kho
- MaterialName: Tên vật tư
- Quantity: Số lượng tồn
- BaseUnit: Đơn vị
```

#### GoodsReceiptSet (POST)
```
- MaterialId: Mã vật tư
- Plant: Nhà máy
- StorageLocation: Kho
- Quantity: Số lượng (phải > 0)
- PostingDate: Ngày hạch toán
- DocumentDate: Ngày chứng từ
- Remark: Ghi chú
→ Response: MaterialDocument (số chứng từ)
```

#### HistorySet
```
- MaterialDocument (Key): Số chứng từ
- Year (Key): Năm
- PostingDate: Ngày hạch toán
- DocumentDate: Ngày chứng từ
- MaterialId: Mã vật tư
- MaterialName: Tên vật tư
- Plant: Nhà máy
- StorageLocation: Kho
- MovementType: Loại giao dịch
- Quantity: Số lượng
- BaseUnit: Đơn vị
- Status: Trạng thái
- Remark: Ghi chú
```

#### Master Data Sets
```
- PlantMasterSet: Danh sách nhà máy
- StorageLocationMasterSet: Danh sách kho (có filter theo PlantId)
- MaterialTypeMasterSet: Danh sách loại vật tư
```

### 3.3. Cấu trúc thư mục dự án
```
webapp/
├── controller/          # Controllers xử lý logic
│   ├── Dashboard.controller.js
│   ├── MaterialList.controller.js
│   ├── MaterialDetail.controller.js
│   ├── StockList.controller.js
│   ├── StockDetail.controller.js
│   ├── GoodsReceiptHistory.controller.js
│   └── BaseController.js
├── view/               # XML Views
│   ├── Dashboard.view.xml
│   ├── MaterialList.view.xml
│   ├── StockList.view.xml
│   └── GoodsReceiptHistory.view.xml
├── fragment/           # Reusable Dialogs
│   ├── MaterialCreateDialog.fragment.xml
│   ├── GoodsReceiptDialog.fragment.xml
│   ├── UpdateStockDialog.fragment.xml
│   └── HistoryDetailDialog.fragment.xml
├── service/            # Business Logic Services
│   ├── MaterialService.js
│   ├── StockService.js
│   └── GoodsReceiptService.js
├── model/              # Models & Utilities
│   ├── models.js
│   ├── formatter.js
│   └── Validator.js
├── css/
│   └── style.css       # Custom styling (glass effect)
└── i18n/
    └── i18n.properties # Internationalization
```

---

## 4. ĐẶC TẢ CHỨC NĂNG / MÀN HÌNH

### 4.1. Dashboard (Màn hình chính)
**Route**: `/` (default)

**Thành phần**:
- 4 KPI Tiles với icon và số liệu
- Click KPI → Mở dialog với biểu đồ (VizFrame)
- Low Stock Alert Table (chỉ hiện khi có data)
- Recent Activity Table (5 giao dịch gần nhất)
- Quick Actions buttons

**Tính năng đặc biệt**:
- Animation fade-in khi load
- Glass morphism design
- Responsive layout (Grid)
- Real-time data binding

### 4.2. Material List (Danh sách vật tư)
**Route**: `/materials`

**Chức năng**:
- Search: Tìm theo Material ID/Name
- Filter: Lọc theo Material Type
- Sort: Sắp xếp dữ liệu
- Add Material: Mở dialog tạo mới
- Quick GR: Nhập kho nhanh từ dòng
- Navigation: Click dòng → Material Detail

**Dialog tạo vật tư**:
- Material ID (required, auto uppercase)
- Material Name (required)
- Material Type (ComboBox, required)
- Base Unit (required)
- Validation form trước khi submit

### 4.3. Stock List (Danh sách tồn kho)
**Route**: `/stock`

**Chức năng**:
- Search: Tìm theo Material ID
- Filter: Plant, Storage Location (có cascade filter)
- Group by Plant: Nhóm theo nhà máy
- Total Summary: Tổng quantity của kết quả
- Update Stock: Sửa số lượng tồn
- Goods Receipt: Nhập kho mới
- Export Excel: Xuất dữ liệu
- Navigation: Click dòng → Stock Detail

**Cascade Filter**:
- Chọn Plant → Storage Location tự động lọc theo Plant đó
- Reset filters → Xóa tất cả filter

### 4.4. Goods Receipt Dialog
**Trigger**: Button "Goods Receipt" từ nhiều màn hình

**Form fields**:
1. Material ID (Input, required)
2. Plant (ComboBox, required)
3. Storage Location (ComboBox, required, filtered by Plant)
4. Quantity (StepInput, min=0.001, validation > 0)
5. Posting Date (DatePicker, default = today)
6. Document Date (DatePicker, default = today)
7. Remark (TextArea)

**Validation logic**:
```javascript
// Quantity validation
if (isNaN(fQuantity) || fQuantity <= 0) {
    MessageBox.error("Số lượng phải lớn hơn 0");
    return;
}

// Auto uppercase
oData.MaterialId = oData.MaterialId.toUpperCase();
oData.Plant = oData.Plant.toUpperCase();
oData.StorageLocation = oData.StorageLocation.toUpperCase();
```

**Flow**:
1. User nhập thông tin
2. Validate form (required fields)
3. Validate quantity > 0
4. Uppercase key fields
5. POST to `/GoodsReceiptSet`
6. Success → Show Material Document number
7. Refresh data

### 4.5. Transaction History
**Route**: `/history`

**Chức năng**:
- Filter nâng cao:
  - Material ID (Contains)
  - Plant (Equals)
  - Storage Location (Equals)
  - Posting Date Range (Between/GE/LE)
  - Document Date Range (Between/GE/LE)
- Cascade filter: Plant → Storage Location
- View Detail: Dialog hiển thị đầy đủ 12 fields
- Export Excel: Xuất lịch sử
- Refresh: Reload data

**Timezone Fix**:
```javascript
// Fix GMT+7 timezone issue
_toUtcNoon: function (oDate) {
    var y = oDate.getFullYear();
    var m = oDate.getMonth();
    var d = oDate.getDate();
    return new Date(Date.UTC(y, m, d, 12, 0, 0));
}
```

---

## 5. PHỤ LỤC: HÌNH ẢNH MINH HỌA

### 5.1. Màn hình Dashboard
*(Paste ảnh Dashboard với KPI tiles, Low Stock Alert, Recent Activity)*

---

### 5.2. Màn hình Material List
*(Paste ảnh danh sách vật tư với search, filter, add material)*

---

### 5.3. Màn hình Stock List
*(Paste ảnh danh sách tồn kho với filter, group by, export excel)*

---

### 5.4. Dialog Goods Receipt
*(Paste ảnh form nhập kho với các trường Material ID, Plant, Storage Location, Quantity)*

---

### 5.5. Màn hình Transaction History
*(Paste ảnh lịch sử giao dịch với filter nâng cao, date range)*

---

### 5.6. Dialog Material Create
*(Paste ảnh form tạo vật tư mới)*

---

### 5.7. Dialog Stock Update
*(Paste ảnh form cập nhật tồn kho)*

---

### 5.8. Validation & Error Handling
*(Paste ảnh các message box validation, error messages)*

---

### 5.9. Responsive Design
*(Paste ảnh hiển thị trên mobile/tablet nếu có)*

---

### 5.10. Export Excel Result
*(Paste ảnh file Excel sau khi export)*

---

## NỘI DUNG TRÌNH BÀY (SLIDES) THỂ HIỆN ĐƯỢC CÁC NỘI DUNG TRÊN TRONG BÁO CÁO

### Slide 1: Trang bìa
- Tên đề tài: HỆ THỐNG QUẢN LÝ KHO THÔNG MINH
- Logo SAP Fiori
- Thông tin nhóm

### Slide 2-3: Giới thiệu dự án
- Bối cảnh và mục tiêu
- Công nghệ sử dụng: SAP Fiori, UI5, OData
- Kiến trúc hệ thống

### Slide 4-5: Chức năng chính
- Dashboard với KPI
- Quản lý vật tư
- Quản lý tồn kho
- Nhập kho (Goods Receipt)
- Lịch sử giao dịch

### Slide 6-7: Demo màn hình
- Screenshot Dashboard
- Screenshot Material List
- Screenshot Stock List
- Screenshot Goods Receipt Dialog
- Screenshot Transaction History

### Slide 8: Đặc tả dữ liệu
- Sơ đồ Entity Sets
- Mối quan hệ giữa các Entity
- OData Service structure

### Slide 9: Đặc tả chức năng
- Flow diagram của Goods Receipt
- Validation rules
- Business logic

### Slide 10: Code highlights
- Service Layer
- Validator
- Controller logic
- Fragment XML

### Slide 11: Kết quả đạt được
- Hoàn thành đầy đủ chức năng
- Áp dụng chuẩn SAP
- Responsive design
- Export Excel

### Slide 12: Kết luận
- Bài học kinh nghiệm
- Hướng phát triển
- Q&A

---

## BỔ SUNG: PHẦN CÔNG / VAI TRÒ / ĐÓNG GÓP CỦA TỪNG THÀNH VIÊN

### Đánh giá dựa trên:
1. **Sản phẩm chung của cả nhóm**: Hệ thống hoàn chỉnh với đầy đủ chức năng
2. **Công việc đảm nhận / đóng góp của thành viên vào kết quả của nhóm**:
   - Phân tích yêu cầu và thiết kế
   - Phát triển frontend (Views, Controllers)
   - Phát triển business logic (Services)
   - Testing và bug fixing
   - Tài liệu và báo cáo

---

## ĐIỂM CỦA MỖI THÀNH VIÊN ĐƯỢC ĐÁNH GIÁ DỰA TRÊN:

### Tiêu chí chấm điểm:
1. ✅ **Sản phẩm chung**: Hệ thống hoàn chỉnh, chạy tốt
2. ✅ **Công việc cá nhân**: Đóng góp vào từng module/chức năng
3. ✅ **Hỏi/đáp**: Hiểu rõ phần mình làm và toàn bộ hệ thống

### Lịch present: TUẦN 10

---

**Ngày lập báo cáo**: 20/03/2026
**Người lập**: Nhóm Smart Warehouse
