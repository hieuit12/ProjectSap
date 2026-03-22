# TÓM TẮT DỰ ÁN - SMART WAREHOUSE

## 1. KIẾN TRÚC TỔNG QUAN

```
USER (Người dùng)
    ↓
FRONTEND (SAP UI5 - JavaScript/XML)
    ↓
BACKEND (SAP ABAP - OData Service)
    ↓
DATABASE (SAP Tables)
```

---

## 2. FRONTEND - CÁC THÀNH PHẦN

### View (XML)
- **Làm gì**: Hiển thị giao diện (Table, Button, Input, ComboBox...)
- **Gọi ai**: Controller (qua events như press, change)
- **Ví dụ**: MaterialList.view.xml hiển thị danh sách vật tư

### Controller (JavaScript)
- **Làm gì**: Xử lý logic (validate, gọi API, update UI)
- **Gọi ai**: Service (để gọi Backend)
- **Ví dụ**: MaterialList.controller.js xử lý khi user click "Create Material"

### Fragment (XML)
- **Làm gì**: Dialog/Popup tái sử dụng
- **Gọi ai**: Dùng Controller của View cha
- **Ví dụ**: MaterialCreateDialog.fragment.xml là popup tạo vật tư

### Model
- **OData Model**: Kết nối Backend, tự động sync dữ liệu
- **JSON Model**: Lưu dữ liệu local (form data, UI state)
- **i18n Model**: Text đa ngôn ngữ

### Service (JavaScript)
- **Làm gì**: Wrapper gọi Backend API
- **Gọi ai**: OData Model
- **Ví dụ**: MaterialService.createMaterial() gọi POST /MaterialSet

### Formatter (JavaScript)
- **Làm gì**: Format hiển thị (số, ngày, màu sắc)
- **Ví dụ**: 100 → "100.000", 561 → "Init. Stock", quantity → màu đỏ/vàng/xanh

---

## 3. BACKEND - CÁC THÀNH PHẦN

### Structure
- **Làm gì**: Định nghĩa format dữ liệu (contract giữa FE và BE)
- **Ví dụ**: zst_wh_material có MaterialId, MaterialName, Plant...

### DPC_EXT Class
- **Làm gì**: Class chứa 15 methods xử lý CRUD
- **Gọi ai**: BAPI, SAP Tables

### Methods (15 methods)
**5 Entity Sets chính**:
1. **materialset_create_entity**: Tạo vật tư → Gọi BAPI_MATERIAL_SAVEDATA
2. **materialset_get_entityset**: Lấy danh sách vật tư → Query MARD + MARA + MBEW
3. **goodsreceiptset_create_entity**: Nhập kho → Gọi BAPI_GOODSMVT_CREATE (Movement Type 561)
4. **stockset_update_entity**: Điều chỉnh tồn kho → Gọi BAPI_GOODSMVT_CREATE (561/562)
5. **historyset_get_entityset**: Lấy lịch sử → Query MKPF + MSEG

**5 Master Data**:
- plantmasterset_get_entityset → Query T001W
- storagelocationm_get_entityset → Query T001L
- materialtypemast_get_entityset → Query T134T
- baseunitmasteset_get_entityset → Query T006A
- valuationclassma_get_entityset → Query T025T

### BAPI
- **BAPI_MATERIAL_SAVEDATA**: Tạo/update material → Insert MARA, MARC, MARD, MBEW, MAKT
- **BAPI_GOODSMVT_CREATE**: Tạo goods movement → Insert MKPF, MSEG, update MARD

### SAP Tables
- **MARA**: Material master (Material Type, Base Unit)
- **MARC**: Material plant data
- **MARD**: Storage location stock (Quantity)
- **MBEW**: Material valuation (Valuation Class)
- **MAKT**: Material description
- **MKPF**: Material document header
- **MSEG**: Material document item
- **T001W**: Plants
- **T001L**: Storage locations

---

## 4. FLOW 5 CHỨC NĂNG CHÍNH

### 4.1. CREATE MATERIAL (Tạo Vật Tư)

**Frontend**:
1. User click "Create Material" → Controller mở Dialog
2. User nhập data → Two-way binding update FormModel
3. User chọn Plant → Controller filter Storage Location ComboBox
4. User click "Save" → Controller validate → Gọi MaterialService
5. Service gọi oModel.create("/MaterialSet")

**Backend**:
1. SAP Gateway parse JSON → Structure zst_wh_material
2. Method materialset_create_entity validate (Plant, SLoc, Valuation Class, duplicate)
3. Chuẩn bị data cho BAPI (Header, Client data, Plant data, Valuation data, SLoc data, Description)
4. Gọi BAPI_MATERIAL_SAVEDATA → Insert MARA, MARC, MARD, MBEW, MAKT
5. Commit → Return Structure → SAP Gateway convert JSON

**Response**: Frontend nhận response → Show success → Close dialog → Refresh table

---

### 4.2. GOODS RECEIPT (Nhập Kho)

**Frontend**:
1. User click "Goods Receipt" → Controller mở Dialog với Material info pre-filled
2. User nhập Quantity → Validate > 0
3. User click "Confirm" → Gọi GoodsReceiptService

**Backend**:
1. Method goodsreceiptset_create_entity validate Quantity > 0
2. Parse dates (PostingDate, DocumentDate)
3. Chuẩn bị BAPI data (GM Code = '01', Movement Type = 561)
4. Gọi BAPI_GOODSMVT_CREATE → Tạo Material Document (MKPF + MSEG) + Update MARD (tăng quantity)
5. Return Material Document Number

