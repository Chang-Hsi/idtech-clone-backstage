# About Us 後台企劃（定稿 v1）

## 1. 邊界

About Us 後台只管理內容本體，不管理：

1. Hero（Banner Hub Level-2）
2. SEO（SEO 模組）
3. 前台時間軸視覺排版動畫（僅管理資料）

## 2. 資料範圍（排除 hero / seo）

1. `intro`
   - `title`
   - `paragraphs[]`
   - `imageUrl`
2. `highlights[]`
   - `id`
   - `eyebrow`
   - `title`
   - `imageUrl`
   - `status`
3. `innovationTimeline`
   - `title`
   - `items[]`
     - `id`
     - `year`
     - `title`
     - `description`
     - `status`
4. `connectInfo`
   - `title`
   - `description`
   - `offices[]`
     - `id`
     - `name`
     - `phone`
     - `phoneHref`
     - `email`
     - `emailHref`
     - `address`
     - `status`

## 3. 頁面功能（後台）

路由：`/pages/content/company/about-us`

1. Intro：表單編輯（含 paragraphs 動態增刪）
2. Highlights：Tab（Active/Archived）+ 可拖拽排序 + 新增/刪除 + 狀態切換
3. Innovation Timeline：Tab（Active/Archived）+ 可拖拽排序 + 新增/刪除 + 狀態切換
4. Connect Info：表單編輯
5. Offices：Tab（Active/Archived）+ 可拖拽排序 + 新增/刪除 + 狀態切換

## 4. Timeline 規則

1. `year` 輸入後可透過「Auto Sort by Year」自動排序
2. 拖拽後若造成時間倒序（舊 > 新），禁止並提示錯誤
3. 後端儲存前會再做一次時序驗證（雙保險）

## 5. API

1. `GET /api/backstage/content/company/about-us`
2. `PUT /api/backstage/content/company/about-us`

Public API：

1. `GET /api/company/about-us` 只回傳 active 的 highlights/timeline/offices
