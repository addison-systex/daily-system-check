# Daily System Check Dashboard

## Prerequisites / 環境需求
- **Node.js**: [Download here](https://nodejs.org/) (Recommended: LTS)

## Setup / 安裝步驟

1. Open a terminal in this directory:
   ```bash
   cd daily-system-check
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run local server:
   ```bash
   npm run dev
   ```

## Backend Setup (Google Apps Script)
1. Create a new Google Sheet.
2. In Extensions > Apps Script, rename `Code.gs` and copy contents from `../backend/Code.gs`.
3. Create a sheet named `系統基本資料` and fill in columns: `System Name`, `Owner`, `Channel ID`, `Token`.
4. Deploy the script as a Web App (Execute as: Me, Who has access: Anyone).
5. Copy the Web App URL.
6. Trigger Setup: In GAS, set up triggers for `sendMorningTrigger` (10am), `sendAfternoonTrigger` (2pm), `markUnreported` (7pm).

## Configuration
Create a `.env` file in `daily-system-check` root:
(Refer to `.env.example` for template)
```env
VITE_GOOGLE_APP_SCRIPT_URL=your_google_script_web_app_url
```

## Deployment (GitHub Pages)

本專案已設定 GitHub Actions 自動部署至 GitHub Pages。

### 設定步驟

1.  **Push 專案到 GitHub**:
    確保您的程式碼已推送到 GitHub Repository。

2.  **設定 Secrets**:
    - 進入 GitHub Repo > **Settings** > **Secrets and variables** > **Actions**。
    - 點選 **New repository secret**。
    - **Name**: `VITE_GOOGLE_APP_SCRIPT_URL`
    - **Value**: 填入您的 Apps Script Web App URL (與本機 `.env` 中的內容相同)。

3.  **啟用 GitHub Pages**:
    - 進入 GitHub Repo > **Settings** > **Pages**。
    - 在 **Build and deployment** 下的 **Source** 選擇 `GitHub Actions`。

4.  **觸發部署**:
    - 只要 Push 到 `main` 分支，GitHub Actions 就會自動建置並部署。
    - 部署完成後，您可以在 Settings > Pages 頁面看到您的網站網址。
