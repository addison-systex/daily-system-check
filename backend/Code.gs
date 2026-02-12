const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID'; // 若使用獨立腳本，請在此填入 Google Sheet ID
const CONFIG_SHEET_NAME = '系統基本資料';
const CHECK_ITEMS_SHEET_NAME = '系統檢查項目';
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
 * Serves the configuration data for the frontend.
 */
function doGet(e) {
  const systems = getSystemList();
  const checkItems = getCheckItems();
  const callback = e.parameter.callback;
  
  const data = {
    systems: systems,
    checkItems: checkItems
  };
  
  if (callback) {
    // JSONP response
    const jsonp = callback + '(' + JSON.stringify(data) + ')';
    return ContentService.createTextOutput(jsonp)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  } else {
    // Regular JSON response
    return ContentService.createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Receives the form submission and writes to the sheet.
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = getSpreadsheet();
    
    if (!ss) throw new Error("找不到試算表,請確認 SPREADSHEET_ID 設定");

    const systemName = data.systemName;
    let sheet = ss.getSheetByName(systemName);
    const checkItems = getCheckItems();
    const currentCheckItemIds = checkItems.map(item => item.id);
    
    // 固定欄位
    const fixedHeaders = ['日期', '回報時間'];
    const fixedTrailingHeaders = ['檢核人', '是否代理', '代理人', '狀態'];
    
    let currentHeaders = [];
    
    if (!sheet) {
      // 建立新工作表
      sheet = ss.insertSheet(systemName);
      currentHeaders = [...fixedHeaders, ...currentCheckItemIds, ...fixedTrailingHeaders];
      sheet.appendRow(currentHeaders);
    } else {
      // 讀取現有表頭
      currentHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      
      // 找出現有的檢查項目欄位(排除固定欄位)
      const existingCheckItems = currentHeaders.slice(
        fixedHeaders.length, 
        currentHeaders.length - fixedTrailingHeaders.length
      );
      
      // 找出需要新增的項目(在目前檢查項目中,但不在現有表頭中)
      const newItems = currentCheckItemIds.filter(id => !existingCheckItems.includes(id));
      
      if (newItems.length > 0) {
        // 有新項目,需要加欄位
        // 新表頭 = 固定欄位 + 現有檢查項目 + 新項目 + 固定尾部欄位
        const updatedHeaders = [
          ...fixedHeaders,
          ...existingCheckItems,
          ...newItems,
          ...fixedTrailingHeaders
        ];
        
        // 更新表頭
        sheet.getRange(1, 1, 1, updatedHeaders.length).setValues([updatedHeaders]);
        currentHeaders = updatedHeaders;
      }
    }
    
    // 準備資料物件
    const timestamp = new Date();
    const dataMap = {
      '日期': Utilities.formatDate(timestamp, Session.getScriptTimeZone(), 'yyyy/MM/dd'),
      '回報時間': Utilities.formatDate(timestamp, Session.getScriptTimeZone(), 'HH:mm:ss'),
      '檢核人': data.checker,
      '是否代理': data.isDeputy ? 'Y' : 'N',
      '代理人': data.deputyName || '',
      '狀態': '已回報'
    };
    
    // 加入目前檢查項目的值
    currentCheckItemIds.forEach(id => {
      dataMap[id] = data[id] || '';
    });
    
    // 根據當前表頭順序組裝資料列
    // 如果表頭中有已刪除的項目,會填入空字串
    const row = currentHeaders.map(header => dataMap[header] || '');
    
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
  // Headers: System Name | Owner | Deputy | General Deputy | Channel ID
  // [Name, Owner, Deputy, GeneralDeputy, ChannelID]
  const systems = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) {
      systems.push({
        name: data[i][0],
        owner: data[i][1],
        deputy: data[i][2] || '',
        generalDeputy: data[i][3] || '',
        channelId: data[i][4]
      });
    }
  }
  return systems;
}

/**
 * Reads check items configuration.
 */
function getCheckItems() {
  const ss = getSpreadsheet();
  if (!ss) throw new Error("找不到試算表，請確認 SPREADSHEET_ID 設定");

  const sheet = ss.getSheetByName(CHECK_ITEMS_SHEET_NAME);
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getValues();
  // Headers: Item ID | Description
  // [ItemID, Description]
  const items = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) {
      items.push({
        id: data[i][0],
        description: data[i][1]
      });
    }
  }
  return items;
}

/**
 * Trigger: 10:00 AM - Send Check Request
 */
function sendMorningTrigger() {
  const systems = getSystemList();
  const formUrl = ScriptApp.getService().getUrl() || "YOUR_DEPLOYED_WEB_APP_URL"; 
  
  systems.forEach(sys => {
    const message = `早安！請進行今日的系統檢核：\n系統：${sys.name}\n負責人：${sys.owner}\n回報連結：${formUrl}`;
    sendSlackMessage(sys.channelId, message);
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
      sendSlackMessage(sys.channelId, message);
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
  const checkItems = getCheckItems();
  
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
      const naValues = checkItems.map(() => 'N/A');
      const row = [
        today,
        '19:00:00',
        ...naValues,
        'System', 'N', '', '未回報'
      ];
      sheet.appendRow(row);
      console.log(`Marked ${sys.name} as unreported.`);
    }
  });
}

function sendSlackMessage(channelId, text) {
  const slackToken = PropertiesService.getScriptProperties().getProperty('SLACK_TOKEN');
  
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
