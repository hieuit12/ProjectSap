# GIẢI THÍCH CHI TIẾT DỰ ÁN - HỆ THỐNG QUẢN LÝ KHO

## TỔNG QUAN KIẾN TRÚC

### Hệ thống gồm 3 tầng:

**1. Frontend (Giao diện người dùng)**
- Được xây dựng bằng SAP Fiori (UI5 Framework)
- Chạy trên trình duyệt web
- Giao tiếp với Backend qua giao thức OData (giống REST API)

**2. Backend (Xử lý nghiệp vụ)**
- Được viết bằng ngôn ngữ ABAP trên SAP Server
- Xử lý logic nghiệp vụ, validation, gọi BAPI
- Trả về dữ liệu dạng JSON cho Frontend

**3. Database (Lưu trữ dữ liệu)**
- SAP Tables: MARA, MARC, MARD, MKPF, MSEG...
- Lưu trữ thông tin vật tư, tồn kho, giao dịch

---

## CẤU TRÚC FRONTEND

### 1. View (File XML)
**Vai trò**: Định nghĩa giao diện người dùng

**Ví dụ**: MaterialList.view.xml
- Hiển thị bảng danh sách vật tư
- Có nút "Add Material", "Search", "Filter"
- Khi user click nút → Gọi function trong Controller

### 2. Controller (File JavaScript)
**Vai trò**: Xử lý logic, điều khiển luồng dữ liệu

**Chức năng chính**:
- Xử lý sự kiện click button, search, filter
- Gọi Service để lấy/gửi dữ liệu
- Hiển thị message thành công/lỗi
- Mở/đóng dialog

### 3. Fragment (File XML)
**Vai trò**: Dialog/Popup có thể tái sử dụng

**Ví dụ**: MaterialCreateDialog.fragment.xml
- Popup nhập thông tin vật tư mới
- Có các trường: Material ID, Name, Type, Plant, Storage Location...
- Có nút "Create" và "Cancel"

### 4. Service (File JavaScript)
**Vai trò**: Gọi API OData để giao tiếp với Backend

**Chức năng**:
- Gửi HTTP request (GET, POST, PUT, DELETE)
- Xử lý CSRF Token (bảo mật)
- Trả về Promise để Controller xử lý

### 5. Model (File JavaScript)
**Vai trò**: Quản lý dữ liệu, format, validate

**Gồm**:
- models.js: Tạo JSON Model để lưu data tạm
- formatter.js: Format dữ liệu hiển thị (số, ngày, trạng thái)
- Validator.js: Validate form (check required fields)

---

## LUỒNG HOẠT ĐỘNG CHI TIẾT

### CHỨC NĂNG 1: TẠO VẬT TƯ MỚI (CREATE MATERIAL)


#### Bước 1: User click nút "Add Material"
- User đang ở màn hình MaterialList
- Click vào button "Add Material"
- View gọi function onAddMaterial() trong Controller

#### Bước 2: Controller mở Dialog
- Controller reset dữ liệu form về rỗng
- Load file MaterialCreateDialog.fragment.xml
- Hiển thị popup với các trường nhập liệu:
  - Material ID (bắt buộc)
  - Material Name (bắt buộc)
  - Material Type (dropdown, bắt buộc)
  - Base Unit (dropdown, bắt buộc)
  - Plant (dropdown, bắt buộc)
  - Storage Location (dropdown, bắt buộc)
  - Valuation Class (dropdown, bắt buộc)

#### Bước 3: User chọn Plant
- User chọn Plant "1000" từ dropdown
- Trigger event onPlantChange()
- Controller gọi OData để lấy danh sách Storage Location của Plant 1000
- Dropdown Storage Location tự động cập nhật (chỉ hiện kho thuộc Plant 1000)
- Đây gọi là "Cascade Filter" - lọc theo cấp

#### Bước 4: User chọn Material Type
- User chọn Material Type "ROH" (Raw Material)
- Trigger event onMaterialTypeChange()
- Controller gọi OData để lấy danh sách Valuation Class của type ROH
- Dropdown Valuation Class tự động cập nhật

#### Bước 5: User điền đầy đủ thông tin và click "Create"
- User điền:
  - Material ID: "TEST001"
  - Material Name: "Test Material"
  - Material Type: "ROH"
  - Base Unit: "EA"
  - Plant: "1000"
  - Storage Location: "0001"
  - Valuation Class: "3000"
- Click nút "Create"
- Gọi function onConfirmCreate() trong Controller

#### Bước 6: Controller validate dữ liệu
- Gọi Validator.validateForm() để check:
  - Tất cả trường required đã điền chưa?
  - Có trường nào bị bỏ trống không?
- Nếu thiếu → Hiển thị message "Please fill all required fields"
- Nếu đủ → Tiếp tục bước 7

#### Bước 7: Controller chuẩn hóa dữ liệu
- Chuyển Material ID, Plant, Storage Location thành chữ HOA
- Ví dụ: "test001" → "TEST001"
- Lý do: SAP yêu cầu key fields phải uppercase

#### Bước 8: Controller gọi Service
- Gọi MaterialService.createMaterial()
- Truyền vào: OData Model và dữ liệu form
- Hiển thị loading spinner (busy indicator)

#### Bước 9: Service gửi HTTP request
- Service refresh CSRF Token (token bảo mật)
- Gửi POST request đến Backend:
  - URL: /sap/opu/odata/sap/ZGW_WH_ODATA_SRV/MaterialSet
  - Method: POST
  - Headers: x-csrf-token, Content-Type: application/json
  - Body: JSON chứa dữ liệu vật tư
- Đợi Backend xử lý và trả về kết quả

#### Bước 10: Backend nhận request
- Class ZCL_ZGW_WH_ODATA_DPC_EXT nhận request
- Method materialset_create_entity được gọi
- Parse JSON thành ABAP structure

#### Bước 11: Backend validate nghiệp vụ
**Validation 1: Kiểm tra Plant và Storage Location**
- Query table T001W để check Plant "1000" có tồn tại không
- Query table T001L để check Storage Location "0001" có thuộc Plant "1000" không
- Nếu không hợp lệ → Trả về lỗi "Plant/Storage Location not found"

**Validation 2: Kiểm tra Valuation Class**
- Check Valuation Class "3000" có được điền không
- Nếu bỏ trống → Trả về lỗi "Valuation Class is required"

**Validation 3: Kiểm tra trùng lặp**
- Query table MARD để check Material "TEST001" + Plant "1000" + SLoc "0001" đã tồn tại chưa
- Nếu đã có → Trả về lỗi "Material already exists at this location"
- Nếu chưa có → Tiếp tục

#### Bước 12: Backend chuẩn hóa Material ID
- Gọi function CONVERSION_EXIT_MATN1_INPUT
- Chuyển "TEST001" thành "000000000000TEST001" (18 ký tự với leading zeros)
- Đây là format chuẩn của SAP

