# GIẢI THÍCH TƯƠNG TÁC FRONTEND - BACKEND

## MỤC LỤC

1. Tổng quan kiến trúc
2. Vai trò từng thành phần
3. Cách chúng gọi nhau
4. Flow 5 chức năng chính
5. Sơ đồ tương tác

---

## PHẦN 1: TỔNG QUAN KIẾN TRÚC

### 1.1. Các thành phần Frontend

```
┌─────────────────────────────────────────────────┐
│              FRONTEND (SAP UI5)                  │
├─────────────────────────────────────────────────┤
│                                                  │
│  1. VIEW (XML)          - Giao diện người dùng  │
│  2. CONTROLLER (JS)     - Logic xử lý sự kiện   │
│  3. FRAGMENT (XML)      - Dialog/Popup          │
│  4. MODEL (OData/JSON)  - Quản lý dữ liệu       │
│  5. SERVICE (JS)        - Helper gọi API        │
│  6. i18n (properties)   - Text đa ngôn ngữ      │
│  7. FORMATTER (JS)      - Format hiển thị       │
│                                                  │
└─────────────────────────────────────────────────┘
```

### 1.2. Các thành phần Backend

```
┌─────────────────────────────────────────────────┐
│              BACKEND (SAP ABAP)                  │
├─────────────────────────────────────────────────┤
│                                                  │
│  1. STRUCTURE           - Định nghĩa dữ liệu    │
│  2. DPC_EXT CLASS       - Logic xử lý           │
│  3. METHODS             - CRUD operations       │
│  4. BAPI                - SAP standard API      │
│  5. SAP TABLES          - Database              │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

## PHẦN 2: VAI TRÒ TỪNG THÀNH PHẦN

### 2.1. Frontend Components

**VIEW (XML)**
- Vai trò: Hiển thị giao diện
- Chứa: Table, Button, Input, ComboBox...
- Không có logic
- Bind dữ liệu từ Model
- Trigger events đến Controller

**CONTROLLER (JavaScript)**
- Vai trò: Xử lý logic nghiệp vụ
- Nhận events từ View
- Validate dữ liệu
- Gọi Service để tương tác Backend
- Update UI sau khi nhận response
- Điều hướng giữa các màn hình

**FRAGMENT (XML)**
- Vai trò: Dialog/Popup tái sử dụng
- Giống View nhưng nhỏ hơn
- Không có Controller riêng
- Dùng Controller của View cha
- Load động khi cần

**MODEL**
- OData Model: Kết nối Backend, tự động sync dữ liệu
- JSON Model: Lưu dữ liệu local (form data, UI state)
- Resource Model: Lưu text đa ngôn ngữ (i18n)

**SERVICE (JavaScript)**
- Vai trò: Wrapper gọi Backend API
- Centralize API calls
- Handle CSRF token
- Return Promise
- Reusable across controllers

**i18n (properties file)**
- Vai trò: Quản lý text đa ngôn ngữ
- Key-value format
- View bind đến i18n model
- Controller lấy text qua getText()

**FORMATTER (JavaScript)**
- Vai trò: Format dữ liệu hiển thị
- Format number, date, status...
- Thêm màu sắc (red/yellow/green)
- Convert mã thành text dễ hiểu



### 2.2. Backend Components

**STRUCTURE**
- Vai trò: Định nghĩa format dữ liệu
- Contract giữa Frontend và Backend
- Frontend gửi JSON → Backend parse thành Structure
- Backend trả Structure → SAP Gateway convert thành JSON
- Type-safe, tái sử dụng

**DPC_EXT CLASS**
- Vai trò: Class chứa logic xử lý
- Kế thừa từ DPC (auto-generated)
- Override methods để implement logic
- Có 15 methods cho 5 entity sets + 5 master data

**METHODS**
- get_entityset: Lấy danh sách (GET /EntitySet)
- get_entity: Lấy 1 record (GET /EntitySet('key'))
- create_entity: Tạo mới (POST /EntitySet)
- update_entity: Cập nhật (PUT /EntitySet('key'))

**BAPI**
- Vai trò: SAP standard API
- BAPI_MATERIAL_SAVEDATA: Tạo/update material
- BAPI_GOODSMVT_CREATE: Tạo goods movement
- Đảm bảo data consistency

**SAP TABLES**
- MARA: Material master
- MARC: Material plant data
- MARD: Storage location stock
- MBEW: Material valuation
- MAKT: Material description
- MKPF: Material document header
- MSEG: Material document item
- T001W: Plants
- T001L: Storage locations

---

## PHẦN 3: CÁCH CHÚNG GỌI NHAU

### 3.1. Frontend Internal Flow

```
USER
  ↓ (click/input)
