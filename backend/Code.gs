const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID'; // 若使用獨立腳本，請在此填入 Google Sheet ID
const CONFIG_SHEET_NAME = '系統基本資料';
const REPORT_SHEET_NAME = '每日系統檢核表回報';

/**
 * Helper to get the spreadsheet instance.
 * Supports both bound scripts and standalone scripts (via ID).
 */
function getSpreadsheet() {
  if (SPREADSHEET_ID && SPREADSHEET_ID !== 'YOUR_SPREADSHEET_ID') {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * Serves the list of systems for the frontend dropdown.
 */
function doGet(e) {
  const systems = getSystemList();
  return ContentService.createTextOutput(JSON.stringify(systems))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Receives the form submission and writes to the sheet.
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = getSpreadsheet();
    
    if (!ss) throw new Error("找不到試算表，請確認 SPREADSHEET_ID 設定");

    const systemName = data.systemName;
    let sheet = ss.getSheetByName(systemName);
    
    if (!sheet) {
      sheet = ss.insertSheet(systemName);
      // Initialize headers if new
      const headers = [
        '日期', '回報時間', 'ED01-AP/DB運作', 'EM01-Update/防毒', 'EY01-帳密Review', 
        'ED02-備份檢查', 'EM02-效能檢查', 'EY02-權限盤點', 'ED03-硬碟空間', 
        'EY03-還原演練', 'ED04-FileServer空間', 'OT01-其他', 
        '檢核人', '是否代理', '代理人', '狀態'
      ];
      sheet.appendRow(headers);
    }
    
    const timestamp = new Date();
    const row = [
      Utilities.formatDate(timestamp, Session.getScriptTimeZone(), 'yyyy/MM/dd'),
      Utilities.formatDate(timestamp, Session.getScriptTimeZone(), 'HH:mm:ss'),
      data.ED01, data.EM01, data.EY01,
      data.ED02, data.EM02, data.EY02,
      data.ED03, data.EY03, data.ED04,
      data.OT01,
      data.checker,
      data.isDeputy ? 'Y' : 'N',
      data.deputyName || '',
      '已回報'
    ];
    
    sheet.appendRow(row);
    
    return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Reads system configurations.
 */
function getSystemList() {
  const ss = getSpreadsheet();
  if (!ss) throw new Error("找不到試算表，請確認 SPREADSHEET_ID 設定");

  const sheet = ss.getSheetByName(CONFIG_SHEET_NAME);
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getValues();
  // Assuming Row 1 is headers: System Name | Owner | Channel ID | Token
  // [Name, Owner, ChannelID, Token]
  // data[0] is header
  const systems = [];
  for (let i = 1; i < data.length; i++) {
    // Ensure we have a system name at least
    if (data[i][0]) {
      systems.push({
        name: data[i][0],
        owner: data[i][1],
        channelId: data[i][2],
        token: data[i][3]
      });
    }
  }
  return systems;
}

/**
 * Trigger: 10:00 AM - Send Check Request
 */
function sendMorningTrigger() {
  const systems = getSystemList();
  const formUrl = ScriptApp.getService().getUrl() || "YOUR_DEPLOYED_WEB_APP_URL"; 
  
  systems.forEach(sys => {
    const message = `早安！請進行今日的系統檢核：\n系統：${sys.name}\n負責人：${sys.owner}\n回報連結：${formUrl}`;
    sendSlackMessage(sys.channelId, message, sys.token);
  });
}

/**
 * Trigger: 14:00 PM - Remind Unreported
 */
function sendAfternoonTrigger() {
  const systems = getSystemList();
  const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy/MM/dd');
  const ss = getSpreadsheet();
  
  systems.forEach(sys => {
    const sheet = ss.getSheetByName(sys.name);
    let checked = false;
    if (sheet) {
      const data = sheet.getDataRange().getValues();
      for (let i = data.length - 1; i >= 1; i--) {
        const rowDate =  Utilities.formatDate(new Date(data[i][0]), Session.getScriptTimeZone(), 'yyyy/MM/dd');
        if (rowDate === today) {
          checked = true;
          break;
        }
      }
    }
    
    if (!checked) {
      const message = `[提醒] ${sys.name} 尚未收到今日的系統檢核回報，請盡速完成！`;
      sendSlackMessage(sys.channelId, message, sys.token);
    }
  });
}

/**
 * Trigger: 19:00 PM - Mark Unreported
 */
function markUnreported() {
  const systems = getSystemList();
  const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy/MM/dd');
  const ss = getSpreadsheet();
  
  systems.forEach(sys => {
    let sheet = ss.getSheetByName(sys.name);
    if (!sheet) {
      sheet = ss.insertSheet(sys.name);
    }
    
    const data = sheet.getDataRange().getValues();
    let checked = false;
    for (let i = data.length - 1; i >= 1; i--) {
      const rowDate = Utilities.formatDate(new Date(data[i][0]), Session.getScriptTimeZone(), 'yyyy/MM/dd');
      if (rowDate === today) {
        checked = true;
        break;
      }
    }
    
    if (!checked) {
      // Write "Unreported" row
      const row = [
        today,
        '19:00:00',
        'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A',
        'System', 'N', '', '未回報'
      ];
      sheet.appendRow(row);
      console.log(`Marked ${sys.name} as unreported.`);
    }
  });
}

function sendSlackMessage(channelId, text, token) {
  const slackToken = token || PropertiesService.getScriptProperties().getProperty('SLACK_TOKEN');
  
  if (!slackToken) {
    console.error('No Slack Token found');
    return;
  }
  
  const url = 'https://slack.com/api/chat.postMessage';
  const payload = {
    channel: channelId,
    text: text
  };
  
  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: `Bearer ${slackToken}`
    },
    payload: JSON.stringify(payload)
  };
  
  try {
    UrlFetchApp.fetch(url, options);
  } catch (e) {
    console.error('Error sending Slack message', e);
  }
}