#### Bước 13: Backend chuẩn bị data cho BAPI
- Tạo structure BAPIMATHEAD (header):
  - Material: "000000000000TEST001"
  - Material Type: "ROH"
  - Industry Sector: "M"
- Tạo structure BAPI_MARA (general data):
  - Base Unit: "EA"
- Tạo structure BAPI_MARC (plant data):
  - Plant: "1000"
- Tạo structure BAPI_MARD (storage location data):
  - Plant: "1000"
  - Storage Location: "0001"
- Tạo structure BAPI_MBEW (valuation data):
  - Valuation Area: "1000"
  - Valuation Class: "3000"
  - Price Control: "V" (Moving Average Price)
  - Moving Price: 1
- Tạo table BAPI_MAKT (description):
  - Language: "EN"
  - Description: "Test Material"

#### Bước 14: Backend gọi BAPI_MATERIAL_SAVEDATA
- BAPI này là function module chuẩn của SAP
- Chức năng: Tạo Material Master Data
- BAPI sẽ insert data vào các tables:
  - MARA: Material general data
  - MARC: Material plant data
  - MARD: Material storage location data
  - MBEW: Material valuation data
  - MAKT: Material description
- BAPI trả về:
  - RETURN: Message (Success/Error)
  - RETURNMESSAGES: Chi tiết messages

#### Bước 15: Backend kiểm tra kết quả BAPI
- Đọc RETURNMESSAGES table
- Tìm message có type = 'E' (Error) hoặc 'A' (Abort)
- Nếu có lỗi:
  - Gọi BAPI_TRANSACTION_ROLLBACK (hủy bỏ thay đổi)
  - Trả về error message cho Frontend
- Nếu thành công:
  - Gọi BAPI_TRANSACTION_COMMIT (lưu thay đổi vào database)
  - Tiếp tục bước 16

#### Bước 16: Backend trả về kết quả
- Chuyển Material ID về format không có leading zeros: "TEST001"
- Trả về JSON response cho Frontend:
  - Status: 201 Created
  - Body: Thông tin vật tư vừa tạo

#### Bước 17: Service nhận response
- Service nhận JSON từ Backend
- Parse thành JavaScript object
- Gọi resolve() để trả về cho Controller

#### Bước 18: Controller xử lý kết quả
**Nếu thành công**:
- Hiển thị MessageBox.success("Material created successfully!")
- Đóng dialog
- Gọi oModel.refresh() để reload danh sách vật tư
- Tắt loading spinner
- Vật tư mới xuất hiện trong bảng

**Nếu lỗi**:
- Parse error message từ Backend
- Hiển thị MessageBox.error với nội dung lỗi
- Giữ dialog mở để user sửa
- Tắt loading spinner

---

### CHỨC NĂNG 2: NHẬP KHO (GOODS RECEIPT)


#### Bước 1: User click nút "Goods Receipt"
- User có thể click từ nhiều màn hình:
  - Dashboard → Quick Actions
  - Stock List → Button "Goods Receipt"
  - Material List → Button "Quick GR" trên từng dòng
- Controller gọi function onGoodsReceipt()

#### Bước 2: Controller mở Dialog và pre-fill data
- Nếu click từ Material List → Pre-fill Material ID
- Nếu có filter Plant/SLoc đang chọn → Pre-fill luôn
- Load file GoodsReceiptDialog.fragment.xml
- Hiển thị popup với các trường:
  - Material ID (required)
  - Plant (required)
  - Storage Location (required)
  - Quantity (required, phải > 0)
  - Posting Date (optional, default = hôm nay)
  - Document Date (optional, default = hôm nay)
  - Remark (optional)

#### Bước 3: User chọn Plant
- User chọn Plant "1000"
- Trigger onChangePlant()
- Controller filter Storage Location theo Plant 1000
- Xóa Storage Location đã chọn trước đó

#### Bước 4: User điền thông tin và click "Post"
- Material ID: "TEST001"
- Plant: "1000"
- Storage Location: "0001"
- Quantity: 100
- Posting Date: 20/03/2026
- Document Date: 20/03/2026
- Remark: "Initial stock"
- Click nút "Post"

#### Bước 5: Controller validate
- Check required fields đã điền đủ chưa
- Check Quantity > 0 (không cho phép = 0 hoặc âm)
- Nếu Quantity <= 0 → Hiển thị lỗi "Số lượng phải lớn hơn 0"
- Nếu OK → Tiếp tục

#### Bước 6: Controller chuẩn hóa và gọi Service
- Uppercase Material ID, Plant, Storage Location
- Gọi GoodsReceiptService.postGoodsReceipt()
- Hiển thị loading

#### Bước 7: Service gửi POST request
- Refresh CSRF Token
- POST đến /GoodsReceiptSet
- Body: JSON chứa thông tin nhập kho

#### Bước 8: Backend nhận request
- Method goodsreceiptset_create_entity được gọi
- Parse JSON thành ABAP structure

#### Bước 9: Backend validate
- Validate Plant & Storage Location hợp lệ
- Convert Material ID có leading zeros
- Check Material có tồn tại trong MARA không
- Check Material đã được extend sang Plant/SLoc này chưa

#### Bước 10: Backend ensure material extended
- Nếu Material chưa có MARC (Plant Data):
  - Gọi BAPI_MATERIAL_SAVEDATA để tạo MARC
- Nếu Material chưa có MARD (Storage Location Data):
  - Gọi BAPI_MATERIAL_SAVEDATA để tạo MARD
- Lý do: Không thể nhập kho nếu Material chưa được extend

#### Bước 11: Backend lấy Base Unit
- Query table MARA để lấy Base Unit của Material
- Ví dụ: "EA" (Each)

#### Bước 12: Backend chuẩn bị data cho BAPI
- Tạo BAPI2017_GM_HEAD_01 (header):
  - Posting Date: 20/03/2026
  - Document Date: 20/03/2026
  - Header Text: "Initial stock"
- Tạo BAPI2017_GM_CODE:
  - GM Code: "05" (Goods Receipt)
- Tạo BAPI2017_GM_ITEM_CREATE (line item):
  - Material: "000000000000TEST001"
  - Plant: "1000"
  - Storage Location: "0001"
  - Movement Type: "561" (Initial Entry of Stock)
  - Entry Quantity: 100
  - Entry UOM: "EA"

#### Bước 13: Backend gọi BAPI_GOODSMVT_CREATE
- BAPI này tạo Material Document (chứng từ nhập kho)
- BAPI sẽ:
  - Insert vào MKPF (Material Document Header)
  - Insert vào MSEG (Material Document Item)
  - Update MARD (tăng LABST - stock quantity)