VIEW
  ↓ (trigger event: press="onSave")
CONTROLLER
  ↓ (validate data)
  ↓ (call MaterialService.createMaterial())
SERVICE
  ↓ (oModel.create())
ODATA MODEL
  ↓ (HTTP POST request)
```

**Chi tiết từng bước**:

**1. USER → VIEW**
- User click button, nhập input, chọn combobox
- View trigger event đã khai báo

**2. VIEW → CONTROLLER**
- Event handler trong Controller được gọi
- Ví dụ: press="onSaveMaterial" → Controller.onSaveMaterial()

**3. CONTROLLER → SERVICE**
- Controller validate dữ liệu
- Gọi Service method
- Ví dụ: MaterialService.createMaterial(oModel, oPayload)

**4. SERVICE → ODATA MODEL**
- Service gọi OData Model methods
- oModel.create(), oModel.read(), oModel.update()
- Service wrap trong Promise

**5. ODATA MODEL → BACKEND**
- SAP UI5 tự động tạo HTTP request
- POST, GET, PUT, DELETE
- Gửi đến Backend URL

### 3.2. Backend Internal Flow

```
HTTP REQUEST
  ↓ (SAP Gateway nhận)
SAP GATEWAY
  ↓ (parse JSON → Structure)
STRUCTURE
  ↓ (pass to method)
DPC_EXT METHOD
  ↓ (validate)
  ↓ (call BAPI)
BAPI
  ↓ (insert/update)
SAP TABLES
  ↓ (return result)
DPC_EXT METHOD
  ↓ (return Structure)
SAP GATEWAY
  ↓ (convert Structure → JSON)
HTTP RESPONSE
```

**Chi tiết từng bước**:

**1. HTTP REQUEST → SAP GATEWAY**
- SAP Gateway nhận HTTP request
- Parse URL, headers, body

**2. SAP GATEWAY → STRUCTURE**
- Parse JSON body thành Structure
- Ví dụ: JSON → zst_wh_material

**3. STRUCTURE → DPC_EXT METHOD**
- SAP Gateway gọi method tương ứng
- POST /MaterialSet → materialset_create_entity
- GET /MaterialSet → materialset_get_entityset

**4. DPC_EXT METHOD → BAPI**
- Method validate dữ liệu
- Chuẩn bị data cho BAPI
- Gọi BAPI (BAPI_MATERIAL_SAVEDATA, BAPI_GOODSMVT_CREATE...)

**5. BAPI → SAP TABLES**
- BAPI insert/update vào SAP tables
- MARA, MARC, MARD, MBEW, MAKT...
- Đảm bảo data consistency

**6. SAP TABLES → DPC_EXT METHOD**
- BAPI return result (success/error)
- Method check lỗi
- Commit hoặc Rollback

**7. DPC_EXT METHOD → STRUCTURE**
- Method return Structure
- Chứa data response

**8. STRUCTURE → SAP GATEWAY**
- SAP Gateway convert Structure → JSON

**9. SAP GATEWAY → HTTP RESPONSE**
- Gửi HTTP response về Frontend
- Status code: 200, 201, 400, 404, 500...

### 3.3. Frontend Response Handling

```
HTTP RESPONSE
  ↓ (SAP UI5 nhận)
ODATA MODEL
  ↓ (parse JSON)
SERVICE
  ↓ (resolve/reject Promise)
CONTROLLER
  ↓ (success: update UI)
  ↓ (error: show message)
VIEW
  ↓ (refresh display)
USER
  ↓ (sees result)
