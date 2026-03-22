# TRẢ LỜI CÂU HỎI CÔ GIÁO

## 3.1. Về phạm vi đề tài

### Câu 1: "Cập nhật số lượng tồn kho" là cập nhật trực tiếp tồn hay thực chất chỉ được phép qua nghiệp vụ nhập kho?

**Trả lời**: Cập nhật TRỰC TIẾP tồn kho, KHÔNG qua nghiệp vụ nhập kho

**Giải thích**:
- Có 2 chức năng riêng biệt:
  1. **Goods Receipt** (Nhập kho): Dùng Movement Type 561, tạo Material Document
  2. **Update Stock** (Điều chỉnh tồn kho): Dùng Movement Type 561/562, cập nhật trực tiếp

**Cách hoạt động Update Stock**:
- Frontend gửi NEW quantity (ví dụ: 150)
- Backend query OLD quantity từ MARD (ví dụ: 100)
- Backend tính DIFF = 150 - 100 = +50
- Backend tự động chọn Movement Type:
  - Nếu DIFF > 0 → Movement Type 561 (tăng)
  - Nếu DIFF < 0 → Movement Type 562 (giảm)
- Gọi BAPI_GOODSMVT_CREATE với GM Code '05' (Transfer Posting)
- BAPI update MARD trực tiếp

**Khác biệt với Goods Receipt**:
- Goods Receipt: User nhập quantity muốn nhập → Tăng tồn kho
- Update Stock: User nhập quantity mới mong muốn → Backend tự tính và điều chỉnh

---

### Câu 2: Dashboard KPI và chart hiện là yêu cầu chính thức hay chỉ là phần enhancement để báo cáo đẹp?

**Trả lời**: Là yêu cầu CHÍNH THỨC của dự án

**Bằng chứng trong code**:
- Có 2 methods riêng: `dashboardkpiset_get_entity` và `dashboardkpiset_get_entityset`
- Có Structure riêng: `zst_wh_kpi`
- Tính 4 KPIs:
  1. Total Materials: Tổng số vật tư
  2. Total Stock: Tổng tồn kho
  3. Low Stock Count: Số vật tư có tồn kho <= 10
  4. Total Plants: Tổng số nhà máy

**Mục đích**:
- Cung cấp overview nhanh về tình trạng kho
- Cảnh báo vật tư sắp hết (Low Stock Alert)
- Hiển thị Recent History (10 giao dịch gần nhất)

---

### Câu 3: Export Excel ở Stock/History đã code xong hoàn chỉnh chưa, hay mới mô tả trong báo cáo?

**Trả lời**: ĐÃ CODE XONG và hoạt động

**Bằng chứng trong Frontend**:

**1. StockList có Export Excel**:
- File: `webapp/controller/StockList.controller.js`
- Method: `onExportExcel()`
- Button: `<Button text="Export Excel" icon="sap-icon://excel-attachment" press="onExportExcel" />`

**2. GoodsReceiptHistory có Export Excel**:
- File: `webapp/controller/GoodsReceiptHistory.controller.js`
- Method: `onExportExcel()`
- Button: `<Button text="Export Excel" icon="sap-icon://excel-attachment" press="onExportExcel" />`

**Cách hoạt động**:
1. User click button "Export Excel"
2. Controller lấy data từ Table binding (tối đa 9999 records)
3. Map data thành array objects
4. Dùng SAP UI5 library `sap.ui.export.Spreadsheet`
5. Generate file Excel (.xlsx)
6. Download file với tên: `StockList_2026-03-22.xlsx` hoặc `History_2026-03-22.xlsx`
7. Show message "Xuất Excel thành công!"

**Columns trong Excel**:

**StockList.xlsx**:
- Material ID, Material Name, Plant, Storage Location, Quantity, Base Unit

**History.xlsx**:
- Material Doc, Year, Posting Date, Document Date, Material ID, Material Name, Plant, Storage Loc, Mvt Type, Quantity, Unit, Status, Remark

**Lưu ý**: Export ở Frontend (client-side), KHÔNG cần Backend xử lý

---

### Câu 4: Có chức năng "xem chi tiết vật tư" riêng biệt không, hay chỉ là dialog/detail panel?

**Trả lời**: Có màn hình CHI TIẾT riêng biệt (MaterialDetail)

**Bằng chứng**:
- Có method `materialset_get_entity` (lấy 1 vật tư)
- Frontend có navigation: `this.getRouter().navTo("MaterialDetail", { MaterialId: sMaterialId })`
- Có view riêng: `MaterialDetail.view.xml`