- BAPI trả về:
  - GOODSMVT_HEADRET: Chứa Material Document Number (MBLNR)
  - RETURN: Messages

#### Bước 14: Backend kiểm tra kết quả
- Nếu có lỗi:
  - BAPI_TRANSACTION_ROLLBACK
  - Trả về error
- Nếu thành công:
  - BAPI_TRANSACTION_COMMIT
  - Lấy Material Document Number (ví dụ: "5000000123")
  - Trả về cho Frontend

#### Bước 15: Frontend nhận kết quả
**Thành công**:
- Hiển thị MessageBox.success("Goods Receipt posted successfully! Material Document: 5000000123")
- Đóng dialog
- Refresh danh sách tồn kho
- Số lượng tồn kho tăng lên 100

**Lỗi**:
- Hiển thị error message
- Giữ dialog mở

---

### CHỨC NĂNG 3: CẬP NHẬT TỒN KHO (UPDATE STOCK)


#### Bước 1: User click icon "Edit" trên dòng stock
- User đang ở màn hình Stock List
- Click icon edit trên dòng Material "TEST001" / Plant "1000" / SLoc "0001"
- Controller gọi onUpdateStock()

#### Bước 2: Controller mở Dialog với data hiện tại
- Lấy data của dòng đang click
- Pre-fill vào form:
  - Material ID: "TEST001" (readonly)
  - Plant: "1000" (readonly)
  - Storage Location: "0001" (readonly)
  - Quantity hiện tại: 100 (editable)
- Load UpdateStockDialog.fragment.xml
- Hiển thị popup

#### Bước 3: User thay đổi Quantity
- User đổi từ 100 → 150
- Click "Update"

#### Bước 4: Controller validate
- Check Quantity >= 0 (không cho phép âm)
- Nếu < 0 → Lỗi "Quantity cannot be negative"
- Nếu OK → Tiếp tục

#### Bước 5: Controller gọi Service
- Gọi StockService.updateStock()
- Truyền: Material ID, Plant, SLoc, Quantity mới = 150

#### Bước 6: Service gửi PUT request
- PUT đến /StockSet(MaterialId='TEST001',Plant='1000',StorageLocation='0001')
- Body: { Quantity: 150 }

#### Bước 7: Backend nhận request
- Method stockset_update_entity được gọi
- Parse data

#### Bước 8: Backend validate
- Validate Quantity >= 0
- Validate Plant & SLoc hợp lệ
- Ensure Material extended

#### Bước 9: Backend đọc tồn kho hiện tại
- Query MARD để lấy LABST (stock quantity) hiện tại
- Ví dụ: lv_curr = 100

#### Bước 10: Backend tính chênh lệch
- lv_diff = Quantity mới - Quantity cũ
- lv_diff = 150 - 100 = 50
- Nếu diff = 0 → Return luôn (không cần làm gì)
- Nếu diff > 0 → Cần tăng tồn kho
- Nếu diff < 0 → Cần giảm tồn kho

#### Bước 11: Backend xác định Movement Type
**Trường hợp diff = 50 (dương)**:
- Movement Type: "561" (Stock Increase)
- Entry Quantity: 50

**Trường hợp diff = -30 (âm)**:
- Movement Type: "562" (Stock Decrease)
- Entry Quantity: 30 (giá trị tuyệt đối)

#### Bước 12: Backend gọi BAPI_GOODSMVT_CREATE
- Tạo Material Document để điều chỉnh tồn kho
- BAPI sẽ:
  - Insert MKPF, MSEG
  - Update MARD: LABST = 100 + 50 = 150

#### Bước 13: Backend commit và trả về
- BAPI_TRANSACTION_COMMIT
- Trả về data mới cho Frontend

#### Bước 14: Frontend cập nhật
- Hiển thị success message
- Đóng dialog
- Refresh table
- Số lượng tồn kho hiển thị 150

---

### CHỨC NĂNG 4: XEM LỊCH SỬ GIAO DỊCH (TRANSACTION HISTORY)

#### Bước 1: User vào màn hình History
- Click "History" từ Dashboard hoặc menu
- Router navigate đến route "History"
- Controller GoodsReceiptHistory được init

#### Bước 2: Controller load data
- Bind table với entity set /HistorySet
- OData tự động gửi GET request
- Backend trả về danh sách Material Documents

#### Bước 3: User apply filter
**Filter Material ID**:
- User nhập "TEST" vào ô Material ID
- Click "Go"
- Controller tạo filter: MaterialId contains "TEST"
- Gửi GET request: /HistorySet?$filter=substringof('TEST',MaterialId)

**Filter Plant**:
- User chọn Plant "1000"
- Filter: Plant eq '1000'

**Filter Date Range**:
- User chọn Posting Date From: 01/03/2026
- Posting Date To: 31/03/2026
- Filter: PostingDate ge datetime'2026-03-01' and PostingDate le datetime'2026-03-31'

#### Bước 4: Backend xử lý filter
- Method historyset_get_entityset được gọi
- Parse filters thành RANGE tables
- Convert date string thành DATS format
- Query từ MKPF JOIN MSEG JOIN MAKT
- Apply WHERE conditions
- Sort by PostingDate descending (mới nhất trước)

#### Bước 5: Backend xử lý Debit/Credit
- Đọc field SHKZG từ MSEG:
  - SHKZG = 'S' (Debit) → Quantity dương (nhập kho)
  - SHKZG = 'H' (Credit) → Quantity âm (xuất kho)
- Ví dụ:
  - Movement Type 561, Quantity 100, SHKZG = 'S' → +100
  - Movement Type 562, Quantity 50, SHKZG = 'H' → -50

#### Bước 6: Backend trả về list
- Convert Material ID về format không có leading zeros
- Trả về JSON array

#### Bước 7: Frontend hiển thị table
- Table binding tự động render
- Mỗi dòng hiển thị:
  - Material Document Number
  - Posting Date
  - Material ID & Name
  - Movement Type
  - Quantity (có dấu +/-)
  - Plant / Storage Location
  - Status

#### Bước 8: User click vào 1 dòng
- Click vào Material Document "5000000123"
- Controller gọi onOpenHistoryDetail()
- Lấy toàn bộ data của dòng đó
- Load HistoryDetailDialog.fragment.xml
- Hiển thị popup với đầy đủ 12 fields:
  - Material Document
  - Year
  - Posting Date
  - Document Date
  - Material ID
  - Material Name
  - Plant
  - Storage Location
  - Movement Type
  - Quantity
  - Base Unit
  - Remark

#### Bước 9: User export Excel
- Click button "Export Excel"
- Controller gọi onExportExcel()
- Lấy tất cả data từ table binding
- Sử dụng library sap.ui.export.Spreadsheet
- Generate file Excel với:
  - Sheet name: "Transaction History"
  - Columns: 13 cột
  - Data: Tất cả rows đang hiển thị
