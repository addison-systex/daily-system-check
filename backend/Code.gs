const SPREADSHEET_ID = '12QJ2M-XRaARIkjpkIlbs1G3A90cbmM0alDnu5qVoWDU'; // 若使用獨立腳本，請在此填入 Google Sheet ID
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
  const action = e.parameter.action;
  
  // 檢查今日是否已完成
  if (action === 'checkToday') {
    const systemName = e.parameter.system;
    if (!systemName) {
      return ContentService.createTextOutput(JSON.stringify({ error: 'Missing system parameter' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(systemName);
    const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy/MM/dd');
    
    let completed = false;
    let checker = '';
    
    if (sheet && sheet.getLastRow() > 1) {
      const data = sheet.getDataRange().getValues();
      // 從最後一行往前找
      for (let i = data.length - 1; i >= 1; i--) {
        const rowDate = Utilities.formatDate(new Date(data[i][0]), Session.getScriptTimeZone(), 'yyyy/MM/dd');
        if (rowDate === today) {
          completed = true;
          // 檢核人在第3欄 (index 2)
          checker = data[i][2] || '';
          break;
        }
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({ 
      completed: completed,
      checker: checker 
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  // 原有的系統列表和檢查項目
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
    
    // 固定欄位(前面)
    const fixedHeaders = ['日期', '回報時間', '檢核人', '是否代理', '代理人', '狀態'];
    
    let currentHeaders = [];
    
    if (!sheet) {
      // 建立新工作表
      sheet = ss.insertSheet(systemName);
      currentHeaders = [...fixedHeaders, ...currentCheckItemIds];
      sheet.appendRow(currentHeaders);
    } else {
      // 讀取現有表頭
      currentHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      
      Logger.log('目前表頭: ' + JSON.stringify(currentHeaders));
      Logger.log('目前檢查項目: ' + JSON.stringify(currentCheckItemIds));
      
      // 找出現有的檢查項目欄位(排除固定欄位)
      const existingCheckItems = currentHeaders.slice(fixedHeaders.length);
      
      Logger.log('現有檢查項目: ' + JSON.stringify(existingCheckItems));
      
      // 找出需要新增的項目
      const newItems = currentCheckItemIds.filter(id => !existingCheckItems.includes(id));
      
      Logger.log('需要新增的項目: ' + JSON.stringify(newItems));
      
      if (newItems.length > 0) {
        // 有新項目,直接往後加
        const updatedHeaders = [
          ...fixedHeaders,
          ...existingCheckItems,
          ...newItems
        ];
        
        Logger.log('更新後表頭: ' + JSON.stringify(updatedHeaders));
        
        // 如果需要更多欄位,先插入欄位
        const currentColCount = sheet.getLastColumn();
        const neededColCount = updatedHeaders.length;
        
        Logger.log(`目前欄位數: ${currentColCount}, 需要欄位數: ${neededColCount}`);
        
        if (neededColCount > currentColCount) {
          Logger.log(`插入 ${neededColCount - currentColCount} 個新欄位`);
          sheet.insertColumnsAfter(currentColCount, neededColCount - currentColCount);
        }
        
        // 更新表頭
        sheet.getRange(1, 1, 1, updatedHeaders.length).setValues([updatedHeaders]);
        currentHeaders = updatedHeaders;
        
        Logger.log('表頭更新完成');
      }
    }
    
    // 準備資料物件 - 用欄位名稱比對
    const timestamp = new Date();
    const dataMap = {
      '日期': Utilities.formatDate(timestamp, Session.getScriptTimeZone(), 'yyyy/MM/dd'),
      '回報時間': Utilities.formatDate(timestamp, Session.getScriptTimeZone(), 'HH:mm:ss'),
      '檢核人': data.checker || '',
      '是否代理': data.isDeputy ? 'Y' : 'N',
      '代理人': data.deputyName || '',
      '狀態': '已回報'
    };
    
    // 加入目前檢查項目的值
    currentCheckItemIds.forEach(id => {
      let value = data[id] || '';
      // 如果有對應的 _note 欄位,附加說明
      const noteKey = `${id}_note`;
      if (data[noteKey]) {
        value = value + (value ? ': ' : '') + data[noteKey];
      }
      dataMap[id] = value;
    });
    
    // 根據當前表頭順序組裝資料列 - 必須比對欄位名稱
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
  const baseUrl = "https://addison-systex.github.io/daily-system-check";
  
  systems.forEach(sys => {
    // 使用 query parameter 避免 GitHub Pages 404
    const systemUrl = `${baseUrl}/?system=${encodeURIComponent(sys.name)}`;
    const text = `早安！請進行今日(${sys.name})的系統檢核`;
    
    const blocks = [
      {
        "type": "header",
        "text": {
          "type": "plain_text",
          "text": "🌅 每日系統檢核通知",
          "emoji": true
        }
      },
      {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": `*系統名稱:* ${sys.name} \n *負責人:* ${sys.owner} \n _(若負責人休假，請代理人填寫)_`
            }
      },
      {
        "type": "actions",
        "elements": [
          {
            "type": "button",
            "text": {
              "type": "plain_text",
              "text": "立即前往檢核",
              "emoji": true
            },
            "value": "check",
            "url": systemUrl,
            "style": "primary"
          }
        ]
      }
    ];

    sendSlackMessage(sys.channelId, text, blocks);
  });
}

/**
 * Trigger: 14:00 PM - Remind Unreported
 */
function sendAfternoonTrigger() {
  const systems = getSystemList();
  const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy/MM/dd');
  const ss = getSpreadsheet();
  const baseUrl = "https://addison-systex.github.io/daily-system-check";
  
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
      // 使用 query parameter 避免 GitHub Pages 404
      const systemUrl = `${baseUrl}/?system=${encodeURIComponent(sys.name)}`;
      const text = `[提醒] ${sys.name} 尚未收到今日的系統檢核回報`;
      
      const blocks = [
        {
          "type": "header",
          "text": {
            "type": "plain_text",
            "text": "⚠️ 系統檢核未完成提醒",
            "emoji": true
          }
        },
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": `*${sys.name}* 尚未收到今日(${today})的系統檢核回報，請盡速完成回報作業。`
          }
        },
        {
          "type": "actions",
          "elements": [
            {
              "type": "button",
              "text": {
                "type": "plain_text",
                "text": "立即前往補填",
                "emoji": true
              },
              "value": "check_urgent",
              "url": systemUrl,
              "style": "danger"
            }
          ]
        }
      ];

      sendSlackMessage(sys.channelId, text, blocks);
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
  const currentCheckItemIds = checkItems.map(item => item.id);
  
  // 固定欄位(前面)
  const fixedHeaders = ['日期', '回報時間', '檢核人', '是否代理', '代理人', '狀態'];
  
  systems.forEach(sys => {
    let sheet = ss.getSheetByName(sys.name);
    let currentHeaders = [];
    
    if (!sheet) {
      // 建立新工作表
      sheet = ss.insertSheet(sys.name);
      currentHeaders = [...fixedHeaders, ...currentCheckItemIds];
      sheet.appendRow(currentHeaders);
    } else {
      // 讀取現有表頭
      currentHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
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
      // 準備資料物件 - 用欄位名稱比對
      const dataMap = {
        '日期': today,
        '回報時間': '19:00:00',
        '檢核人': 'System',
        '是否代理': 'N',
        '代理人': '',
        '狀態': '未回報'
      };
      
      // 所有檢查項目填 N/A
      currentCheckItemIds.forEach(id => {
        dataMap[id] = 'N/A';
      });
      
      // 根據當前表頭順序組裝資料列
      const row = currentHeaders.map(header => dataMap[header] || '');
      
      sheet.appendRow(row);
      console.log(`Marked ${sys.name} as unreported.`);
    }
  });
}

function sendSlackMessage(channelId, text, blocks) {
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
  
  if (blocks) {
    payload.blocks = blocks;
  }
  
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

