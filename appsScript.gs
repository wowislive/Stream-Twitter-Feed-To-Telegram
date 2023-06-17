const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("msgData");

function doPost(e) {
  const inputData = JSON.parse(e.postData.contents);
  const sheetData = sheet.getRange(1, 1).getValue();

  if (inputData.inputString == sheetData) {
    return ContentService.createTextOutput("Complete string match");
  } else {
    sheet.getRange(1, 1).setValue(inputData.inputString);
    return ContentService.createTextOutput(inputData.inputString);
  }
}
