# SEO 後端盤點與 CMS 企劃（v1）

## 1. 後端目前 SEO 設置總覽（idtech-clone-api）

### 1.1 統一 SEO 結構
後端 public API 的 SEO 最終都會被正規化為以下結構：

- `title`
- `description`
- `canonicalPath`
- `ogImageUrl`
- `type`
- `noindex`
- `robots`

核心實作位置：`src/server.js`

- `DEFAULT_SEO`：全域 fallback
- `buildSeo(payload, fallback)`：SEO 欄位補值規則
- `withSeo(payload, fallback)`：將正規化後 SEO 寫回 response

### 1.2 fallback 規則（重要）
`buildSeo` 規則摘要：

1. 優先吃內容內既有 `payload.seo`。
2. 若欄位缺失，吃 endpoint 傳入的 `fallback`。
3. 再缺失，吃 `DEFAULT_SEO`（title/description/canonical/type）。
4. `noindex` 預設 `false`。
5. `robots` 若未提供，依 `noindex` 自動推導：
   - `true` -> `noindex,nofollow`
   - `false` -> `index,follow`
6. `ogImageUrl` 若缺失，會由內容欄位自動推斷（`coverImageUrl / imageUrl / heroImageUrl / media.heroImageUrl / hero.imageUrl` 等）。

### 1.3 Public API 覆蓋情況
目前 public API 幾乎都會回傳 SEO（即使內容沒寫完整 seo，也會被 withSeo 補齊）：

- `GET /api/home`
- `GET /api/products`
- `GET /api/products/collections/:collectionSlug`
- `GET /api/products/:productSlug`
- `GET /api/use-cases`
- `GET /api/use-cases/:slug`
- `GET /api/resources`
- `GET /api/resources/:articleSlug`
- `GET /api/company`
- `GET /api/company/about-us`
- `GET /api/company/careers`
- `GET /api/company/careers/:jobSlug`
- `GET /api/contact`
- `GET /api/legal/privacy-policy`

### 1.4 Seed 的預設 SEO
`src/seed.js` 會在初始化時替多數頁面/實體寫入基礎 SEO（頁面、collection、product、use case、resource article、career job 等）。

也就是說：

- DB 層通常已經有初始 `seo`
- 就算被清掉，public API 仍可依 fallback 輸出 SEO

### 1.5 後台（backstage）可編輯現況
目前沒有獨立 SEO API（例如 `/api/backstage/seo/*`）可集中管理 SEO。

現況偏向「內容 API 順便帶 SEO」：

- `resources`：建立/更新時有明確 `buildSeo` 寫入流程
- 其他多數 page/content API：以內容欄位為主，SEO 欄位大多未在 schema 顯式管理

結論：

- Public SEO 輸出已統一
- Backstage SEO 編輯流程尚未產品化（缺集中管理頁、缺專用 API）

## 2. 目前缺口與風險

1. SEO 無集中管理入口
- 雖有 `/seo` 路由，但目前是 placeholder，未接真實資料流。

2. 欄位治理不一致
- 有些內容更新流程只保留內容欄位，SEO 依 fallback 自動補，不利精準控管。

3. 細粒度頁面（detail）數量多
- `products / collections / use-cases / resources / careers` 明細頁 SEO 需分層管理（頁面級 vs 實體級）。

## 3. SEO CMS 頁面企劃（MVP）

## 3.1 目標
在不破壞現有內容 CMS 的前提下，提供一個可集中管理 SEO 的模組，讓編輯者可：

- 查詢各頁 SEO 現況
- 修改並儲存 SEO 欄位
- 看見 fallback 與覆蓋來源，避免誤判

## 3.2 範圍切分

### In Scope（MVP）
- Page-level SEO 編輯：
  - home, products, use-cases, resources, company, about-us, careers, contact, privacy-policy
- Detail-level SEO 編輯（列表 + 編輯）：
  - product detail
  - collection detail
  - use case detail
  - resource article
  - career detail
- 欄位：
  - `title`, `description`, `canonicalPath`, `ogImageUrl`, `type`, `noindex`, `robots`

### Out of Scope（MVP）
- SEO bulk import/export
- 自動關鍵字建議
- sitemap/robots.txt 檔案生成器
- 多語 SEO 分版本