```

**Chi tiết từng bước**:

**1. HTTP RESPONSE → ODATA MODEL**
- SAP UI5 nhận HTTP response
- Parse JSON body

**2. ODATA MODEL → SERVICE**
- OData Model trigger success/error callback
- Service resolve hoặc reject Promise

**3. SERVICE → CONTROLLER**
- Controller nhận Promise result
- .then() cho success
- .catch() cho error

**4. CONTROLLER → VIEW**
- Success: Close dialog, refresh table, show success message
- Error: Show error message, keep dialog open

**5. VIEW → USER**
- User thấy kết quả
- Success message hoặc error message
- Table updated với data mới

---

## PHẦN 4: FLOW 5 CHỨC NĂNG CHÍNH

### 4.1. CREATE MATERIAL (Tạo Vật Tư)

**Frontend Flow**:
```
1. User click "Create Material" button
   → View trigger event press="onAddMaterial"
   
2. Controller.onAddMaterial()
   → Reset FormModel
   → Load Fragment (MaterialCreateDialog)
   → Open Dialog
   
3. Dialog hiển thị
   → ComboBox bind to /PlantMasterSet
   → SAP UI5 tự động gọi GET /PlantMasterSet
   
4. Backend trả master data
   → ComboBox hiển thị Plants
   
5. User nhập data
   → Two-way binding update FormModel
   
6. User chọn Plant
   → Event selectionChange="onChangePlant"
   → Controller filter Storage Location ComboBox
   → GET /StorageLocationMasterSet?$filter=PlantId eq '1000'
   
7. User click "Save"
   → Event press="onSaveMaterial"
   → Controller validate data
   → Controller.onSaveMaterial() → Controller._createMaterial()
   
8. Controller gọi Service
   → MaterialService.createMaterial(oModel, oPayload)
   
9. Service gọi OData Model
   → oModel.create("/MaterialSet", oPayload)
   
10. SAP UI5 gửi HTTP request
    → POST /MaterialSet
    → Body: JSON payload
```

**Backend Flow**:
```
1. SAP Gateway nhận POST /MaterialSet
   → Parse JSON → Structure zst_wh_material
   
2. Gọi method materialset_create_entity
   → Nhận Structure từ io_data_provider
   
3. Validate
   → _validate_plant_sloc (check Plant & SLoc hợp lệ)
   → Check Valuation Class required
   → Chuẩn hóa Material ID (leading zeros)
   → Check duplicate trong MARD
   
4. Chuẩn bị BAPI data
   → Header: Material, Type, Views
   → Client data: Base Unit
   → Plant data: Plant
   → Valuation data: Valuation Class, Price Control
   → Storage Location data: Plant, SLoc
   → Description: Material Name
   
5. Gọi BAPI_MATERIAL_SAVEDATA
   → BAPI insert vào MARA, MARC, MARD, MBEW, MAKT
   
6. Check lỗi
   → Nếu có lỗi: Rollback, add messages, throw exception
   → Nếu success: Commit
   
7. Return Structure
   → Remove leading zeros từ Material ID
   → er_entity = Structure
   
8. SAP Gateway convert Structure → JSON
   → HTTP 201 Created
```

**Frontend Response Handling**:
```
1. Service nhận response
   → resolve(oData)
   
2. Controller.then()
   → Show success message
   → Close Dialog
   → Refresh table (onRefresh)
   
3. Table refresh
   → SAP UI5 gọi GET /MaterialSet
   → Backend return updated list
   → Table hiển thị material mới
```



### 4.2. GOODS RECEIPT (Nhập Kho)

**Frontend Flow**:
```
1. User vào StockList, click "Goods Receipt" button
   → View trigger event press="onOpenGoodsReceipt"
   
2. Controller.onOpenGoodsReceipt()
   → Lấy MaterialId, Plant, SLoc từ selected row
   → Set vào FormModel
   → Load Fragment (GoodsReceiptDialog)
   → Open Dialog
   
3. Dialog hiển thị
   → Material info đã được pre-fill
   → User chỉ cần nhập Quantity, Posting Date, Remark
   
4. User nhập Quantity = 100
   → Two-way binding update FormModel
   
5. User click "Confirm"
   → Event press="onConfirmGoodsReceipt"
   → Controller validate Quantity > 0
   → Controller gọi Service
   
6. Service gọi OData Model
   → GoodsReceiptService.createGoodsReceipt(oModel, oPayload)
   → oModel.create("/GoodsReceiptSet", oPayload)
   
