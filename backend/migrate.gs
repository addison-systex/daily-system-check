/**
 * 一次性執行的資料遷移函數
 * 用於修正現有工作表的表頭和資料順序
 */
function migrateExistingSheets() {
  const ss = getSpreadsheet();
  const systems = getSystemList();
  const checkItems = getCheckItems();
  
  const expectedHeaders = [
    '日期', '回報時間',
    ...checkItems.map(item => item.id),
    '檢核人', '是否代理', '代理人', '狀態'
  ];
  
  Logger.log('預期表頭: ' + expectedHeaders.join(', '));
  
  systems.forEach(system => {
    const sheet = ss.getSheetByName(system.name);
    if (!sheet) {
      Logger.log(`工作表 ${system.name} 不存在，跳過`);
      return;
    }
    
    Logger.log(`\n處理工作表: ${system.name}`);
    
    // 讀取現有表頭
    const lastCol = sheet.getLastColumn();
    const currentHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    Logger.log('目前表頭: ' + currentHeaders.join(', '));
    
    // 檢查是否需要更新
    if (JSON.stringify(currentHeaders) === JSON.stringify(expectedHeaders)) {
      Logger.log('表頭已正確，無需更新');
      return;
    }
    
    // 讀取所有資料(包含表頭)
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      // 只有表頭或空白，直接更新表頭
      sheet.getRange(1, 1, 1, expectedHeaders.length).setValues([expectedHeaders]);
      if (lastCol > expectedHeaders.length) {
        sheet.deleteColumns(expectedHeaders.length + 1, lastCol - expectedHeaders.length);
      }
      Logger.log('已更新表頭(無資料)');
      return;
    }
    
    const allData = sheet.getRange(1, 1, lastRow, lastCol).getValues();
    
    // 建立舊表頭到新表頭的對應關係
    const newData = [];
    newData.push(expectedHeaders); // 新表頭
    
    // 處理每一行資料
    for (let i = 1; i < allData.length; i++) {
      const oldRow = allData[i];
      const dataMap = {};
      
      // 建立舊資料的 key-value map
      currentHeaders.forEach((header, index) => {
        if (header) {
          dataMap[header] = oldRow[index];
        }
      });
      
      // 根據新表頭順序組裝新資料列
      const newRow = expectedHeaders.map(header => dataMap[header] || '');
      newData.push(newRow);
    }
    
    // 清空工作表
    sheet.clear();
    
    // 寫入新資料
    sheet.getRange(1, 1, newData.length, expectedHeaders.length).setValues(newData);
    
    Logger.log(`已遷移 ${newData.length - 1} 筆資料`);
  });
  
  Logger.log('\n遷移完成！');
}
