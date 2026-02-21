# Contact 管理頁企劃（Page Types）

## 1. 目標

`Page Types > Contact` 的定位是「管理 Contact 頁面的版位與頁面級內容」，不是管理獨立內容實體。

前台 Contact 目前包含三塊：

1. Hero Banner（含主圖 + 右側兩組聯絡資訊）
2. Regional Contact Points（4 張區域卡片）
3. Contact Form（文案與下拉選項）

本頁要做到：

1. 編輯者能在同一頁完成上述三塊資料管理
2. 維持 `ContactPage.jsx` 只負責拼接，不帶管理邏輯

## 2. 資料邊界（很重要）

`Page Types > Contact` 應管理：

1. `hero`
2. `addressSection`
3. `regionalCards`
4. `formContent`
5. `inquiryOptions`
6. `regionOptions`

`Page Types > Contact` 不直接管理：

1. `productOptions` 的實體來源（應由 `Content Types > Products` 產生）
2. Contact Inquiry 提交資料（那是 leads/inquiries 的資料域）

建議規則：

1. 後端回傳 contact page payload 時，`productOptions` 由 Products 資料表即時組裝
2. 後台 Contact 頁只顯示「Product options 來源自 Products（唯讀）」

## 3. 後台頁面設計（單頁多段）

建議結構：

1. Header 區
2. Hero 區
3. Regional Contact 區
4. Form 區

### 3.1 Header 區

1. 頁面標題：`Contact Page`
2. 最後更新資訊：`updatedAt`、`updatedBy`
3. 操作按鈕：`Save Changes`

### 3.2 Hero 區

編輯欄位：

1. `eyebrow`
2. `title`
3. `description`
4. `imageUrl`
5. `imageAlt`
6. `infoGroups`（兩組）

`infoGroups` 設計：

1. 群組欄位：`heading`
2. 每群組 rows（可增刪排序）
3. row 欄位：`type`（phone/email/address）、`text`、`href`（address 可空）

補充：

1. `type` 用下拉選單，避免自由輸入
2. `href` 需即時驗證格式（tel/mailto/http/#）

### 3.3 Regional Contact 區

欄位：

1. `addressSection.title`
2. `addressSection.description`
3. `regionalCards`（預設 4 筆，可增刪排序）

每張 card：

1. `region`
2. `rows[]`（phone/email/address）

UI 建議：

1. 列表卡片 + 右側 Drawer 編輯
2. 支援 drag-and-drop 排序（沿用 Home/BannerHub 的互動）

### 3.4 Form 區

欄位：

1. `formContent.heading`
2. `formContent.description`
3. `formContent.messageMinLength`
4. `inquiryOptions[]`（label/value）
5. `regionOptions[]`（label/value）

唯讀提示：

1. `productOptions` 不在此編輯
2. 顯示目前從 Products 同步的筆數與最後同步時間（可選）

## 4. API 契約建議

### 4.1 GET `/api/backstage/pages/contact`

回傳：

1. `data.pageKey`
2. `data.updatedAt`
3. `data.updatedBy`
4. `data.contactPage.hero`
5. `data.contactPage.addressSection`
6. `data.contactPage.regionalCards`
7. `data.contactPage.formContent`
8. `data.contactPage.inquiryOptions`
9. `data.contactPage.regionOptions`
10. `data.contactPage.productOptions`（由 DB products 組裝，唯讀來源）

### 4.2 PUT `/api/backstage/pages/contact`

請求 body 只允許：

1. `hero`
2. `addressSection`
3. `regionalCards`
4. `formContent`
5. `inquiryOptions`
6. `regionOptions`
7. `updatedBy`

後端忽略或拒絕：

1. `productOptions`（避免覆寫 products 真實資料）

## 5. 驗證與防呆

1. 必填：`hero.title`、`hero.description`、`imageUrl`
2. `infoGroups` 至少 1 組；每組至少 1 row
3. `regionalCards` 至少 1 張
4. `messageMinLength` 範圍：`1~200`
5. `option.value` 需唯一（同一 options 集合內）
6. `href` 格式檢查失敗時禁止儲存

## 6. UI 互動建議（現階段）

1. 主要操作採「分區塊編輯」為主，避免一次編輯過長表單
2. 危險操作（刪除群組/卡片/row）使用 ConfirmDialog
3. 本期先不做 Preview 區，專注在資料管理與儲存穩定性
4. 未儲存離開提示（dirty state guard）可列入下一期

## 7. 與前台對齊檢核清單

1. Hero 左圖右文顯示正常
2. Hero 右側兩組聯絡資訊 icon/type 對應正確
3. Regional cards 數量與排序正確
4. Form 下拉選項與後台一致
5. Product(s) options 會隨 products 內容變動而更新

## 8. 實作順序（建議）

1. 先做 API（GET/PUT `/api/backstage/pages/contact`）
2. 做後台 Contact Manager 基礎頁（分區 + Save）
3. 做 Hero 區 CRUD
4. 做 Regional 區 CRUD + 排序
5. 做 Form 區 CRUD
6. 補進階驗證（href 格式與 option 重複值檢查）

---

這份設計的核心是：

1. Contact 頁面級資料集中在 `Page Types > Contact`
2. Product options 繼續由 Products 真實資料來源驅動
3. 後台編輯體驗維持你目前專案的一致風格（列表、抽屜、確認彈窗、可預覽）