- Download file: "History_2026-03-20.xlsx"

---

### CHỨC NĂNG 5: DASHBOARD VỚI KPI


#### Bước 1: User vào Dashboard
- Mở ứng dụng → Route mặc định là Dashboard
- Controller Dashboard được init
- View bind element với /DashboardKPISet('1')

#### Bước 2: Backend tính KPI
**KPI 1: Total Materials (Tổng số vật tư)**
- Query: SELECT COUNT(*) FROM MARA
- Đếm tất cả vật tư trong hệ thống
- Ví dụ: 1,234 materials

**KPI 2: Total Stock (Tổng tồn kho)**
- Query: SELECT SUM(LABST) FROM MARD WHERE LABST > 0
- Cộng tất cả số lượng tồn kho
- Ví dụ: 45,678 units

**KPI 3: Low Stock Count (Vật tư tồn kho thấp)**
- Query: SELECT COUNT(*) FROM MARD WHERE LABST <= 10
- Đếm số vật tư có tồn kho <= 10
- Ví dụ: 23 items

**KPI 4: Total Plants (Số nhà máy)**
- Query: SELECT COUNT(DISTINCT WERKS) FROM MARD
- Đếm số Plant đang có tồn kho
- Ví dụ: 5 plants

#### Bước 3: Frontend hiển thị KPI Tiles
- 4 tiles hiển thị với icon và số liệu
- Mỗi tile có animation fade-in
- Hover vào tile → Scale up + shadow

#### Bước 4: User click vào KPI Tile
- Click vào "Total Stock" tile
- Controller gọi onShowKpiChart()
- Đọc custom data: kpi="TOTAL_STOCK"
- Gọi _buildStockByPlantChart()

#### Bước 5: Controller build chart data
- Gọi OData: GET /StockSet
- Nhận về tất cả stock records
- Group by Plant và sum Quantity:
  - Plant 1000: 15,000
  - Plant 2000: 12,000
  - Plant 3000: 10,000
  - Plant 4000: 5,000
  - Plant 5000: 3,678
- Lấy top 5 Plants có tồn kho nhiều nhất
- Set vào dashboardChart model

#### Bước 6: Hiển thị Chart Dialog
- Mở dialog với VizFrame (SAP Chart control)
- Chart type: Column chart
- X-axis: Plant
- Y-axis: Quantity
- User có thể xem trực quan phân bố tồn kho

#### Bước 7: Load Low Stock Alert Table
- Controller gọi _loadLowStockItems()
- GET /StockSet (lấy tất cả)
- Filter client-side: Quantity <= 10
- Sort by Quantity ascending (thấp nhất trước)
- Set vào lowStockModel
- Table tự động hiển thị nếu có data

#### Bước 8: User click vào Low Stock Item
- Click vào dòng Material "TEST001"
- Controller gọi onLowStockItemPress()
- Lấy MaterialId từ context
- Navigate đến MaterialDetail:
  - Route: /materials/TEST001
  - User có thể xem chi tiết và GR ngay

#### Bước 9: Load Recent Activity Table
- View bind table với /HistorySet
- Sort by PostingDate descending
- Length: 5 (chỉ lấy 5 records mới nhất)
- OData tự động query và hiển thị

#### Bước 10: User click vào Recent History Item
- Click vào dòng Material "TEST001"
- Controller gọi onRecentHistoryPress()
- Lấy MaterialId
- Navigate đến History page
- Sau 300ms, tự động set filter Material ID = "TEST001"
- Controller History tự động search
- User thấy toàn bộ lịch sử của Material đó

---

## CÁC TABLES SAP QUAN TRỌNG

### 1. MARA - Material Master General Data
**Chức năng**: Lưu thông tin chung của vật tư
**Key**: MATNR (Material Number)
**Fields quan trọng**:
- MATNR: Material Number (18 ký tự)
- MTART: Material Type (ROH, FERT, HAWA...)
- MEINS: Base Unit of Measure (EA, KG, L...)
- MATKL: Material Group

### 2. MARC - Material Master Plant Data
**Chức năng**: Lưu thông tin vật tư theo Plant
**Key**: MATNR + WERKS
**Fields quan trọng**:
- MATNR: Material Number
- WERKS: Plant
- PLIFZ: Planned Delivery Time
- DISMM: MRP Type

### 3. MARD - Material Master Storage Location Data
**Chức năng**: Lưu tồn kho theo Storage Location
**Key**: MATNR + WERKS + LGORT
**Fields quan trọng**:
- MATNR: Material Number
- WERKS: Plant
- LGORT: Storage Location
- LABST: Stock Quantity (Số lượng tồn kho)

### 4. MBEW - Material Valuation Data
**Chức năng**: Lưu thông tin định giá vật tư
**Key**: MATNR + BWKEY
**Fields quan trọng**:
- MATNR: Material Number
- BWKEY: Valuation Area (thường = Plant)
- BKLAS: Valuation Class
- VPRSV: Price Control (S=Standard, V=Moving Average)
- VERPR: Moving Average Price
- STPRS: Standard Price

### 5. MAKT - Material Descriptions
**Chức năng**: Lưu tên vật tư theo ngôn ngữ
**Key**: MATNR + SPRAS
**Fields quan trọng**:
- MATNR: Material Number
- SPRAS: Language (EN, VI, DE...)
- MAKTX: Material Description

### 6. MKPF - Material Document Header
**Chức năng**: Header của chứng từ kho
**Key**: MBLNR + MJAHR
**Fields quan trọng**:
- MBLNR: Material Document Number
- MJAHR: Fiscal Year
- BUDAT: Posting Date
- BLDAT: Document Date
- BKTXT: Header Text (Remark)
- USNAM: User Name

### 7. MSEG - Material Document Segment
**Chức năng**: Line items của chứng từ kho
**Key**: MBLNR + MJAHR + ZEILE
**Fields quan trọng**:
- MBLNR: Material Document Number
- MJAHR: Fiscal Year
- ZEILE: Line Number
- MATNR: Material Number
- WERKS: Plant
- LGORT: Storage Location
- BWART: Movement Type (561, 562, 101, 102...)
- MENGE: Quantity
- MEINS: Unit of Measure
- SHKZG: Debit/Credit Indicator (S=Debit, H=Credit)

### 8. T001W - Plants/Branches
**Chức năng**: Master data của Plant
**Key**: WERKS
**Fields quan trọng**:
- WERKS: Plant
- NAME1: Plant Name
- BWKEY: Valuation Area

### 9. T001L - Storage Locations
**Chức năng**: Master data của Storage Location
**Key**: WERKS + LGORT
**Fields quan trọng**:
- WERKS: Plant
- LGORT: Storage Location
- LGOBE: Storage Location Name