## 3.3 UI 資訊架構（/seo，Webflow-style）
採「左側清單 + 右側設定表單」；右側編輯器偏 Webflow 的完整設定面板風格。

1. 左欄：SEO Target List（管理導向）
- 分組顯示 `Page Types` 與 `Detail Types`
- 可搜尋（target key / title / slug）
- 可篩選：
  - `All`
  - `Has Explicit SEO`
  - `Fallback Only`
  - `Noindex`
- 每列顯示：
  - 類型 badge（page/product/resource...）
  - 名稱或 slug
  - 狀態 badge（`Explicit` / `Fallback`）
  - 最後更新時間

2. 右欄：SEO Settings Panel（Webflow-style）
- Header 區：
  - 目標名稱（例如 `Product: vp3300`）
  - targetKey
  - `Save` 按鈕
- Main 設定區（預設展開）：
  - `Page Title`
  - `Meta Description`
  - `Canonical Path`
  - `OG Image URL`（含 Image Preview）
  - `Type`
- Indexing 設定區（預設展開）：
  - `Noindex` toggle
  - `Robots` input（可自動帶入預設值，仍允許覆蓋）
- Advanced 區（可收合）：
  - `Computed Preview`（顯示目前前台最終會拿到的 SEO）
  - `Source State`（每欄位標示 Explicit/Fallback）
  - `Fallback Hint`（告知若清空會回退到哪個來源）

3. Search Engine Listing Preview（預覽卡）
- 固定顯示在右欄上半部或側邊 sticky 區塊：
  - title 預覽
  - URL/canonical 預覽
  - description 預覽
- 字元計數提示：
  - title 建議 <= 60
  - description 建議 <= 160
- 超出建議長度時顯示 warning（不一定阻擋儲存）

4. 互動機制
- 切換左欄 target 時：
  - 若右欄有未儲存變更，先彈出離開確認（沿用既有 ConfirmDialog）
- 儲存後：
  - 顯示 StatusMessage
  - 更新左欄該列的狀態 badge 與 updatedAt
- Reset 行為：
  - `Reset to Last Saved`：回到 DB 值
  - `Reset to Fallback`：清除 explicit seo，回退系統補值（需二次確認）

## 3.4 表單驗證規則（沿用既有機制）
依 README 的 schema-driven validation：

- `title`: required, max length（建議 60）
- `description`: required, max length（建議 160）
- `canonicalPath`: required, must start with `/`
- `type`: required, enum（website/article/product）
- `ogImageUrl`: optional, URL 格式
- `noindex`: boolean
- `robots`: required（若 `noindex=true` 預設 `noindex,nofollow`；反之 `index,follow`）

## 3.5 API 設計建議（新增）

### 查詢
- `GET /api/backstage/seo/targets`
  - 回傳所有可管理 target（pageKey、slug、type、updatedAt、seoSnapshot、sourceState）
- `GET /api/backstage/seo/targets/:targetKey`
  - 回傳單一 target 的完整 seo 與來源資訊

### 寫入
- `PUT /api/backstage/seo/targets/:targetKey`
  - body: `{ seo, updatedBy }`
  - 只更新 SEO，不覆蓋內容本體

### 後端處理原則
- 僅更新 payload.seo
- 不改動非 SEO 欄位
- 寫入後可重算 `robots`（依 noindex）或接受 explicit 值（需明確規範）

## 3.6 Target Key 規格建議
避免前後端對 pageKey/slug 映射混亂：

- `page:home`
- `page:products`
- `page:use-cases`
- `page:resources`
- `page:company`
- `page:about-us`
- `page:careers`
- `page:contact`
- `page:privacy-policy`
- `product:{slug}`
- `collection:{slug}`
- `use-case:{slug}`
- `resource:{slug}`
- `career:{slug}`

## 3.7 實作階段建議

### Phase A
- 完成 `/seo` 真實頁面
- 僅支援 Page-level SEO

### Phase B
- 補 Detail-level SEO 列表與編輯
- 加入 filter/search 與來源狀態標記

### Phase C
- 加入批次作業與診斷（缺 canonical、重複 title、過長 description）

## 4. 驗收條件（MVP）

1. `/seo` 可讀取並編輯 page-level SEO。
2. 儲存後 public API 立即回傳新 SEO。
3. 驗證規則與錯誤提示符合既有 form 驗證框架。
4. `noindex` 與 `robots` 行為一致，不出現互相矛盾值。
5. 不影響既有內容編輯頁（products/use-cases/resources/company/careers）。