7. SAP UI5 gửi HTTP request
   → POST /GoodsReceiptSet
   → Body: { MaterialId, Plant, SLoc, Quantity, PostingDate, Remark }
```

**Backend Flow**:
```
1. SAP Gateway nhận POST /GoodsReceiptSet
   → Parse JSON → Structure zst_wh_gr_req
   
2. Gọi method goodsreceiptset_create_entity
   → Nhận Structure
   
3. Validate
   → Check Quantity > 0 (KHÔNG cho phép = 0 hoặc < 0)
   → _validate_plant_sloc
   → Chuẩn hóa Material ID
   → _ensure_material_extended (check MARC & MARD tồn tại)
   
4. Parse dates
   → Convert PostingDate string → DATS format
   → Convert DocumentDate string → DATS format
   → Nếu không có → Dùng ngày hôm nay
   
5. Chuẩn bị BAPI data
   → Header: Posting Date, Document Date, Header Text (Remark)
   → Code: GM Code = '01' (Goods Receipt)
   → Item: Material, Plant, SLoc, Movement Type = 561, Quantity, Unit
   
6. Gọi BAPI_GOODSMVT_CREATE
   → BAPI tạo Material Document (MKPF + MSEG)
   → BAPI update MARD (tăng quantity)
   → Return Material Document Number
   
7. Check lỗi
   → Nếu có lỗi: Rollback, throw exception
   → Nếu success: Commit
   
8. Set response
   → MaterialDocument = Document Number từ BAPI
   → Status = 'SUCCESS'
   → Message = "Material Document XXX created successfully"
   
9. Return Structure
   → SAP Gateway convert → JSON
   → HTTP 201 Created
```

**Frontend Response Handling**:
```
1. Service nhận response
   → resolve(oData)
   → oData chứa MaterialDocument, Status, Message
   
2. Controller.then()
   → Show success message với Document Number
   → Close Dialog
   → Refresh Stock table
   
3. Table refresh
   → GET /StockSet
   → Backend return updated stock (quantity đã tăng)
   → Table hiển thị quantity mới
```

**Điểm khác biệt với Create Material**:
- Goods Receipt CHỈ cho phép Quantity > 0
- Tạo Material Document (có Document Number)
- Update stock ngay lập tức
- Movement Type cố định = 561

---

### 4.3. UPDATE STOCK (Điều Chỉnh Tồn Kho)

**Frontend Flow**:
```
1. User vào StockDetail, click "Update Stock" button
   → View trigger event press="onUpdateStock"
   
2. Controller.onUpdateStock()
   → Lấy current quantity từ binding context
   → Set vào FormModel
   → Load Fragment (UpdateStockDialog)
   → Open Dialog
   
3. Dialog hiển thị
   → Current Quantity: 100
   → User nhập New Quantity: 150
   
4. User click "Confirm"
   → Event press="onConfirmUpdate"
   → Controller validate New Quantity >= 0
   → Controller gọi Service
   
5. Service gọi OData Model
   → StockService.updateStock(oModel, sPath, oPayload)
   → oModel.update(sPath, oPayload)
   → sPath = "/StockSet(MaterialId='...',Plant='...',StorageLocation='...')"
   
6. SAP UI5 gửi HTTP request
   → PUT /StockSet(...)
   → Body: { Quantity: 150 }
```

**Backend Flow**:
```
1. SAP Gateway nhận PUT /StockSet(...)
   → Parse keys: MaterialId, Plant, StorageLocation
   → Parse JSON → Structure zst_wh_stock
   
2. Gọi method stockset_update_entity
   → Nhận keys và Structure
   
3. Validate
   → Check Quantity >= 0 (cho phép = 0, không cho phép < 0)
   → Chuẩn hóa Material ID
   → _ensure_material_extended
   
4. Get current quantity
   → SELECT labst FROM mard WHERE matnr = ... AND werks = ... AND lgort = ...
   → Old Quantity = 100
   
5. Calculate difference
   → New Quantity = 150 (từ Frontend)
   → Diff = 150 - 100 = +50
   
6. Determine Movement Type
   → Nếu Diff > 0: Movement Type = 561 (tăng tồn kho)
   → Nếu Diff < 0: Movement Type = 562 (giảm tồn kho)
   → Nếu Diff = 0: Return luôn (không cần update)
   