### 10. T134 - Material Types
**Chức năng**: Master data của Material Type
**Key**: MTART
**Fields quan trọng**:
- MTART: Material Type
- KKREF: Account Category Reference

### 11. T134T - Material Type Texts
**Chức năng**: Tên Material Type theo ngôn ngữ
**Key**: MTART + SPRAS
**Fields quan trọng**:
- MTART: Material Type
- SPRAS: Language
- MTBEZ: Material Type Description

---

## CÁC BAPI QUAN TRỌNG

### 1. BAPI_MATERIAL_SAVEDATA
**Chức năng**: Tạo hoặc update Material Master Data

**Khi nào dùng**:
- Tạo vật tư mới
- Extend vật tư sang Plant/Storage Location mới
- Update thông tin vật tư

**Input chính**:
- HEADDATA: Header (Material, Material Type, Industry Sector)
- CLIENTDATA: General data (Base Unit)
- PLANTDATA: Plant-specific data
- STORAGELOCATIONDATA: Storage location data
- VALUATIONDATA: Valuation/Accounting data
- MATERIALDESCRIPTION: Descriptions

**Output**:
- RETURN: Message (type E/W/I/S)
- RETURNMESSAGES: Chi tiết messages

**Lưu ý**:
- Phải gọi BAPI_TRANSACTION_COMMIT sau khi thành công
- Nếu lỗi phải gọi BAPI_TRANSACTION_ROLLBACK

### 2. BAPI_GOODSMVT_CREATE
**Chức năng**: Tạo Material Document (Goods Movement)

**Khi nào dùng**:
- Goods Receipt (nhập kho)
- Goods Issue (xuất kho)
- Stock Transfer (chuyển kho)
- Stock Adjustment (điều chỉnh tồn kho)

**Input chính**:
- GOODSMVT_HEADER: Header (Posting Date, Document Date, Header Text)
- GOODSMVT_CODE: Movement Code ('01'=GI, '05'=GR, '04'=Transfer)
- GOODSMVT_ITEM: Line items (Material, Plant, SLoc, Movement Type, Quantity)

**Output**:
- GOODSMVT_HEADRET: Material Document Number (MAT_DOC)
- RETURN: Messages

**Movement Types phổ biến**:
- 101: GR for Purchase Order (nhập kho từ PO)
- 102: GR Reversal (hủy nhập kho)
- 201: GI for Cost Center (xuất kho cho cost center)
- 202: GI Reversal (hủy xuất kho)
- 311: Transfer Posting (chuyển kho giữa 2 SLoc)
- 561: Initial Entry of Stock (nhập tồn kho đầu kỳ)
- 562: Reversal of Initial Entry (giảm tồn kho)

### 3. BAPI_TRANSACTION_COMMIT
**Chức năng**: Commit database changes

**Khi nào dùng**: Sau khi BAPI thành công

**Parameter quan trọng**:
- WAIT = 'X': Đợi commit hoàn tất (recommended)

**Lưu ý**: Nếu không commit, changes sẽ bị rollback

### 4. BAPI_TRANSACTION_ROLLBACK
**Chức năng**: Hủy bỏ changes

**Khi nào dùng**: Khi BAPI trả về lỗi

---

## VALIDATION RULES QUAN TRỌNG


### 1. Validation cho Create Material

**Frontend Validation**:
- Tất cả trường required phải điền
- Material ID không được rỗng
- Material Type phải chọn
- Base Unit phải chọn
- Plant phải chọn
- Storage Location phải chọn
- Valuation Class phải chọn

**Backend Validation**:
- Plant phải tồn tại trong T001W
- Storage Location phải tồn tại trong T001L
- Storage Location phải thuộc Plant đó
- Valuation Class không được rỗng
- Material + Plant + SLoc không được trùng (check MARD)
- Material Type phải hợp lệ (check T134)
- Base Unit phải hợp lệ (check T006)

### 2. Validation cho Goods Receipt

**Frontend Validation**:
- Material ID required
- Plant required
- Storage Location required
- Quantity required và phải > 0
- Không cho phép Quantity = 0
- Không cho phép Quantity < 0 (số âm)

**Backend Validation**:
- Plant & Storage Location hợp lệ
- Material phải tồn tại trong MARA
- Material phải được extend sang Plant/SLoc đó (có MARC và MARD)
- Nếu chưa extend → Tự động extend trước khi GR

**Lý do Quantity > 0**:
- Đây là chuẩn nghiệp vụ SAP MM
- Goods Receipt là nhập kho → Phải có số lượng dương
- Nếu muốn xuất kho → Dùng Goods Issue (Movement Type khác)
- Nếu muốn điều chỉnh giảm → Dùng Stock Adjustment

### 3. Validation cho Update Stock

**Frontend Validation**:
- Quantity phải >= 0
- Không cho phép số âm

**Backend Validation**:
- Quantity >= 0
- Plant & Storage Location hợp lệ
- Material phải tồn tại
- Material phải có MARC và MARD

**Logic xử lý**:
- Nếu Quantity mới = Quantity cũ → Không làm gì
- Nếu Quantity mới > Quantity cũ → Tạo Material Document với Movement Type 561
- Nếu Quantity mới < Quantity cũ → Tạo Material Document với Movement Type 562

---

## ERROR HANDLING

### 1. Frontend Error Handling

**Validation Error**:
- Hiển thị message ngay trên form
- Set valueState = "Error" cho control
- Set valueStateText = "This field is required"
- User sửa → Tự động clear error

**OData Error**:
- Parse error message từ Backend
- Hiển thị MessageBox.error()
- Log error vào console
- Giữ dialog mở để user sửa

**Network Error**:
- Hiển thị "Network error. Please check your connection"
- Retry mechanism (optional)

### 2. Backend Error Handling

**Business Exception**:
- Throw /iwbep/cx_mgw_busi_exception
- Add message vào message container
- Frontend nhận HTTP 400 Bad Request
- Message hiển thị cho user

**BAPI Error**:
- Check RETURN table có type = 'E' hoặc 'A'
- Gọi BAPI_TRANSACTION_ROLLBACK
- Loop qua RETURNMESSAGES và add vào message container
- Throw exception

**Database Error**:
- Catch CX_ROOT
- Log error
- Rollback transaction
- Trả về generic error message

---

## TIMEZONE HANDLING

### Vấn đề
- Frontend chạy ở GMT+7 (Việt Nam)
- Backend SAP chạy ở UTC hoặc timezone khác
- Khi gửi date "20/03/2026 00:00" → Backend nhận "19/03/2026 17:00"
- Dẫn đến sai ngày

