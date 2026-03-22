# TÓM TẮT BACKEND - SAP ABAP

## 1. STRUCTURE - ĐỊNH NGHĨA DỮ LIỆU

### Tại sao cần Structure?
- Là contract giữa Frontend và Backend
- Frontend gửi JSON → Backend parse thành Structure
- Backend trả Structure → SAP Gateway convert thành JSON
- Đảm bảo Frontend và Backend hiểu nhau

### 10 Structures trong dự án

**1. zst_wh_material** - Vật tư
- Chứa: MaterialId, MaterialName, MaterialType, BaseUnit, Plant, StorageLocation, ValuationClass
- Dùng cho: Create Material, Get Material

**2. zst_wh_gr_req** - Goods Receipt Request
- Chứa: MaterialId, Plant, SLoc, Quantity, PostingDate, DocumentDate, Remark, MaterialDocument, Status, Message
- Dùng cho: Goods Receipt (nhập kho)

**3. zst_wh_stock** - Tồn kho
- Chứa: MaterialId, Plant, SLoc, Quantity, BaseUnit, MaterialName
- Dùng cho: Get Stock, Update Stock

**4. zst_wh_history** - Lịch sử
- Chứa: MaterialDocument, Year, PostingDate, MaterialId, MovementType, Quantity, Plant, SLoc, Remark
- Dùng cho: Get History

**5. zst_wh_kpi** - Dashboard KPI
- Chứa: Id, TotalMaterials, TotalStock, LowStockCount, TotalPlants
- Dùng cho: Dashboard statistics

**6-10. Master Data Structures**
- zst_wh_plant: PlantId, PlantName
- zst_wh_sloc: PlantId, StorageLocationId, StorageLocationName
- zst_wh_mat_type: MaterialType, Description
- zst_wh_base_unit: Unit, Description
- zst_wh_val_class: ValuationClass, Description, MaterialType

---

## 2. CLASS VÀ METHODS

### Class: zcl_zgw_wh_odata_dpc_ext
- Kế thừa từ DPC (auto-generated)
- Chứa 15 methods xử lý CRUD

### 5 Helper Methods (Private)

**1. _raise_busi_error**
- Làm gì: Throw exception với error message
- Khi nào dùng: Mọi validation lỗi

**2. _to_dats**
- Làm gì: Convert date string → DATS format (YYYYMMDD)
- Ví dụ: "2026-03-20" → "20260320"

**3. _validate_plant_sloc**
- Làm gì: Check Plant và Storage Location hợp lệ
- Query: T001W (Plants), T001L (Storage Locations)

**4. _ensure_material_extended**
- Làm gì: Check Material có MARC và MARD chưa, nếu chưa thì tự động tạo
- Gọi: BAPI_MATERIAL_SAVEDATA

**5. _append_bapiret2**
- Làm gì: Add BAPI error messages vào OData message container

---

## 3. MATERIAL METHODS

### materialset_create_entity - Tạo vật tư
**Làm gì**:
1. Parse JSON → Structure zst_wh_material
2. Validate: Plant, SLoc, Valuation Class, duplicate
3. Chuẩn hóa Material ID (leading zeros)
4. Chuẩn bị data cho BAPI
5. Gọi BAPI_MATERIAL_SAVEDATA
6. BAPI insert vào: MARA, MARC, MARD, MBEW, MAKT
7. Commit → Return Structure

**Input**: MaterialId, MaterialName, MaterialType, BaseUnit, Plant, SLoc, ValuationClass
**Output**: Created material data
**BAPI**: BAPI_MATERIAL_SAVEDATA

---

### materialset_get_entityset - Lấy danh sách vật tư
**Làm gì**:
1. Parse filters (MaterialId, Plant, SLoc)
2. Query: MARD JOIN MARA JOIN MBEW JOIN MAKT
3. Apply pagination ($top, $skip)
4. Return list

**Query**: SELECT từ MARD + MARA + MBEW + MAKT
**Output**: Array of materials

---

### materialset_get_entity - Lấy 1 vật tư
**Làm gì**:
1. Parse key (MaterialId)
2. Query: MARD JOIN MARA JOIN MBEW JOIN MAKT WHERE matnr = key
3. Return 1 record

**Input**: MaterialId (key)
**Output**: 1 material

---

## 4. STOCK METHODS