## 5. 決策建議（給 IDT-24）

1. 先做 Page-level，再做 Detail-level。
2. SEO 寫入 API 要與內容 API 解耦（避免互相覆寫）。
3. 明確標示「Explicit vs Fallback」，避免編輯者誤認目前值已落 DB。
4. 以 `targetKey` 作為 SEO 模組唯一主鍵，減少跨表映射複雜度。

## 6. 元件清單（直接對接實作）

## 6.1 路由與頁面層

- `src/routes/router.jsx`
  - `/seo` 導向 `SeoPageManager`
- `src/pages/seo/SeoPageManager.jsx`
  - 頁面入口（組裝容器、載入資料、保存）
- `src/components/pages/seo/SeoManagerPage.jsx`
  - SEO 主版面（左右欄）

## 6.2 左欄清單元件

- `src/components/pages/seo/SeoTargetList.jsx`
  - 顯示 target 列表、群組、active item
- `src/components/pages/seo/SeoTargetFilters.jsx`
  - keyword 搜尋 + status/type 篩選
- `src/components/pages/seo/SeoTargetListItem.jsx`
  - 單列（badge + name/slug + updatedAt）

## 6.3 右欄編輯元件

- `src/components/pages/seo/SeoEditorPanel.jsx`
  - 主編輯容器（Save/Reset）
- `src/components/pages/seo/SeoMainFields.jsx`
  - title/description/canonicalPath/ogImageUrl/type
- `src/components/pages/seo/SeoIndexingFields.jsx`
  - noindex + robots
- `src/components/pages/seo/SeoAdvancedPanel.jsx`
  - computed preview/source state/fallback hint
- `src/components/pages/seo/SearchEnginePreviewCard.jsx`
  - 搜尋結果預覽卡（字元提示）
- `src/components/pages/seo/SeoSourceBadge.jsx`
  - Explicit / Fallback badge

## 6.4 狀態與確認

- `src/components/common/StatusMessage.jsx`
  - 儲存成功/失敗提示（沿用現有）
- `src/components/dialog/ConfirmDialog.jsx`
  - 離開未儲存確認、Reset to Fallback 二次確認

## 6.5 hooks / schema / api

- `src/components/pages/seo/SeoEditor.schema.js`
  - SEO 表單驗證 schema
- `src/hooks/useSeoManager.js`
  - target list、detail、dirty state、save/reset
- `src/lib/backstageApi.js`（或既有 API 模組）
  - `getSeoTargets`
  - `getSeoTargetDetail`
  - `updateSeoTarget`

## 7. 欄位 Schema（前端驗證範例）

檔案：`src/components/pages/seo/SeoEditor.schema.js`

```js
import { requiredRule, maxLengthRule, enumRule, customRule, urlRule } from '../../utils/validation/rules'

const SEO_TYPE_OPTIONS = ['website', 'article', 'product']
const ROBOTS_OPTIONS = ['index,follow', 'noindex,nofollow']

export const seoEditorSchema = [
  {
    name: 'Page Title',
    valuePath: 'seo.title',
    rules: [
      requiredRule('Page title is required.'),
      maxLengthRule(60, 'Page title should be 60 characters or fewer.'),
    ],
  },
  {
    name: 'Meta Description',
    valuePath: 'seo.description',
    rules: [
      requiredRule('Meta description is required.'),
      maxLengthRule(160, 'Meta description should be 160 characters or fewer.'),
    ],
  },
  {
    name: 'Canonical Path',
    valuePath: 'seo.canonicalPath',
    rules: [
      requiredRule('Canonical path is required.'),
      customRule(
        (value) => typeof value === 'string' && value.startsWith('/'),
        'Canonical path must start with "/".',
      ),
    ],
  },
  {
    name: 'OG Image URL',
    valuePath: 'seo.ogImageUrl',
    rules: [
      customRule(
        (value) => !value || urlRule()(value) === true,
        'OG image URL must be a valid URL.',
      ),
    ],
  },
  {
    name: 'Type',
    valuePath: 'seo.type',
    rules: [requiredRule('Type is required.'), enumRule(SEO_TYPE_OPTIONS, 'Unsupported SEO type.')],
  },
  {
    name: 'Robots',
    valuePath: 'seo.robots',
    rules: [requiredRule('Robots is required.'), enumRule(ROBOTS_OPTIONS, 'Unsupported robots value.')],
  },
]
```