### Giải pháp
**Frontend**: Method _toUtcNoon()
- Lấy ngày/tháng/năm theo local time
- Tạo Date object mới ở 12:00 UTC (noon)
- Ví dụ: 20/03/2026 → 20/03/2026 12:00 UTC
- Khi Backend cắt chuỗi ISO lấy phần ngày → Luôn đúng

**Backend**: Method _to_dats()
- Parse string date từ OData filter
- Remove "datetime'", quotes, time part
- Extract digits only
- Validate date plausibility
- Return DATS format (YYYYMMDD)

---

## PERFORMANCE OPTIMIZATION

### 1. Frontend

**Lazy Loading**:
- Dialog chỉ load khi cần (Fragment.load)
- Không load tất cả dialogs lúc init

**Data Binding**:
- Sử dụng 2-way binding để tự động sync
- Không cần manually get/set value

**Batch Request**:
- Group multiple OData requests thành 1 batch
- Giảm số lượng HTTP calls

**Client-side Filter**:
- Filter Low Stock Alert ở client
- Không cần gọi OData riêng

### 2. Backend

**Query Optimization**:
- Sử dụng SELECT SINGLE khi chỉ cần 1 record
- Sử dụng WHERE clause để filter
- Chỉ SELECT các fields cần thiết
- Sử dụng INDEX

**BAPI vs Direct Update**:
- Luôn dùng BAPI thay vì direct UPDATE
- BAPI đảm bảo data consistency
- BAPI trigger các logic nghiệp vụ khác

**Commit Strategy**:
- Chỉ commit khi BAPI thành công
- Rollback ngay khi có lỗi
- Sử dụng WAIT = 'X' để đảm bảo commit hoàn tất

---

## SECURITY

### 1. CSRF Token
**Mục đích**: Chống Cross-Site Request Forgery

**Cách hoạt động**:
- Frontend gọi refreshSecurityToken() trước POST/PUT/DELETE
- Backend trả về token trong header x-csrf-token
- Frontend gửi token này trong request tiếp theo
- Backend validate token → Chỉ accept request hợp lệ

### 2. Authorization
**SAP Authorization Objects**:
- M_MSEG_BWA: Authorization cho Movement Type
- M_MATE_WRK: Authorization cho Plant
- M_MATE_LGO: Authorization cho Storage Location

**Check trong BAPI**:
- BAPI tự động check authorization
- Nếu user không có quyền → BAPI trả về lỗi
- Frontend hiển thị "No authorization"

### 3. Input Validation
**Frontend**:
- Validate format, length, required
- Sanitize input trước khi gửi

**Backend**:
- Validate lại tất cả input
- Check business rules
- Prevent SQL injection (dùng prepared statements)

---

## TESTING

### 1. Unit Testing
**Frontend**:
- Test Controller methods
- Test Service calls
- Test Validator logic
- Test Formatter functions

**Backend**:
- Test validation methods
- Test helper methods
- Mock BAPI calls

### 2. Integration Testing
**OData Service**:
- Test GET /MaterialSet
- Test POST /MaterialSet
- Test PUT /StockSet
- Test GET /HistorySet với filters

**End-to-End**:
- Test toàn bộ flow Create Material
- Test toàn bộ flow Goods Receipt
- Test cascade filters
- Test error scenarios

### 3. User Acceptance Testing
- User thực tế test trên môi trường UAT
- Verify nghiệp vụ đúng
- Verify UI/UX
- Verify performance

---

## KẾT LUẬN

### Điểm mạnh của dự án

1. **Kiến trúc rõ ràng**: Frontend-Backend-Database tách biệt
2. **Chuẩn SAP**: Sử dụng BAPI, tuân thủ nghiệp vụ MM
3. **Validation đầy đủ**: Frontend và Backend đều validate
4. **Error Handling tốt**: Xử lý lỗi và hiển thị message rõ ràng
5. **UI/UX đẹp**: Glass morphism, animations, responsive
6. **Performance**: Lazy loading, client-side filter, batch request
7. **Security**: CSRF token, authorization check

### Công nghệ sử dụng

**Frontend**:
- SAP UI5 Framework
- JavaScript (ES6+)
- XML Views
- OData V2 Protocol
- JSON Model

**Backend**:
- ABAP (SAP Programming Language)
- OData Service (Gateway)
- BAPI (Business API)
- SAP Tables

**Database**:
- SAP HANA / SAP ECC Database
- Standard SAP Tables

### Kỹ năng học được

1. SAP Fiori Development
2. OData Service consumption
3. ABAP OData Service development
4. SAP MM Module (Material Management)
5. BAPI usage
6. Error handling & validation
7. UI/UX design
8. Performance optimization
9. Security best practices

---

**Tài liệu này giải thích chi tiết từ A-Z cách hệ thống hoạt động, phù hợp để trình bày cho cô giáo và trả lời mọi câu hỏi về nghiệp vụ, kỹ thuật, luồng xử lý.**


---

## GIẢI THÍCH BACKEND CHI TIẾT (ABAP CLASS)

### Tổng quan Class Backend

**Tên Class**: `ZCL_ZGW_WH_ODATA_DPC_EXT`

**Vai trò**: 
- Đây là class xử lý OData Service cho hệ thống quản lý kho
- Kế thừa từ class `ZCL_ZGW_WH_ODATA_DPC` (được SAP Gateway tự động generate)
- Chứa toàn bộ logic nghiệp vụ để xử lý request từ Frontend

**Cấu trúc Class gồm 3 phần**:

1. **PUBLIC SECTION**: Không có gì (để trống)
2. **PROTECTED SECTION**: Các method REDEFINITION (override từ parent class)
3. **PRIVATE SECTION**: Các helper methods (validation, error handling)

---

### PROTECTED SECTION - Các Method chính

#### Nhóm 1: Material Management (Quản lý vật tư)

**1. materialset_get_entityset**
- **Mục đích**: Lấy danh sách vật tư
- **Khi nào gọi**: Frontend gọi GET /MaterialSet
- **Xử lý**:
  - Parse filter từ Frontend (MaterialId, MaterialType)
  - Chuyển filter thành RANGE tables (giống mảng điều kiện)
  - Convert Material ID có leading zeros
  - Query từ table MARA (Material Master) JOIN MAKT (Material Description)
  - Trả về danh sách vật tư (max 100 nếu không có filter)
  - Remove leading zeros trước khi trả về Frontend

**2. materialset_get_entity**
- **Mục đích**: Lấy chi tiết 1 vật tư
- **Khi nào gọi**: Frontend gọi GET /MaterialSet('TEST001')
- **Xử lý**:
  - Lấy MaterialId từ URL
  - Convert có leading zeros
  - Query 1 record từ MARA JOIN MAKT
  - Trả về thông tin vật tư