**Response**: Frontend nhận Document Number → Show success → Refresh stock

**Lưu ý**: CHỈ cho phép Quantity > 0, Movement Type cố định = 561

---

### 4.3. UPDATE STOCK (Điều Chỉnh Tồn Kho)

**Frontend**:
1. User nhập New Quantity → Validate >= 0
2. Gọi StockService.updateStock()

**Backend**:
1. Method stockset_update_entity query Old Quantity từ MARD
2. Tính Diff = New - Old
3. Nếu Diff > 0 → Movement Type = 561 (tăng)
4. Nếu Diff < 0 → Movement Type = 562 (giảm)
5. Nếu Diff = 0 → Return luôn
6. Gọi BAPI_GOODSMVT_CREATE (GM Code = '04') → Update MARD
7. Query lại MARD → Return updated quantity

**Response**: Frontend nhận updated quantity → Refresh display

**Logic đặc biệt**: Frontend gửi NEW quantity, Backend tự tính DIFF và chọn Movement Type

---

### 4.4. VIEW HISTORY (Xem Lịch Sử)

**Frontend**:
1. Table bind to /HistorySet → SAP UI5 tự động gọi GET
2. User filter (MaterialId, MovementType, Date) → Controller apply filters

**Backend**:
1. Method historyset_get_entityset parse filters
2. Query MKPF (header) JOIN MSEG (item) với filters
3. ORDER BY date DESCENDING (mới nhất trước)
4. Apply pagination ($top, $skip)
5. Return list

**Response**: Table hiển thị history với formatter (+ 100.000, - 50.000, màu xanh/đỏ)

---

### 4.5. DASHBOARD KPI (Thống Kê)

**Frontend**:
1. 4 KPI Tiles bind to /DashboardKPISet('1')
2. Low Stock Alert table bind to /StockSet?$filter=Quantity le 10
3. Recent History table bind to /HistorySet?$top=10

**Backend**:
1. Method dashboardkpiset_get_entity tính 4 KPIs:
   - Total Materials: COUNT(DISTINCT matnr) FROM mard
   - Total Stock: SUM(labst) FROM mard
   - Low Stock Count: COUNT(DISTINCT matnr) FROM mard WHERE labst <= 10
   - Total Plants: COUNT(DISTINCT werks) FROM t001w
2. Return 1 record với 4 KPIs

**Response**: Tiles hiển thị số liệu, tables hiển thị low stock và recent history

---

## 5. CÁCH CHÚNG GỌI NHAU

### Frontend Flow
```
User → View → Controller → Service → OData Model → HTTP Request
```

### Backend Flow
```
HTTP Request → SAP Gateway → Structure → Method → BAPI → SAP Tables
```

### Response Flow
```
SAP Tables → BAPI → Method → Structure → SAP Gateway → HTTP Response → OData Model → Service → Controller → View → User
```

### Ai gọi ai?
- **View** gọi **Controller** (qua events)
- **Controller** gọi **Service** (method calls)
- **Service** gọi **OData Model** (create, read, update)
- **OData Model** gọi **Backend** (HTTP)
- **Backend Method** gọi **BAPI** (CALL FUNCTION)
- **BAPI** gọi **SAP Tables** (INSERT, UPDATE, SELECT)

### Ai KHÔNG gọi ai?
- View KHÔNG gọi Service, Backend
- Controller KHÔNG gọi Backend trực tiếp
- Service KHÔNG gọi Backend trực tiếp (qua OData Model)

---

## 6. ĐIỂM QUAN TRỌNG

### Structure là gì?
- Contract giữa Frontend và Backend
- Frontend gửi JSON → Backend parse thành Structure
- Backend trả Structure → SAP Gateway convert thành JSON
- Type-safe, đảm bảo Frontend và Backend hiểu nhau

### Movement Type
- **561**: Initial Stock (tăng tồn kho) - Dùng cho Goods Receipt và Update Stock (tăng)
- **562**: Initial Stock Reverse (giảm tồn kho) - Dùng cho Update Stock (giảm)

### Validation
- **Goods Receipt**: Quantity phải > 0 (KHÔNG cho phép = 0 hoặc < 0)
- **Update Stock**: Quantity phải >= 0 (cho phép = 0, không cho phép < 0)

### Cascade ComboBox
- User chọn Plant → Controller filter Storage Location theo Plant
- User chọn Material Type → Controller filter Valuation Class theo Type

### Two-way Binding
- User nhập Input → FormModel tự động update
- Controller set FormModel → Input tự động update

---

## KẾT LUẬN

**Dự án này làm gì?**
- Quản lý kho: Tạo vật tư, nhập kho, điều chỉnh tồn kho, xem lịch sử, thống kê

**Frontend làm gì?**
- Hiển thị giao diện, validate input, gọi Backend API, hiển thị kết quả

**Backend làm gì?**
- Nhận request, validate, gọi BAPI, insert/update SAP tables, trả về response

**Structure làm gì?**
- Định nghĩa format dữ liệu, đảm bảo Frontend và Backend hiểu nhau

**BAPI làm gì?**
- SAP standard API, đảm bảo data consistency, tự động update nhiều tables

**Flow tổng quát**:
User input → View → Controller → Service → OData Model → Backend → BAPI → Tables → Response → View → User sees result