### stockset_get_entityset - Lấy danh sách tồn kho
**Làm gì**:
1. Parse filters
2. Query: MARD JOIN MARA JOIN MAKT
3. Return list với Quantity

**Query**: SELECT matnr, werks, lgort, labst (quantity) FROM MARD
**Output**: Array of stock records

---

### stockset_get_entity - Lấy 1 stock record
**Làm gì**:
1. Parse keys (MaterialId, Plant, SLoc)
2. Query MARD với 3 keys
3. Return 1 record

**Input**: MaterialId + Plant + SLoc (composite key)
**Output**: 1 stock record

---

### stockset_update_entity - Điều chỉnh tồn kho
**Làm gì**:
1. Parse keys và new quantity
2. Validate: Quantity >= 0
3. Query old quantity từ MARD
4. Tính Diff = New - Old
5. Nếu Diff > 0 → Movement Type = 561 (tăng)
6. Nếu Diff < 0 → Movement Type = 562 (giảm)
7. Nếu Diff = 0 → Return (không làm gì)
8. Gọi BAPI_GOODSMVT_CREATE (GM Code = '04')
9. BAPI update MARD
10. Query lại MARD → Return updated quantity

**Input**: MaterialId, Plant, SLoc, New Quantity
**Logic đặc biệt**: Frontend gửi NEW quantity, Backend tự tính DIFF và chọn Movement Type
**BAPI**: BAPI_GOODSMVT_CREATE
**Movement Type**: 561 (tăng) hoặc 562 (giảm)

---

## 5. GOODS RECEIPT METHOD

### goodsreceiptset_create_entity - Nhập kho
**Làm gì**:
1. Parse JSON → Structure zst_wh_gr_req
2. Validate: Quantity > 0 (CHỈ cho phép > 0, KHÔNG cho phép = 0 hoặc < 0)
3. Validate: Plant, SLoc
4. Ensure Material extended (MARC, MARD)
5. Parse dates (PostingDate, DocumentDate)
6. Chuẩn bị BAPI data (GM Code = '01', Movement Type = 561)
7. Gọi BAPI_GOODSMVT_CREATE
8. BAPI tạo Material Document (MKPF + MSEG) + Update MARD (tăng quantity)
9. Return Material Document Number

**Input**: MaterialId, Plant, SLoc, Quantity, PostingDate, Remark
**Validation**: Quantity phải > 0
**BAPI**: BAPI_GOODSMVT_CREATE
**Movement Type**: 561 (cố định)
**Output**: MaterialDocument, Status, Message

---

## 6. HISTORY METHOD

### historyset_get_entityset - Lấy lịch sử nhập xuất
**Làm gì**:
1. Parse filters (MaterialId, MovementType, PostingDate...)
2. Query: MKPF (header) JOIN MSEG (item)
3. ORDER BY PostingDate DESCENDING (mới nhất trước)
4. Apply pagination
5. Return list

**Query**: SELECT từ MKPF + MSEG
**Filters**: MaterialDocument, Year, MaterialId, MovementType, Plant, SLoc, PostingDate
**Output**: Array of history records

---

## 7. DASHBOARD METHOD

### dashboardkpiset_get_entity - Tính KPI
**Làm gì**:
1. Tính 4 KPIs:
   - Total Materials: COUNT(DISTINCT matnr) FROM mard
   - Total Stock: SUM(labst) FROM mard
   - Low Stock Count: COUNT(DISTINCT matnr) FROM mard WHERE labst <= 10
   - Total Plants: COUNT(DISTINCT werks) FROM t001w
2. Return 1 record với 4 KPIs

**Input**: Id = '1' (luôn là '1')
**Output**: 1 record với 4 KPIs
**Real-time**: Tính mỗi lần gọi, không cache

---

## 8. MASTER DATA METHODS (5 methods)

### plantmasterset_get_entityset
- Query: SELECT werks, name1 FROM t001w
- Return: Danh sách Plants

### storagelocationm_get_entityset
- Query: SELECT werks, lgort, lgobe FROM t001l
- Filter: Theo PlantId (nếu có)
- Return: Danh sách Storage Locations

### materialtypemast_get_entityset
- Query: SELECT mtart, mtbez FROM t134t WHERE spras = sy-langu
- Return: Danh sách Material Types

### baseunitmasteset_get_entityset
- Query: SELECT msehi, msehl FROM t006a WHERE spras = sy-langu
- Return: Danh sách Units of Measure