**Cách hoạt động**:
- User click vào 1 dòng trong Material List
- Navigate đến MaterialDetail với MaterialId
- MaterialDetail gọi GET /MaterialSet('TEST001')
- Hiển thị thông tin chi tiết vật tư

---

## 3.2. Về nghiệp vụ SAP

### Câu 5: Khi tạo material bằng POST /MaterialSet, backend đang tạo ở mức MARA hay đồng thời MARC/MARD luôn?

**Trả lời**: Tạo ĐỒNG THỜI MARA, MARC, MARD, MBEW, MAKT

**Bằng chứng trong code**:
```
ls_head-basic_view   = 'X'.  → MARA
ls_head-storage_view = 'X'.  → MARC, MARD
ls_head-account_view = 'X'.  → MBEW

CALL FUNCTION 'BAPI_MATERIAL_SAVEDATA'
  EXPORTING
    headdata             = ls_head
    clientdata           = ls_dat      → MARA
    plantdata            = ls_marc     → MARC
    storagelocationdata  = ls_mard     → MARD
    valuationdata        = ls_mbew     → MBEW
  TABLES
    materialdescription  = lt_desc     → MAKT
```

**Giải thích**:
- MARA: Material master (Material Type, Base Unit)
- MARC: Material plant data (Plant)
- MARD: Storage location stock (Plant + SLoc, Quantity = 0 ban đầu)
- MBEW: Material valuation (Valuation Class, Price Control)
- MAKT: Material description (Material Name)

---

### Câu 6: GoodsReceiptSet đang tương ứng movement type nào trong SAP? 101 hay custom?

**Trả lời**: Movement Type **561** (Initial Stock), KHÔNG phải 101

**Bằng chứng trong code**:
```
ls_itm-move_type = '561'.
ls_code-gm_code = '05'.
```

**Giải thích**:
- **561**: Initial Stock (Tồn kho đầu kỳ) - Tăng tồn kho
- **101**: Goods Receipt with PO (Nhập kho có Purchase Order)

**Tại sao dùng 561 thay vì 101?**:
- Dự án KHÔNG yêu cầu Purchase Order (PO)
- 561 đơn giản hơn, không cần PO Number, Vendor...
- Phù hợp cho quản lý kho cơ bản

---

### Câu 7: Sau Goods Receipt, hệ thống có cho nhập các field bắt buộc khác như Movement Type, Header Text, Reference Document không?

**Trả lời**: 
- **Movement Type**: KHÔNG cho nhập, cố định = 561
- **Header Text**: CÓ, là field "Remark" (ghi chú)
- **Reference Document**: KHÔNG có

**Bằng chứng trong code**:
```
ls_head-header_txt = ls_req-remark.  → Header Text từ Remark
ls_itm-move_type = '561'.            → Movement Type cố định
```

**Fields user nhập**:
1. Material ID (chọn từ list)
2. Plant (chọn từ list)
3. Storage Location (chọn từ list)
4. Quantity (nhập số)
5. Posting Date (chọn ngày)
6. Remark (nhập text) → Thành Header Text

---

### Câu 8: StockSet có thực sự hỗ trợ PUT để cập nhật tồn kho không, hay đây chỉ là topic giả định ban đầu?

**Trả lời**: CÓ thực sự hỗ trợ PUT

**Bằng chứng trong code**:
```
METHOD stockset_update_entity.
  ...
  CALL FUNCTION 'BAPI_GOODSMVT_CREATE'
  ...
ENDMETHOD.
```

**Cách hoạt động**:
- Frontend: PUT /StockSet(MaterialId='...',Plant='...',StorageLocation='...')
- Backend: Method `stockset_update_entity` xử lý
- Gọi BAPI_GOODSMVT_CREATE với Movement Type 561/562
- Update MARD

---

### Câu 9: HistorySet là entity có sẵn trong service hay do nhóm tự mô tả từ dữ liệu chứng từ?

**Trả lời**: Do nhóm TỰ MÔ TẢ từ dữ liệu chứng từ

**Bằng chứng trong code**:
```
METHOD historyset_get_entityset.
  SELECT a~mblnr, a~mjahr, a~budat, b~matnr, b~bwart, b~menge
  FROM mkpf AS a
  INNER JOIN mseg AS b ON a~mblnr = b~mblnr AND a~mjahr = b~mjahr
  ...
ENDMETHOD.
```

**Giải thích**:
- Query từ 2 tables SAP standard:
  - MKPF: Material Document Header
  - MSEG: Material Document Item