7. Chuẩn bị BAPI data
   → Header: Posting Date, Document Date
   → Code: GM Code = '04' (Transfer Posting / Stock Adjustment)
   → Item: Material, Plant, SLoc, Movement Type, Entry Quantity = abs(Diff)
   
8. Gọi BAPI_GOODSMVT_CREATE
   → BAPI tạo Material Document
   → BAPI update MARD (tăng/giảm quantity)
   
9. Check lỗi
   → Nếu có lỗi: Rollback, throw exception
   → Nếu success: Commit
   
10. Query lại MARD
    → SELECT labst FROM mard (lấy quantity mới sau update)
    → Return updated Structure
    
11. SAP Gateway convert → JSON
    → HTTP 200 OK
```

**Frontend Response Handling**:
```
1. Service nhận response
   → resolve(oData)
   → oData chứa updated quantity
   
2. Controller.then()
   → Show success message
   → Close Dialog
   → Refresh binding context
   
3. View update
   → Quantity hiển thị 150 (thay vì 100)
   → ObjectStatus color update (red/yellow/green)
```

**Logic đặc biệt**:
- Frontend gửi NEW quantity (150)
- Backend tự tính DIFF (150 - 100 = +50)
- Backend tự chọn Movement Type (561 hoặc 562)
- BAPI nhận Entry Quantity = abs(Diff) = 50
- MARD được update: 100 + 50 = 150

---

### 4.4. VIEW HISTORY (Xem Lịch Sử)

**Frontend Flow**:
```
1. User vào GoodsReceiptHistory
   → View load
   → Table bind to /HistorySet
   
2. SAP UI5 tự động gọi Backend
   → GET /HistorySet
   
3. User có thể filter
   → Search by Material ID
   → Filter by Movement Type
   → Filter by Date
   
4. Controller._applyFilters()
   → Tạo Filter objects
   → Apply vào Table binding
   
5. SAP UI5 gọi Backend với filters
   → GET /HistorySet?$filter=MaterialId eq 'TEST001' and PostingDate eq datetime'2026-03-20'
```

**Backend Flow**:
```
1. SAP Gateway nhận GET /HistorySet
   → Parse filters từ URL
   
2. Gọi method historyset_get_entityset
   → Parse filters thành RANGE tables
   → lr_matnr, lr_bwart, lr_budat...
   
3. Query database
   → SELECT từ MKPF (header) JOIN MSEG (item)
   → WHERE matnr IN lr_matnr AND bwart IN lr_bwart AND budat IN lr_budat
   → ORDER BY budat DESCENDING (mới nhất trước)
   
4. Apply pagination
   → Nếu có $top → Limit số records
   → Nếu có $skip → Skip records
   
5. Remove leading zeros
   → Material ID: "000000000000TEST001" → "TEST001"
   
6. Return table
   → SAP Gateway convert → JSON array
   → HTTP 200 OK
```

**Frontend Response Handling**:
```
1. OData Model nhận response
   → Parse JSON array
   → Update binding
   
2. Table tự động update
   → Hiển thị danh sách history
   → Mỗi dòng: Material Document, Date, Material, Movement Type, Quantity, Remark
   
3. Formatter format hiển thị
   → Quantity: "100.000" → "+ 100.000" (nếu Movement Type 561)
   → Movement Type: "561" → "Init. Stock"
   → Date: "2026-03-20" → "20/03/2026"
   → Status color: 561 → Green, 562 → Red
```

**Đặc điểm**:
- Không có Create/Update/Delete
- Chỉ có Read (GET)
- Hỗ trợ nhiều filters
- Pagination
- Sort by date descending

---

### 4.5. DASHBOARD KPI (Thống Kê)

**Frontend Flow**:
```
1. User vào Dashboard
   → View load
   → 4 KPI Tiles bind to /DashboardKPISet('1')
   
2. SAP UI5 tự động gọi Backend
   → GET /DashboardKPISet('1')
   
3. Backend trả về KPI data
   → Total Materials, Total Stock, Low Stock Count, Total Plants
   
4. View hiển thị
   → 4 Tiles với số liệu
   → Low Stock Alert table bind to /StockSet?$filter=Quantity le 10
   → Recent History table bind to /HistorySet?$top=10