### valuationclassma_get_entityset
- Query: SELECT bklas, bkbez, mtart FROM t025t WHERE spras = sy-langu
- Filter: Theo MaterialType (nếu có)
- Return: Danh sách Valuation Classes

---

## 9. BAPI SỬ DỤNG

### BAPI_MATERIAL_SAVEDATA
- Dùng cho: Create Material, Ensure Material Extended
- Làm gì: Insert/Update MARA, MARC, MARD, MBEW, MAKT
- Input: Header, Client data, Plant data, Valuation data, SLoc data, Description

### BAPI_GOODSMVT_CREATE
- Dùng cho: Goods Receipt, Update Stock
- Làm gì: Tạo Material Document (MKPF + MSEG), Update MARD
- Input: Header, GM Code, Item (Material, Plant, SLoc, Movement Type, Quantity)
- Output: Material Document Number

---

## 10. SAP TABLES

**Material Master**:
- MARA: Material master (Material Type, Base Unit)
- MARC: Material plant data
- MARD: Storage location stock (Quantity)
- MBEW: Material valuation (Valuation Class)
- MAKT: Material description

**Material Document**:
- MKPF: Material document header (Document Number, Posting Date)
- MSEG: Material document item (Material, Movement Type, Quantity)

**Master Data**:
- T001W: Plants
- T001L: Storage locations
- T134T: Material types
- T006A: Units of measure
- T025T: Valuation classes

---

## 11. MOVEMENT TYPES

### Tại sao dùng 561 và 562?

**Lý do**: Dự án chỉ yêu cầu quản lý tồn kho cơ bản, KHÔNG yêu cầu Purchase Order (PO)

**Movement Types khác (KHÔNG dùng vì dự án không yêu cầu)**:
- 101: Goods Receipt with PO (phải có Purchase Order)
- 501: Goods Receipt without PO (phức tạp hơn 561)
- 102, 201, 502: Các loại xuất kho khác

**Movement Types dự án dùng**:

**561 - Initial Stock (Tồn kho đầu kỳ - Tăng)**
- Dùng cho: Goods Receipt, Update Stock (tăng)
- Ý nghĩa: Nhập kho đầu kỳ / Điều chỉnh tăng tồn kho
- Đơn giản nhất, không cần PO
- Đủ cho yêu cầu dự án

**562 - Initial Stock Reverse (Tồn kho đầu kỳ - Giảm)**
- Dùng cho: Update Stock (giảm)
- Ý nghĩa: Điều chỉnh giảm tồn kho
- Reverse của 561

**Kết luận**: Dự án chỉ cần quản lý tồn kho đơn giản → Dùng 561/562 là đủ, không cần PO

---

## 12. VALIDATION RULES

**Create Material**:
- Plant và SLoc phải hợp lệ (tồn tại trong T001W, T001L)
- Valuation Class bắt buộc
- Không được duplicate (MaterialId + Plant + SLoc)

**Goods Receipt**:
- Quantity phải > 0 (KHÔNG cho phép = 0 hoặc < 0)
- Plant và SLoc phải hợp lệ
- Material phải có MARC và MARD

**Update Stock**:
- Quantity phải >= 0 (cho phép = 0, không cho phép < 0)
- Material phải có MARC và MARD

---

## KẾT LUẬN

**Backend làm gì?**
- Nhận request từ Frontend (JSON)
- Parse JSON → Structure
- Validate dữ liệu
- Gọi BAPI hoặc Query database
- Return Structure → SAP Gateway convert JSON

**15 Methods chia thành**:
- 3 Material methods (create, get list, get single)
- 3 Stock methods (get list, get single, update)
- 1 Goods Receipt method (create)
- 1 History method (get list)
- 2 Dashboard methods (get KPI)
- 5 Master Data methods (get lists)

**2 BAPIs chính**:
- BAPI_MATERIAL_SAVEDATA: Tạo/update material
- BAPI_GOODSMVT_CREATE: Tạo goods movement, update stock

**Movement Types**:
- 561: Tăng tồn kho (Goods Receipt, Update Stock tăng)
- 562: Giảm tồn kho (Update Stock giảm)


---

## 13. TẠI SAO CHỌN MỘT SỐ BASE UNIT THÌ BỊ LỖI?

