# Home 管理頁企劃書（idtech-clone-backstage）

## 1. 目標

本文件描述後台 `/pages/home` 的已實作版本，作為目前開發基線。

目前定位：

1. Home 頁只管理 Hero 輪播資料
2. 其他模組（Use Cases / Products / Resources / SEO / Lead Form）暫不在此頁管理

## 2. 目前已完成功能

## 2.1 資料載入與儲存（真 API）

1. 進入頁面時呼叫 `GET /api/backstage/pages/home`
2. 點擊 `Save Changes` 呼叫 `PUT /api/backstage/pages/home`
3. 儲存後顯示成功訊息並更新 `updatedAt`

## 2.2 Hero 清單操作

1. 列表顯示所有 slide（id、title、desc、背景圖）
2. 新增 slide（`New Slide`）
3. 編輯 slide（`Edit`）
4. 封存 slide（`Archive`，含二次確認彈窗）
5. 還原 slide（`Restore`，含二次確認彈窗）
6. 拖拽排序（dnd-kit，僅 Active 清單）
7. Tab 切換（`Active` / `Archived`，下底線樣式）

## 2.3 編輯抽屜（Drawer）

1. 從右側滑入（slide-right-in）
2. 關閉時向右滑出（slide-right-out）
3. 支援 `Close` / `Cancel` / `Apply` 動畫退場

## 2.4 審計欄位（Audit）

每次儲存會寫入：

1. 每個 slide 的 `updatedBy`
2. 每個 slide 的 `updatedAt`
3. 新建 slide 首次寫入 `createdBy`、`createdAt`

## 3. 欄位與限制

## 3.1 可編輯欄位

1. `id`
2. `title`
3. `desc`
4. `primaryCta.label`
5. `primaryCta.to`
6. `background.imageUrl`
7. `background.overlay`
8. `background.overlayOpacity`
9. `foregroundImageUrl`（僅 Layout C）

## 3.2 Layers 設計（受控）

`layers` 不提供 JSON 任意編輯，改為三種預設排版：

1. `Layout A - Left Content`
2. `Layout B - Center Content`
3. `Layout C - Split + Foreground Image`

規則：

1. 使用者只改文字、連結、圖片
2. `id/type/style/motion/position` 由 preset 產生
3. 切換 preset 會重建 `layers`

## 4. API 契約（目前）

## 4.1 GET `/api/backstage/pages/home`

回傳重點：

1. `data.pageKey`
2. `data.updatedAt`
3. `data.homePage.heroSlides`
4. 支援 query：`?includeArchived=true`（回傳含封存資料）

## 4.2 PUT `/api/backstage/pages/home`

請求 body：

1. `heroSlides: []`
2. `updatedBy: string`（可選，前端目前會帶入登入者資訊）

回傳：

1. `data.updatedAt`
2. `data.homePage.heroSlides`

備註：目前僅更新 `home-page` payload 中的 `heroSlides`，不改其他欄位。

## 4.3 公開 API 封存規則

1. `GET /api/home` 不回傳 `status = archived` 的 hero slides
2. `GET /api/backstage/pages/home?includeArchived=true` 可在後台看到封存資料

## 5. 前端檔案結構（目前）

1. `src/pages/Pages/HomePageManager.jsx`
2. `src/components/pages/home/HomeHeroListSection.jsx`
3. `src/components/pages/home/HomeHeroEditorDrawer.jsx`
4. `src/components/dialog/ConfirmDialog.jsx`
5. `src/api/backstageHomeApi.js`
6. `src/lib/request.js`

## 6. 互動流程（目前）

1. 進頁面 -> 載入 heroSlides
2. 預設顯示 `Active` Tab，可拖拽改順序
3. 切到 `Archived` Tab 可查看封存資料
4. 點 `Edit` 開抽屜編輯
5. 點 `Archive` / `Restore` 會先開確認彈窗
6. 點 `Save Changes` 才會真正寫入 DB

## 7. 驗收標準（目前版）

1. `/pages/home` 可成功讀取後端 heroSlides
2. 新增/編輯/封存/還原/排序都可在 UI 生效
3. 儲存後刷新頁面，資料可持久化
4. 抽屜開關動畫正常
5. 封存/還原有二次確認，避免誤操作
6. 封存資料不會出現在公開 `/api/home`

## 8. 下一步建議（待開發）

1. Hero `id` 重複檢查
2. 未儲存離開提醒
3. 顯示 `createdBy/updatedBy` 在列表 UI
4. Home 其餘區塊改為「引用設定」管理（不做內容本體 CRUD）