```

**Backend Flow**:
```
1. SAP Gateway nhận GET /DashboardKPISet('1')
   
2. Gọi method dashboardkpiset_get_entity
   → ID luôn = '1' (chỉ có 1 record KPI)
   
3. Tính KPI 1: Total Materials
   → SELECT COUNT(DISTINCT matnr) FROM mard
   → Đếm số vật tư unique
   
4. Tính KPI 2: Total Stock
   → SELECT SUM(labst) FROM mard
   → Tổng tồn kho tất cả vật tư
   
5. Tính KPI 3: Low Stock Count
   → SELECT COUNT(DISTINCT matnr) FROM mard WHERE labst <= 10
   → Đếm vật tư có tồn kho <= 10
   
6. Tính KPI 4: Total Plants
   → SELECT COUNT(DISTINCT werks) FROM t001w
   → Đếm số Plants trong hệ thống
   
7. Return Structure
   → ls_kpi-id = '1'
   → ls_kpi-total_materials = 150
   → ls_kpi-total_stock = 12500.000
   → ls_kpi-low_stock_count = 25
   → ls_kpi-total_plants = 5
   
8. SAP Gateway convert → JSON
   → HTTP 200 OK
```

**Frontend Response Handling**:
```
1. OData Model nhận response
   → Parse JSON
   → Update binding
   
2. View tự động update
   → Tile 1: "150 Materials"
   → Tile 2: "12,500 Total Stock"
   → Tile 3: "25 Low Stock Items"
   → Tile 4: "5 Plants"
   
3. Low Stock Alert table
   → GET /StockSet?$filter=Quantity le 10
   → Backend return vật tư có quantity <= 10
   → Table hiển thị với ObjectStatus màu đỏ/vàng
   
4. Recent History table
   → GET /HistorySet?$top=10&$orderby=PostingDate desc
   → Backend return 10 giao dịch mới nhất
   → Table hiển thị với formatter
```

**Đặc điểm**:
- KPI tính real-time từ database
- Không cache
- Mỗi lần load Dashboard → Query lại
- Low Stock Alert và Recent History là separate queries



---

## PHẦN 5: SƠ ĐỒ TƯƠNG TÁC CHI TIẾT

### 5.1. Sơ đồ tổng quan

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER                                     │
│                    (Người dùng)                                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    Click, Input, Select
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                      VIEW (XML)                                  │
│  - Hiển thị giao diện                                            │
│  - Bind dữ liệu từ Model                                         │
│  - Trigger events                                                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    Event: press="onSave"
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                   CONTROLLER (JavaScript)                        │
│  - Nhận events từ View                                           │
│  - Validate dữ liệu                                              │
│  - Gọi Service                                                   │
│  - Update UI                                                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
              Call: MaterialService.createMaterial()
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                    SERVICE (JavaScript)                          │
│  - Wrapper OData calls                                           │
│  - Handle CSRF token                                             │
│  - Return Promise                                                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                  Call: oModel.create()
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                   ODATA MODEL                                    │
│  - Quản lý kết nối Backend                                       │
│  - Tạo HTTP requests                                             │
│  - Parse responses                                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                  HTTP POST /MaterialSet
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                    SAP GATEWAY                                   │
│  - Nhận HTTP request                                             │
│  - Parse JSON → Structure                                        │
│  - Route đến method                                              │
│  - Convert Structure → JSON                                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
              Call: materialset_create_entity
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                  DPC_EXT METHOD (ABAP)                           │
│  - Nhận Structure                                                │
│  - Validate dữ liệu                                              │
│  - Chuẩn bị BAPI data                                            │
│  - Gọi BAPI                                                      │
│  - Return Structure                                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
           Call: BAPI_MATERIAL_SAVEDATA
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                      BAPI (ABAP)                                 │
│  - SAP standard API                                              │
│  - Insert/Update SAP tables                                      │
│  - Đảm bảo data consistency                                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                  Insert/Update
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                   SAP TABLES (Database)                          │
│  - MARA, MARC, MARD, MBEW, MAKT                                  │
│  - MKPF, MSEG                                                    │
│  - T001W, T001L                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2. Data Flow (Request)

```
FRONTEND                                    BACKEND
────────                                    ───────

User Input
    ↓