- Map vào Structure tự định nghĩa: `zst_wh_history`
- Không phải entity có sẵn trong SAP

---

### Câu 10: Có xử lý lỗi SAP message class/message number hay hiện chỉ show message text đơn giản?

**Trả lời**: Hiện chỉ show MESSAGE TEXT đơn giản

**Bằng chứng trong code**:
```
mo_context->get_message_container()->add_message_text_only(
  iv_msg_type = <m>-type
  iv_msg_text = <m>-message
).
```

**Giải thích**:
- Dùng `add_message_text_only` → Chỉ có text
- KHÔNG dùng `add_message` với message class/number
- Frontend nhận message text trực tiếp

**Nếu cô hỏi**: "Tại sao không dùng message class?"
- Trả lời: "Dự án đơn giản, chỉ cần message text là đủ"
- Hoặc: "Có thể enhance sau bằng message class"

---

## 3.3. Về dữ liệu

### Câu 11: Key thật của Material là chỉ MaterialId, hay còn phụ thuộc Plant và StorageLocation trong từng ngữ cảnh?

**Trả lời**: PHỤ THUỘC ngữ cảnh

**MaterialSet (Material Master)**:
- Key: MaterialId (đơn)
- Ví dụ: GET /MaterialSet('TEST001')
- Lấy thông tin material từ MARA

**StockSet (Stock)**:
- Key: MaterialId + Plant + StorageLocation (composite key)
- Ví dụ: GET /StockSet(MaterialId='TEST001',Plant='1000',StorageLocation='0001')
- Lấy tồn kho từ MARD

**Giải thích**:
- 1 Material có thể có ở nhiều Plant/SLoc
- MaterialSet: Quản lý material master (MARA)
- StockSet: Quản lý tồn kho (MARD) → Cần cả 3 keys

---

### Câu 12: Material Name có cho nhập khi tạo mới không?

**Trả lời**: CÓ, bắt buộc phải nhập

**Bằng chứng trong code**:
```
ls_desc-matl_desc = ls_req-material_name.
APPEND ls_desc TO lt_desc.

CALL FUNCTION 'BAPI_MATERIAL_SAVEDATA'
  TABLES
    materialdescription = lt_desc
```

**Validation trong Frontend**:
```
if (!oPayload.MaterialName) {
  this.showMessage("Please fill required fields");
  return;
}
```

---

### Câu 13: Valuation Class là bắt buộc nghiệp vụ hay chỉ demo?

**Trả lời**: BẮT BUỘC nghiệp vụ

**Bằng chứng trong code**:
```
IF ls_req-valuation_class IS INITIAL.
  _raise_busi_error( 'Error: Valuation Class is required!' ).
ENDIF.
```

**Giải thích**:
- Valuation Class dùng cho accounting (kế toán)
- SAP yêu cầu phải có để tính giá vật tư
- Không có Valuation Class → BAPI sẽ báo lỗi

---

### Câu 14: Base Unit lấy tự do, dropdown, hay từ master data?

**Trả lời**: Lấy từ MASTER DATA (dropdown)

**Bằng chứng trong code**:
```
METHOD baseunitmasteset_get_entityset.
  SELECT a~msehi, b~msehl
  FROM t006 AS a
  LEFT JOIN t006a AS b ON a~msehi = b~msehi AND b~spras = @sy-langu
  INTO CORRESPONDING FIELDS OF TABLE @et_entityset.
ENDMETHOD.
```

**Giải thích**:
- Frontend gọi GET /BaseUnitMasterSet
- Backend query từ T006 và T006A (SAP master data)
- Frontend hiển thị dropdown với list Base Units
- User chọn từ dropdown (EA, PC, KG, L, M...)

---

### Câu 15: Có cần quản lý batch, valuation type, hoặc serial number không?

**Trả lời**: KHÔNG, dự án không yêu cầu

**Bằng chứng**:
- Không có field batch, serial number trong Structure
- Không có method quản lý batch/serial
- BAPI call không truyền batch/serial data

**Nếu cô hỏi**: "Tại sao không có?"
- Trả lời: "Dự án chỉ yêu cầu quản lý kho cơ bản, không cần batch/serial"

---

### Câu 16: Quantity đang dùng kiểu số nguyên hay thập phân?

**Trả lời**: THẬP PHÂN (decimal 13,3)

**Bằng chứng trong code**:
```
quantity: menge_d  → Type MENGE_D = DEC(13,3)
```