補充規則：

- `noindex = true` 時，UI 預設把 `robots` 填為 `noindex,nofollow`
- `noindex = false` 時，UI 預設把 `robots` 填為 `index,follow`
- 若使用者手動覆蓋 `robots`，顯示 warning，不強制擋存（MVP）

## 8. API Payload 範例（Backstage）

## 8.1 GET `/api/backstage/seo/targets`

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "targets": [
      {
        "targetKey": "page:home",
        "entityType": "page",
        "pageKey": "home-page",
        "displayName": "Home",
        "slug": null,
        "updatedAt": "2026-02-21T11:08:23.000Z",
        "seoSnapshot": {
          "title": "Home",
          "description": "Enterprise-grade payment foundation...",
          "canonicalPath": "/",
          "ogImageUrl": "https://cdn.example.com/home.jpg",
          "type": "website",
          "noindex": false,
          "robots": "index,follow"
        },
        "sourceState": "explicit"
      },
      {
        "targetKey": "product:vp3300",
        "entityType": "product",
        "pageKey": "product-detail:vp3300",
        "displayName": "VP3300",
        "slug": "vp3300",
        "updatedAt": "2026-02-21T12:22:10.000Z",
        "seoSnapshot": {
          "title": "VP3300 | Products",
          "description": "Explore VP3300 product details.",
          "canonicalPath": "/products/vp3300",
          "ogImageUrl": "https://cdn.example.com/vp3300.jpg",
          "type": "product",
          "noindex": false,
          "robots": "index,follow"
        },
        "sourceState": "fallback"
      }
    ]
  }
}
```

## 8.2 GET `/api/backstage/seo/targets/:targetKey`

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "target": {
      "targetKey": "product:vp3300",
      "entityType": "product",
      "pageKey": "product-detail:vp3300",
      "displayName": "VP3300",
      "slug": "vp3300",
      "updatedAt": "2026-02-21T12:22:10.000Z",
      "seo": {
        "title": "VP3300 | Products",
        "description": "Explore VP3300 product details.",
        "canonicalPath": "/products/vp3300",
        "ogImageUrl": "https://cdn.example.com/vp3300.jpg",
        "type": "product",
        "noindex": false,
        "robots": "index,follow"
      },
      "fieldSource": {
        "title": "fallback",
        "description": "fallback",
        "canonicalPath": "fallback",
        "ogImageUrl": "fallback",
        "type": "fallback",
        "noindex": "fallback",
        "robots": "fallback"
      },
      "fallbackSeo": {
        "title": "VP3300 | Products",
        "description": "Explore VP3300 product details.",
        "canonicalPath": "/products/vp3300",
        "ogImageUrl": "https://cdn.example.com/vp3300.jpg",
        "type": "product",
        "noindex": false,
        "robots": "index,follow"
      }
    }
  }
}
```

## 8.3 PUT `/api/backstage/seo/targets/:targetKey`

Request:

```json
{
  "seo": {
    "title": "VP3300 Secure Reader | Products",
    "description": "Compact mobile reader for secure card-present acceptance.",
    "canonicalPath": "/products/vp3300",
    "ogImageUrl": "https://cdn.example.com/seo/vp3300-og.jpg",
    "type": "product",
    "noindex": false,
    "robots": "index,follow"
  },
  "updatedBy": "editor@idtech.com"
}
```

Response:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "target": {
      "targetKey": "product:vp3300",
      "updatedAt": "2026-02-21T13:10:44.000Z",
      "seo": {
        "title": "VP3300 Secure Reader | Products",
        "description": "Compact mobile reader for secure card-present acceptance.",
        "canonicalPath": "/products/vp3300",
        "ogImageUrl": "https://cdn.example.com/seo/vp3300-og.jpg",
        "type": "product",
        "noindex": false,
        "robots": "index,follow"
      },
      "sourceState": "explicit"
    }
  }
}
```

## 8.4 PUT `/api/backstage/seo/targets/:targetKey/reset-fallback`

Request:

```json
{
  "updatedBy": "editor@idtech.com"
}
```

Response:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "target": {
      "targetKey": "product:vp3300",
      "sourceState": "fallback"
    }
  }
}
```