FormModel
{ MaterialId: "TEST001",
  MaterialName: "Test",
  Plant: "1000" }
    ↓
Controller validate
    ↓
Service.createMaterial(oPayload)
    ↓
OData Model
    ↓
HTTP POST                              →    SAP Gateway
Body: JSON                                      ↓
{ "MaterialId": "TEST001",                 Parse JSON
  "MaterialName": "Test",                       ↓
  "Plant": "1000" }                        Structure
                                           ls_req-material_id = 'TEST001'
                                           ls_req-material_name = 'Test'
                                           ls_req-plant = '1000'
                                                ↓
                                           DPC_EXT Method
                                           materialset_create_entity
                                                ↓
                                           Validate
                                           - Check Plant exists
                                           - Check Valuation Class
                                           - Check duplicate
                                                ↓
                                           Chuẩn bị BAPI data
                                           ls_head-material = 'TEST001'
                                           ls_dat-base_uom = 'EA'
                                           ls_marc-plant = '1000'
                                                ↓
                                           BAPI_MATERIAL_SAVEDATA
                                                ↓
                                           Insert vào tables
                                           MARA: Material master
                                           MARC: Plant data
                                           MARD: Storage location
                                           MBEW: Valuation
                                           MAKT: Description
                                                ↓
                                           Return success
                                                ↓
                                           Commit
                                                ↓
                                           Return Structure
                                           er_entity = ls_req
                                                ↓
                                           SAP Gateway
                                           Convert Structure → JSON
```

### 5.3. Data Flow (Response)

```
BACKEND                                     FRONTEND
───────                                     ────────

SAP Gateway
Convert Structure → JSON
    ↓
HTTP 201 Created                       →    OData Model
Body: JSON                                      ↓
{ "d": {                                   Parse JSON
    "MaterialId": "TEST001",                    ↓
    "MaterialName": "Test",                Service
    "Plant": "1000"                        resolve(oData)
  }                                             ↓
}                                          Controller.then()
                                                ↓
                                           Success handling
                                           - Show message
                                           - Close dialog
                                           - Refresh table
                                                ↓
                                           GET /MaterialSet
                                                ↓
                                           Backend return list
                                                ↓
                                           Table update
                                                ↓
                                           User sees new material
```

### 5.4. Cascade ComboBox Flow

```
FRONTEND                                    BACKEND
────────                                    ───────

User chọn Plant "1000"
    ↓
Event: selectionChange="onChangePlant"
    ↓
Controller.onChangePlant()
    ↓
Reset Storage Location
FormModel: StorageLocation = ""
    ↓
Filter Storage Location ComboBox
oBinding.filter([
  new Filter("PlantId", "EQ", "1000")
])
    ↓
SAP UI5 gọi Backend                    →    SAP Gateway
GET /StorageLocationMasterSet                   ↓
?$filter=PlantId eq '1000'                 Parse filter
                                                ↓
                                           DPC_EXT Method
                                           storagelocationm_get_entityset
                                                ↓
                                           Parse filter
                                           lr_plant = [{ SIGN='I', OPTION='EQ', LOW='1000' }]
                                                ↓
                                           Query database
                                           SELECT werks, lgort, lgobe
                                           FROM t001l
                                           WHERE werks = '1000'
                                                ↓
                                           Return table
                                           [{ PlantId: "1000", 
                                              StorageLocationId: "0001",
                                              StorageLocationName: "Main" },
                                            { PlantId: "1000",
                                              StorageLocationId: "0002",
                                              StorageLocationName: "Spare" }]
                                                ↓
                                           SAP Gateway
                                           Convert → JSON
                                                ↓
HTTP 200 OK                            →    OData Model
Body: JSON array                                ↓
                                           ComboBox update items
                                                ↓
                                           User chọn Storage Location
```

### 5.5. Error Handling Flow

```
FRONTEND                                    BACKEND
────────                                    ───────

User click Save
    ↓
Controller validate
    ↓
Service.createMaterial()
    ↓
OData Model
    ↓
HTTP POST                              →    SAP Gateway
                                                ↓
                                           DPC_EXT Method
                                                ↓
                                           Validate
                                           ERROR: Plant not found
                                                ↓
                                           _raise_busi_error()
                                           - Add message to container
                                           - Throw exception
                                                ↓
                                           SAP Gateway catch exception
                                                ↓