### Vấn đề
Khi tạo vật tư, nếu chọn một số Base Unit có sẵn trong ComboBox thì:
- ❌ Không tạo được vật tư (BAPI báo lỗi)
- ❌ Tạo được nhưng không GR (Goods Receipt) được
- ❌ Tạo được nhưng không Update Stock được

### Lý do 1: Base Unit không tương thích với Material Type
**Ví dụ**:
- Material Type = "ROH" (Raw Material)
- Chọn Base Unit = "ST" (Set) hoặc "PAL" (Pallet)
- BAPI báo lỗi: "Unit ST is not allowed for material type ROH"

**Giải thích**:
- SAP có rule: Mỗi Material Type chỉ cho phép một số Base Unit nhất định
- ROH (nguyên liệu) thường dùng: KG, L, M, EA
- FERT (thành phẩm) thường dùng: EA, PC, ST
- Nếu chọn sai → BAPI reject

### Lý do 2: Base Unit không có Dimension (ISO Code)
**Ví dụ**:
- Chọn Base Unit = "AU" (Arbitrary Unit - đơn vị tùy ý)
- Tạo vật tư thành công
- Nhưng GR hoặc Update Stock bị lỗi: "Unit AU has no dimension"

**Giải thích**:
- Một số Base Unit trong T006A không có ISO code hoặc dimension
- BAPI_GOODSMVT_CREATE yêu cầu Unit phải có dimension
- Nếu không có → BAPI reject khi GR/Update

### Lý do 3: Base Unit bị restrict bởi Valuation Class
**Ví dụ**:
- Material Type = "ROH", Valuation Class = "3000"
- Valuation Class "3000" chỉ cho phép Base Unit = KG, L
- Chọn Base Unit = "EA" → BAPI báo lỗi

**Giải thích**:
- Valuation Class (dùng cho accounting) có thể restrict Base Unit
- Đây là config của nhà máy/công ty
- Phải chọn Unit được phép

### Lý do 4: Base Unit không được maintain đầy đủ
**Ví dụ**:
- Chọn Base Unit = "DL21" (có trong T006A)
- BAPI báo lỗi: "Unit DL21 is not maintained"

**Giải thích**:
- Base Unit có trong table nhưng chưa được config đầy đủ
- Thiếu text description, thiếu conversion, thiếu dimension
- Phải nhờ Admin maintain đầy đủ

### Base Units AN TOÀN (Luôn dùng được)

**Đơn vị phổ biến nhất**:
- **EA** (Each) - Cái, chiếc
- **PC** (Piece) - Miếng, mảnh
- **KG** (Kilogram) - Kilogram
- **L** (Liter) - Lít
- **M** (Meter) - Mét

**Tại sao an toàn?**:
- Có đầy đủ ISO code và dimension
- Được SAP maintain chuẩn
- Tương thích với hầu hết Material Type
- BAPI luôn accept

### Cách kiểm tra Base Unit có dùng được không

**Bước 1**: Kiểm tra trong T006A
- Base Unit phải có text description (MSEHL)
- Phải có ISO code (ISOCODE)
- Phải có dimension (DIMID)

**Bước 2**: Kiểm tra với Material Type
- ROH → Dùng KG, L, M, EA
- FERT → Dùng EA, PC
- HAWA → Dùng EA, PC

**Bước 3**: Test tạo vật tư
- Nếu BAPI báo lỗi về Unit → Đổi Unit khác
- Nếu tạo được nhưng GR lỗi → Unit không có dimension

### Giải pháp

**Giải pháp 1**: Dùng Base Unit an toàn
- Luôn dùng EA, PC, KG, L, M
- Đảm bảo không bị lỗi

**Giải pháp 2**: Kiểm tra trước khi tạo
- Frontend có thể filter ComboBox chỉ hiển thị Units an toàn
- Hoặc thêm validation check Unit có hợp lệ không

**Giải pháp 3**: Liên hệ Admin
- Nếu cần dùng Unit đặc biệt (DL21, AU...)
- Nhờ Admin maintain đầy đủ trong SAP

### Kết luận
- Không phải tất cả Base Unit trong T006A đều dùng được
- Một số Unit bị restrict bởi Material Type, Valuation Class
- Một số Unit không có dimension → Không GR/Update được
- **Khuyến nghị**: Luôn dùng EA, PC, KG, L, M (an toàn nhất)
- Đây là **SAP standard behavior**, không phải lỗi code