**Giải thích**:
- Có thể lưu: 9999999999.999
- Frontend hiển thị: "100.000" (3 chữ số thập phân)
- Phù hợp cho các đơn vị như KG, L (có thể có số lẻ)

---

## 3.4. Về phân quyền

### Câu 17: Hệ thống có phân quyền user thực tế không?

**Trả lời**: KHÔNG có phân quyền

**Bằng chứng**:
- Không có check authorization trong code
- Không có field user_id trong Structure
- Tất cả user đều thao tác được hết

**Nếu cô hỏi**: "Tại sao không có?"
- Trả lời: "Dự án demo, chưa yêu cầu phân quyền"
- Hoặc: "Có thể thêm sau bằng SAP authorization object"

---

### Câu 18: Có phân biệt ai được tạo vật tư và ai được nhập kho không?

**Trả lời**: KHÔNG phân biệt

---

### Câu 19: History có xem được toàn bộ hay theo user/plant phụ trách?

**Trả lời**: Xem được TOÀN BỘ, không giới hạn theo user/plant

**Bằng chứng trong code**:
```
SELECT ... FROM mkpf AS a INNER JOIN mseg AS b
WHERE b~matnr IN @lr_matnr
  AND b~werks IN @lr_werks
  AND b~lgort IN @lr_lgort
```

**Giải thích**:
- Không có WHERE clause filter theo user
- User có thể filter theo Plant/SLoc nếu muốn
- Nhưng mặc định xem được tất cả

---

## 3.5. Về phi chức năng

### Câu 20: Có yêu cầu thời gian phản hồi khi gọi OData không?

**Trả lời**: KHÔNG có yêu cầu cụ thể

**Nhưng có optimization**:
- MaterialSet: `UP TO 100 ROWS` (limit 100 records)
- DashboardKPI: `UP TO 5000 ROWS` (limit 5000 records)
- Pagination: Hỗ trợ $top và $skip

---

### Câu 21: Có cơ chế retry/token refresh thống nhất không?

**Trả lời**: CÓ CSRF token refresh

**Bằng chứng trong Frontend Service**:
```
oModel.refreshSecurityToken(function () {
  oModel.create("/MaterialSet", oPayload, {
    groupId: "$direct",
    ...
  });
});
```

**Giải thích**:
- Mỗi POST/PUT/DELETE đều refresh CSRF token trước
- Đảm bảo token luôn valid
- Không có retry mechanism (nếu lỗi thì báo lỗi)

---

### Câu 22: Có yêu cầu chạy responsive chuẩn Fiori trên mobile/tablet không?

**Trả lời**: CÓ, dùng SAP UI5 responsive controls

**Bằng chứng**:
- Dùng `sap.m` library (mobile-first)
- Dùng `ResponsiveGridLayout` cho form
- Dùng `sap.m.Table` (responsive table)

**Nhưng**: Chủ yếu test trên desktop

---

### Câu 23: Có quy tắc logging/audit cho Goods Receipt không?

**Trả lời**: KHÔNG có logging riêng

**Nhưng**:
- SAP tự động log trong MKPF/MSEG (Material Document)
- Có Material Document Number để trace
- Có Posting Date, Document Date
- Có Remark (Header Text)

**Nếu cô hỏi**: "Vậy audit như thế nào?"
- Trả lời: "Xem History từ MKPF/MSEG, có đầy đủ thông tin giao dịch"

---

## TÓM TẮT TRẠNG THÁI DỰ ÁN

### ✅ ĐÃ HOÀN THÀNH
1. Create Material (MARA, MARC, MARD, MBEW, MAKT)
2. Goods Receipt (Movement Type 561)
3. Update Stock (Movement Type 561/562)
4. View History (từ MKPF + MSEG)
5. Dashboard KPI (4 KPIs)
6. Master Data (Plant, SLoc, Material Type, Base Unit, Valuation Class)
7. Cascade ComboBox (Plant → SLoc, Material Type → Valuation Class)
8. Validation (Plant, SLoc, Valuation Class, Quantity, Duplicate)
9. CSRF token refresh
10. Responsive UI (SAP UI5)
11. **Export Excel** (StockList và History) ✅

### ❌ CHƯA HOÀN THÀNH
1. Phân quyền user
2. Batch/Serial number management
3. Retry mechanism
4. Logging/Audit riêng (dùng SAP standard)

### 🔧 CÓ THỂ ENHANCE SAU
1. Message class/number thay vì message text
2. Performance optimization (caching, indexing)
3. Mobile optimization
4. Export PDF (hiện chỉ có Excel)
5. Phân quyền