HTTP 400 Bad Request                   →    OData Model
Body: JSON                                      ↓
{ "error": {                               Parse error
    "message": {                                ↓
      "value": "Plant 9999 not found"      Service
    }                                      reject(oError)
  }                                             ↓
}                                          Controller.catch()
                                                ↓
                                           Error handling
                                           - Parse error message
                                           - Show MessageBox.error()
                                           - Keep dialog open
                                                ↓
                                           User sees error
                                           "Plant 9999 not found"
```

---

## PHẦN 6: TỔNG KẾT

### 6.1. Các điểm quan trọng

**1. Data Binding**
- View bind đến Model (OData hoặc JSON)
- Two-way binding: User input ↔ Model
- Automatic update: Model thay đổi → View update

**2. Event Handling**
- View trigger events → Controller xử lý
- Controller không trực tiếp update View
- Controller update Model → View tự động update

**3. Service Layer**
- Centralize API calls
- Reusable across controllers
- Promise-based (async)

**4. Structure**
- Contract giữa Frontend và Backend
- Type-safe
- Tự động convert JSON ↔ Structure

**5. BAPI**
- SAP standard API
- Đảm bảo data consistency
- Tự động update nhiều tables

### 6.2. Luồng dữ liệu tổng quát

```
USER INPUT
    ↓
VIEW (display)
    ↓
MODEL (store)
    ↓
CONTROLLER (validate)
    ↓
SERVICE (wrap API)
    ↓
ODATA MODEL (HTTP)
    ↓
SAP GATEWAY (parse)
    ↓
STRUCTURE (contract)
    ↓
DPC_EXT METHOD (logic)
    ↓
BAPI (standard API)
    ↓
SAP TABLES (database)
    ↓
BAPI (return)
    ↓
DPC_EXT METHOD (return)
    ↓
STRUCTURE (contract)
    ↓
SAP GATEWAY (convert)
    ↓
ODATA MODEL (parse)
    ↓
SERVICE (promise)
    ↓
CONTROLLER (update)
    ↓
MODEL (store)
    ↓
VIEW (display)
    ↓
USER SEES RESULT
```

### 6.3. Các thành phần không gọi trực tiếp nhau

**View KHÔNG gọi trực tiếp**:
- ❌ Service
- ❌ OData Model (trừ binding)
- ❌ Backend

**Controller KHÔNG gọi trực tiếp**:
- ❌ Backend
- ❌ BAPI
- ❌ SAP Tables

**Service KHÔNG gọi trực tiếp**:
- ❌ Backend (qua OData Model)
- ❌ View

**Backend KHÔNG gọi trực tiếp**:
- ❌ Frontend
- ❌ View
- ❌ Controller

### 6.4. Các thành phần gọi trực tiếp nhau

**View → Controller**: Events
**Controller → Service**: Method calls
**Service → OData Model**: create(), read(), update()
**OData Model → Backend**: HTTP requests
**Backend → BAPI**: CALL FUNCTION
**BAPI → SAP Tables**: INSERT, UPDATE, SELECT

**Ngược lại (Response)**:
**SAP Tables → BAPI**: Return data
**BAPI → Backend**: Return result
**Backend → OData Model**: HTTP response
**OData Model → Service**: Callback
**Service → Controller**: Promise resolve/reject
**Controller → View**: Update Model (View tự động update)

---

## KẾT LUẬN

Bạn đã hiểu:
✅ Vai trò từng thành phần Frontend và Backend
✅ Cách chúng gọi nhau (ai gọi ai, khi nào, tại sao)
✅ Flow 5 chức năng chính từ đầu đến cuối
✅ Data flow: Request và Response
✅ Error handling flow
✅ Cascade ComboBox flow
✅ Các thành phần KHÔNG gọi trực tiếp nhau

**Nguyên tắc chính**:
- Frontend và Backend giao tiếp qua HTTP (OData)
- Structure là contract giữa 2 bên
- View không có logic, chỉ hiển thị
- Controller xử lý logic, không trực tiếp gọi Backend
- Service là layer trung gian
- BAPI đảm bảo data consistency
- Mọi thay đổi đều qua Model → View tự động update