**3. materialset_create_entity**
- **Mục đích**: Tạo vật tư mới
- **Khi nào gọi**: Frontend gọi POST /MaterialSet
- **Xử lý từng bước**:
  1. Đọc data từ request (JSON → ABAP structure)
  2. Validate Plant & Storage Location hợp lệ
  3. Validate Valuation Class bắt buộc
  4. Chuẩn hóa Material ID (leading zeros, uppercase)
  5. Check trùng lặp (Material + Plant + SLoc)
  6. Chuẩn bị data cho BAPI:
     - Header: Material, Type, Industry Sector
     - Client Data: Base Unit
     - Plant Data: Plant
     - Storage Location Data: Plant + SLoc
     - Valuation Data: Valuation Class, Price Control
     - Description: Material Name
  7. Gọi BAPI_MATERIAL_SAVEDATA
  8. Check kết quả BAPI:
     - Có lỗi → Rollback + throw exception
     - Thành công → Commit
  9. Remove leading zeros và trả về Frontend

---

#### Nhóm 2: Stock Management (Quản lý tồn kho)

**4. stockset_get_entityset**
- **Mục đích**: Lấy danh sách tồn kho
- **Khi nào gọi**: GET /StockSet
- **Xử lý**:
  - Parse filters: MaterialId, Plant, StorageLocation
  - Query từ MARD (Storage Location Stock) JOIN MARA JOIN MAKT
  - Trả về: Material, Plant, SLoc, Quantity (LABST), BaseUnit, Name

**5. stockset_get_entity**
- **Mục đích**: Lấy chi tiết 1 dòng tồn kho
- **Khi nào gọi**: GET /StockSet(MaterialId='...',Plant='...',StorageLocation='...')
- **Xử lý**: Query 1 record từ MARD với 3 keys

**6. stockset_update_entity**
- **Mục đích**: Cập nhật số lượng tồn kho
- **Khi nào gọi**: PUT /StockSet(...)
- **Xử lý từng bước**:
  1. Đọc data từ request
  2. Validate Quantity >= 0 (không cho phép âm)
  3. Validate Plant & SLoc
  4. Ensure material extended (tạo MARC/MARD nếu chưa có)
  5. Đọc tồn kho hiện tại từ MARD
  6. Tính chênh lệch: diff = Quantity mới - Quantity cũ
  7. Nếu diff = 0 → Return (không làm gì)
  8. Nếu diff > 0 → Movement Type 561 (tăng tồn)
  9. Nếu diff < 0 → Movement Type 562 (giảm tồn)
  10. Chuẩn bị data cho BAPI_GOODSMVT_CREATE:
      - Header: Posting Date, Document Date, Header Text
      - Code: '05' (Goods Receipt/Issue)
      - Item: Material, Plant, SLoc, Movement Type, Quantity
  11. Gọi BAPI → Tạo Material Document
  12. Check kết quả → Commit hoặc Rollback

---

#### Nhóm 3: Goods Receipt (Nhập kho)

**7. goodsreceiptset_create_entity**
- **Mục đích**: Nhập kho vật tư
- **Khi nào gọi**: POST /GoodsReceiptSet
- **Xử lý từng bước**:
  1. Đọc data: Material, Plant, SLoc, Quantity, Dates, Remark
  2. Validate Plant & SLoc
  3. Convert Material ID
  4. Ensure material extended
  5. Lấy Base Unit từ MARA
  6. Chuẩn bị data cho BAPI:
     - Header: Posting Date, Document Date, Remark
     - Code: '05'
     - Item: Material, Plant, SLoc, Movement Type 561, Quantity
  7. Gọi BAPI_GOODSMVT_CREATE
  8. Nhận Material Document Number
  9. Commit
  10. Trả về Material Document cho Frontend

**Kết quả**: Tạo chứng từ nhập kho, tăng tồn kho trong MARD

---

#### Nhóm 4: Dashboard KPI

**8. dashboardkpiset_get_entity**
- **Mục đích**: Tính KPI cho Dashboard
- **Khi nào gọi**: GET /DashboardKPISet('1')
- **Xử lý**:
  - KPI 1: SELECT COUNT(*) FROM MARA → Tổng số vật tư
  - KPI 2: SELECT SUM(LABST) FROM MARD → Tổng tồn kho
  - KPI 3: SELECT COUNT(*) FROM MARD WHERE LABST <= 10 → Vật tư tồn thấp
  - KPI 4: SELECT COUNT(DISTINCT WERKS) FROM MARD → Số Plant
  - Trả về 1 record với 4 KPIs

**9. dashboardkpiset_get_entityset**
- Giống get_entity nhưng trả về dạng array (có 1 phần tử)

---

#### Nhóm 5: Transaction History (Lịch sử giao dịch)

**10. historyset_get_entityset**
- **Mục đích**: Lấy lịch sử Material Documents
- **Khi nào gọi**: GET /HistorySet
- **Xử lý từng bước**:
  1. Parse filters: MaterialId, Plant, SLoc, PostingDate, DocumentDate
  2. Convert date filters từ string → DATS format
  3. Query từ MKPF (Material Document Header) JOIN MSEG (Items) JOIN MAKT
  4. Apply WHERE conditions với các filters
  5. Sort by PostingDate descending (mới nhất trước)
  6. Loop qua kết quả:
     - Copy các fields
     - Convert Material ID remove leading zeros
     - Xử lý Debit/Credit:
       - SHKZG = 'S' (Debit) → Quantity dương
       - SHKZG = 'H' (Credit) → Quantity âm (nhân -1)
     - Set Status = 'POSTED'
  7. Trả về list cho Frontend

**Giải thích SHKZG**:
- Đây là indicator Debit/Credit trong SAP
- 'S' (Soll - Debit): Nhập kho → Quantity dương
- 'H' (Haben - Credit): Xuất kho → Quantity âm

---

#### Nhóm 6: Master Data (Dữ liệu danh mục)

**11. plantmasterset_get_entityset**
- **Mục đích**: Lấy danh sách Plant
- **Query**: SELECT WERKS, NAME1 FROM T001W
- **Trả về**: PlantId, PlantName

**12. storagelocationm_get_entityset**
- **Mục đích**: Lấy danh sách Storage Location
- **Query**: SELECT LGORT, LGOBE, WERKS FROM T001L
- **Filter**: Có thể filter theo PlantId
- **Trả về**: StorageLocationId, StorageLocationName, PlantId

**13. materialtypemast_get_entityset**
- **Mục đích**: Lấy danh sách Material Type
- **Query**: SELECT MTART, MTBEZ FROM T134 JOIN T134T
- **Trả về**: Mtart (ROH, FERT...), Mtbez (Raw Material, Finished Product...)

**14. baseunitmasteset_get_entityset**
- **Mục đích**: Lấy danh sách Unit of Measure
- **Query**: SELECT MSEHI, MSEHL FROM T006 JOIN T006A
- **Trả về**: Msehi (EA, KG, L...), Msehl (Each, Kilogram, Liter...)

