const SHEET_NAME = "Submissions";
const HEADERS = ["id", "timestamp", "salesman", "cxName", "cxPhone", "callSummary", "updatedAt"];

function doGet(e) {
  return handleRequest(e.parameter || {});
}

function doPost(e) {
  const body = e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : {};
  return handleRequest(body);
}

function handleRequest(params) {
  try {
    const action = params.action;

    switch (action) {
      case "createSubmission":
        return jsonResponse(createSubmission(params));
      case "getSubmissions":
        return jsonResponse(getSubmissions(params));
      case "getSubmissionsBySalesman":
        return jsonResponse(getSubmissions({ salesman: params.salesman }));
      case "updateSubmission":
        return jsonResponse(updateSubmission(params.id, params));
      case "getStats":
        return jsonResponse(getStats());
      default:
        return jsonResponse({ success: false, error: "Unknown action" });
    }
  } catch (error) {
    return jsonResponse({ success: false, error: error.message || String(error) });
  }
}

function getSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }

  const existingHeaders = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  const needsHeaders = HEADERS.some((header, index) => existingHeaders[index] !== header);
  if (needsHeaders) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  }

  return sheet;
}

function getRows() {
  const sheet = getSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  return sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues().map((values, index) => {
    const row = { rowNumber: index + 2 };
    HEADERS.forEach((header, columnIndex) => {
      row[header] = values[columnIndex] == null ? "" : String(values[columnIndex]);
    });
    return row;
  });
}

function toSubmission(row) {
  return {
    id: row.id,
    timestamp: row.timestamp,
    salesman: row.salesman,
    cxName: row.cxName,
    cxPhone: row.cxPhone,
    callSummary: row.callSummary,
    updatedAt: row.updatedAt,
  };
}

function createSubmission(params) {
  const sheet = getSheet();
  const submission = {
    id: required(params.id, "id"),
    timestamp: required(params.timestamp, "timestamp"),
    salesman: required(params.salesman, "salesman"),
    cxName: required(params.cxName, "cxName"),
    cxPhone: required(params.cxPhone, "cxPhone"),
    callSummary: required(params.callSummary, "callSummary"),
    updatedAt: required(params.updatedAt, "updatedAt"),
  };

  sheet.appendRow(HEADERS.map((header) => submission[header]));
  return submission;
}

function getSubmissions(filters) {
  const salesman = normalize(filters.salesman);
  const date = normalize(filters.date);
  const search = normalize(filters.search).toLowerCase();

  return getRows()
    .map(toSubmission)
    .filter((submission) => {
      if (salesman && submission.salesman !== salesman) return false;
      if (date && !submission.timestamp.startsWith(date)) return false;
      if (search) {
        const haystack = [
          submission.id,
          submission.salesman,
          submission.cxName,
          submission.cxPhone,
          submission.callSummary,
        ].join(" ").toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      return true;
    });
}

function updateSubmission(id, params) {
  id = required(id, "id");
  const sheet = getSheet();
  const row = getRows().find((candidate) => candidate.id === id);
  if (!row) {
    throw new Error("Submission not found");
  }

  const current = toSubmission(row);
  const updated = {
    id: current.id,
    timestamp: current.timestamp,
    salesman: current.salesman,
    cxName: params.cxName != null ? String(params.cxName) : current.cxName,
    cxPhone: params.cxPhone != null ? String(params.cxPhone) : current.cxPhone,
    callSummary: params.callSummary != null ? String(params.callSummary) : current.callSummary,
    updatedAt: required(params.updatedAt, "updatedAt"),
  };

  sheet.getRange(row.rowNumber, 1, 1, HEADERS.length).setValues([HEADERS.map((header) => updated[header])]);
  return updated;
}

function getStats() {
  const rows = getRows().map(toSubmission);
  const counts = rows.reduce((acc, submission) => {
    acc[submission.salesman] = (acc[submission.salesman] || 0) + 1;
    return acc;
  }, {});

  return {
    total: rows.length,
    bySalesman: Object.keys(counts).sort().map((salesman) => ({
      salesman,
      count: counts[salesman],
    })),
  };
}

function normalize(value) {
  return value == null ? "" : String(value).trim();
}

function required(value, name) {
  const normalized = normalize(value);
  if (!normalized) {
    throw new Error(name + " is required");
  }
  return normalized;
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
