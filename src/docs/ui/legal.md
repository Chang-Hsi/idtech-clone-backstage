# Page Types > Legal（Privacy Policy）企劃書（已落地 v1）

## 1. 目標

提供後台可編輯的隱私權政策管理頁，內容以 markdown 形式儲存與發布。

## 2. 範圍

此頁負責：

1. 編輯 `Privacy Policy` markdown 原文
2. 管理 metadata（title / version / effectiveDate / status）
3. 即時預覽 markdown
4. 儲存到後端（PageContent）

此頁不負責：

1. 法務審核流程（approval workflow）
2. 多語版本切換（後續可擴充）

## 3. 路由與結構

路由：

1. `/pages/legal`

分層：

1. `src/pages/pageTypes/PrivacyPolicyPageManager.jsx` 只拼接
2. `src/components/pages/legal/PrivacyPolicyPageEditor.jsx` 放實作

## 4. API 契約

後台：

1. `GET /api/backstage/pages/legal/privacy-policy`
2. `PUT /api/backstage/pages/legal/privacy-policy`

前台：

1. `GET /api/legal/privacy-policy`
2. 前台 `PrivacyPolicyPage` 採 API 優先，失敗時 fallback 本地 `privacy-policy.md`

## 5. 編輯器設計

當前方案：

1. 左側：markdown 文字編輯器（textarea，monospace）
2. 右側：live preview
3. 上方：metadata 與 Save

理由：

1. 無額外相依，穩定
2. 可快速落地並與現有 markdown 渲染規則一致

後續可升級：

1. 換成專門 markdown editor（例如 CodeMirror / Monaco / MDX Editor）
2. 加入歷史版本與 diff

## 6. 資料模型

使用 `PageContent.pageKey = legal-privacy-policy`，payload 主要欄位：

1. `title`
2. `markdown`
3. `effectiveDate`
4. `version`
5. `status` (`draft` / `published`)
6. `_audit.legalPrivacyPolicy`

## 7. 驗收標準

1. 後台可讀取既有隱私權政策內容
2. 編輯並儲存後，前台 API 可取得新內容
3. `status = draft` 時，前台 public API 不回傳
4. 前台在 API 異常時仍可用本地 markdown 顯示