**15. valuationclassma_get_entityset**
- **Mục đích**: Lấy danh sách Valuation Class
- **Query**: SELECT BKLAS, BKBEZ FROM T025 JOIN T025T JOIN T134
- **Filter**: Theo MaterialType (vì mỗi type có valuation class riêng)
- **Trả về**: ValuationClass (3000, 3010...), Description, MaterialType

---

### PRIVATE SECTION - Helper Methods

#### 1. _raise_busi_error
**Mục đích**: Throw business exception với error message

**Cách hoạt động**:
- Nhận vào error text
- Add message vào OData message container
- Throw exception /iwbep/cx_mgw_busi_exception
- Frontend sẽ nhận HTTP 400 Bad Request với message này

**Khi nào dùng**: Mọi validation lỗi đều gọi method này

---

#### 2. _validate_plant_sloc
**Mục đích**: Validate Plant và Storage Location hợp lệ

**Xử lý từng bước**:
1. Check Plant và SLoc không rỗng
2. Query T001W để check Plant tồn tại
   - Không tìm thấy → Throw error "Plant not found"
3. Query T001L để check SLoc tồn tại và thuộc Plant đó
   - Không tìm thấy → Throw error "Storage location does not exist in plant"

**Tại sao cần**: Đảm bảo Plant/SLoc hợp lệ trước khi tạo Material hoặc GR

---

#### 3. _ensure_material_extended
**Mục đích**: Đảm bảo Material đã được extend sang Plant/SLoc

**Giải thích vấn đề**:
- Material có thể tồn tại trong MARA (general data)
- Nhưng chưa có MARC (plant data) hoặc MARD (storage location data)
- Không thể GR nếu chưa có MARC/MARD

**Xử lý từng bước**:
1. Query MARA để check Material tồn tại
   - Không có → Throw error "Material not found"
2. Query MARC để check Material có ở Plant này chưa
3. Query MARD để check Material có ở SLoc này chưa
4. Nếu đã có cả MARC và MARD → Return (không làm gì)
5. Nếu thiếu → Gọi BAPI_MATERIAL_SAVEDATA để extend:
   - Tạo MARC với Plant
   - Tạo MARD với Plant + SLoc
6. Check kết quả BAPI → Commit hoặc Rollback

**Khi nào gọi**: Trước khi GR hoặc Update Stock

---

#### 4. _append_bapiret2
**Mục đích**: Add tất cả BAPI messages vào OData message container

**Xử lý**:
- Loop qua BAPI return messages table
- Với mỗi message:
  - Skip nếu message rỗng
  - Add vào message container với type (E/W/I/S)
- Frontend sẽ nhận được tất cả messages

**Khi nào dùng**: Sau khi gọi BAPI có lỗi

---

#### 5. _to_dats
**Mục đích**: Convert date string từ OData filter thành DATS format

**Input**: "datetime'2026-03-20T00:00:00'" hoặc "2026-03-20"
**Output**: "20260320" (DATS format YYYYMMDD)

**Xử lý từng bước**:
1. Remove "datetime'", quotes, time part
2. Extract chỉ các chữ số
3. Lấy 8 ký tự đầu tiên
4. Gọi DATE_CHECK_PLAUSIBILITY để validate
5. Nếu không hợp lệ → Return rỗng

**Khi nào dùng**: Khi parse date filter từ Frontend trong History

---

## FLOW TỔNG THỂ - VÍ DỤ TẠO VẬT TƯ

### Frontend gửi request:
```
POST /sap/opu/odata/sap/ZGW_WH_ODATA_SRV/MaterialSet
Body: {
  "MaterialId": "TEST001",
  "MaterialName": "Test Material",
  "MaterialType": "ROH",
  "BaseUnit": "EA",
  "Plant": "1000",
  "StorageLocation": "0001",
  "ValuationClass": "3000"
}
```

### Backend xử lý:

**Bước 1**: SAP Gateway nhận request → Gọi materialset_create_entity

**Bước 2**: io_data_provider->read_entry_data() → Parse JSON thành ABAP structure

**Bước 3**: _validate_plant_sloc() → Check Plant 1000 và SLoc 0001 hợp lệ

**Bước 4**: Check Valuation Class không rỗng

**Bước 5**: CONVERSION_EXIT_MATN1_INPUT → "TEST001" thành "000000000000TEST001"

**Bước 6**: Query MARD check trùng lặp

**Bước 7**: Chuẩn bị structures cho BAPI:
- ls_head: Material, Type, Industry Sector
- ls_dat: Base Unit
- ls_marc: Plant
- ls_mard: Plant + SLoc
- ls_mbew: Valuation Class, Price Control
- lt_desc: Material Name

**Bước 8**: BAPI_MATERIAL_SAVEDATA → Insert vào MARA, MARC, MARD, MBEW, MAKT

**Bước 9**: Check BAPI return messages:
- Có type 'E' hoặc 'A' → BAPI_TRANSACTION_ROLLBACK → Throw exception
- Không có lỗi → BAPI_TRANSACTION_COMMIT

**Bước 10**: CONVERSION_EXIT_MATN1_OUTPUT → "000000000000TEST001" thành "TEST001"

**Bước 11**: er_entity = ls_req → Set response data

**Bước 12**: SAP Gateway convert ABAP structure → JSON → Trả về Frontend

### Frontend nhận response:
```
Status: 201 Created
Body: {
  "MaterialId": "TEST001",
  "MaterialName": "Test Material",
  ...
}
```

---

## KẾT LUẬN BACKEND

### Điểm mạnh:

1. **Validation đầy đủ**: Check Plant, SLoc, Valuation Class, Duplicate
2. **Error Handling tốt**: Rollback khi lỗi, throw exception rõ ràng
3. **Sử dụng BAPI chuẩn SAP**: Đảm bảo data consistency
4. **Leading zeros handling**: Convert đúng format SAP
5. **Ensure material extended**: Tự động tạo MARC/MARD nếu thiếu
6. **Transaction control**: Commit khi thành công, Rollback khi lỗi

### Công nghệ sử dụng:

- **ABAP**: Ngôn ngữ lập trình SAP
- **OData Gateway**: Framework tạo REST API
- **BAPI**: Business API chuẩn SAP
- **SAP Tables**: MARA, MARC, MARD, MKPF, MSEG, T001W, T001L...

### Kỹ năng cần có:

1. ABAP programming
2. SAP MM Module knowledge
3. OData Service development
4. BAPI usage
5. SAP Table structure
6. Error handling & validation
7. Transaction management

**Tài liệu này giải thích chi tiết Backend từ A-Z, phù hợp để trả lời mọi câu hỏi của cô giáo về cách Backend xử lý request, validate, gọi BAPI, và trả về response.**
