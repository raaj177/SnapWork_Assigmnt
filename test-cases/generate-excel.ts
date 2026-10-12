import ExcelJS from 'exceljs';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

type Exec = 'Manual' | 'Automation' | 'Both';
type AutoPriority = 'P1' | 'P2' | 'P3' | 'NA';
type Status = 'Not Executed' | 'Pass' | 'Fail' | 'Blocked';

interface TestCase {
  id: string;
  ac: string[];
  scenario: string;
  description: string;
  pre: string;
  steps: string[];
  data: string;
  expected: string;
  type: string;
  priority: 'High' | 'Medium' | 'Low';
  exec: Exec;
  autoPriority: AutoPriority;
  tags: string[];
  actual?: string;
  status?: Status;
  remarks?: string;
}

interface TestCaseFile {
  userStoryId: string;
  web: TestCase[];
  mobile: TestCase[];
}

const here = dirname(fileURLToPath(import.meta.url));
const source = JSON.parse(readFileSync(join(here, 'test-cases.json'), 'utf-8')) as TestCaseFile;
const outputFile = join(here, 'US_LOGIN_001_TestCases.xlsx');
const ACS = ['AC1', 'AC2', 'AC3', 'AC4', 'AC5', 'AC6', 'AC7', 'AC8', 'AC9'];
const STATUSES: Status[] = ['Not Executed', 'Pass', 'Fail', 'Blocked'];

function validate(platform: string, cases: TestCase[]): void {
  const seen = new Set<string>();
  for (const tc of cases) {
    if (seen.has(tc.id)) throw new Error(`Duplicate ID ${tc.id}`);
    seen.add(tc.id);
    const manualOnly = tc.exec === 'Manual';
    if (manualOnly !== (tc.autoPriority === 'NA')) {
      throw new Error(`${tc.id}: Automation Priority must be NA exactly when Execution Type is Manual`);
    }
    for (const ac of tc.ac) {
      if (!ACS.includes(ac)) throw new Error(`${tc.id}: unknown AC ${ac}`);
    }
  }
  if (cases.length === 0) throw new Error(`No ${platform} test cases`);
}

validate('Web', source.web);
validate('Mobile', source.mobile);

// First 14 columns follow the assignment order; the rest are additions.
const HEADERS = [
  'Test Case ID', 'User Story ID', 'Platform (Web/Mobile)', 'Test Scenario',
  'Test Case Description', 'Preconditions', 'Test Steps', 'Test Data', 'Expected Result',
  'Test Type', 'Execution Type (Manual/Automation/Both)', 'Automation Priority',
  'Actual Result', 'Execution Status',
  'AC Ref', 'Priority', 'Automation Tags', 'Automation Script Ref', 'Remarks',
];
const WIDTHS = [20, 14, 12, 30, 44, 34, 48, 34, 52, 14, 16, 12, 44, 16, 14, 10, 28, 24, 40];
const STATUS_COL = HEADERS.indexOf('Execution Status') + 1;
const EXEC_COL = HEADERS.indexOf('Execution Type (Manual/Automation/Both)') + 1;

function addCaseSheet(wb: ExcelJS.Workbook, name: 'Web' | 'Mobile', cases: TestCase[]): ExcelJS.Worksheet {
  const ws = wb.addWorksheet(name, { views: [{ state: 'frozen', xSplit: 1, ySplit: 1 }] });
  ws.addRow(HEADERS);
  ws.columns = WIDTHS.map((width) => ({ width }));
  const platform = name === 'Web' ? 'Web' : 'Mobile';

  for (const tc of cases) {
    const automated = tc.exec !== 'Manual';
    ws.addRow([
      tc.id,
      source.userStoryId,
      platform,
      tc.scenario,
      tc.description,
      tc.pre,
      tc.steps.map((s, i) => `${i + 1}. ${s}`).join('\n'),
      tc.data,
      tc.expected,
      tc.type,
      tc.exec,
      tc.autoPriority,
      tc.actual ?? '',
      tc.status ?? 'Not Executed',
      tc.ac.join(', '),
      tc.priority,
      tc.tags.join(' '),
      automated ? 'Pending' : 'N/A',
      tc.remarks ?? '',
    ]);
  }

  const header = ws.getRow(1);
  header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E78' } };
  header.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  header.height = 36;

  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    row.alignment = { vertical: 'top', wrapText: true };
    row.eachCell((cell) => {
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });
    const exec = String(row.getCell(EXEC_COL).value);
    if (exec === 'Manual') {
      row.getCell(EXEC_COL).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } };
    } else {
      row.getCell(EXEC_COL).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2EFDA' } };
    }
    if (String(row.getCell(STATUS_COL).value) === 'Fail') {
      row.getCell(STATUS_COL).font = { bold: true, color: { argb: 'FFC00000' } };
    }
    row.getCell(STATUS_COL).dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: [`"${STATUSES.join(',')}"`],
    };
  });

  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: HEADERS.length } };
  return ws;
}

function count(cases: TestCase[], predicate: (tc: TestCase) => boolean): number {
  return cases.filter(predicate).length;
}

function addSummary(wb: ExcelJS.Workbook): void {
  const ws = wb.addWorksheet('Summary', { properties: { tabColor: { argb: 'FF1F4E78' } } });
  ws.columns = [{ width: 36 }, { width: 14 }, { width: 14 }, { width: 14 }];

  ws.addRow([`${source.userStoryId} - Login Test Case Summary`]).font = { bold: true, size: 14 };
  ws.addRow([]);

  const colLetter = (index: number): string => String.fromCharCode(64 + index);
  const execCol = colLetter(EXEC_COL);
  const statusCol = colLetter(STATUS_COL);

  const heading = ws.addRow(['Execution Type', 'Web', 'Mobile', 'Total']);
  heading.font = { bold: true };
  for (const exec of ['Manual', 'Automation', 'Both'] as const) {
    const web = count(source.web, (t) => t.exec === exec);
    const mobile = count(source.mobile, (t) => t.exec === exec);
    const row = ws.addRow([exec]);
    row.getCell(2).value = { formula: `COUNTIF(Web!${execCol}:${execCol},"${exec}")`, result: web };
    row.getCell(3).value = { formula: `COUNTIF(Mobile!${execCol}:${execCol},"${exec}")`, result: mobile };
    row.getCell(4).value = { formula: `B${row.number}+C${row.number}`, result: web + mobile };
  }
  const totalRow = ws.addRow(['Total test cases']);
  const first = heading.number + 1;
  const last = totalRow.number - 1;
  const totals = [source.web.length, source.mobile.length, source.web.length + source.mobile.length];
  ['B', 'C', 'D'].forEach((col, i) => {
    totalRow.getCell(i + 2).value = { formula: `SUM(${col}${first}:${col}${last})`, result: totals[i] };
  });
  totalRow.font = { bold: true };

  ws.addRow([]);
  const statusHeading = ws.addRow(['Execution Status', 'Web', 'Mobile', 'Total']);
  statusHeading.font = { bold: true };
  for (const status of STATUSES) {
    const web = count(source.web, (t) => (t.status ?? 'Not Executed') === status);
    const mobile = count(source.mobile, (t) => (t.status ?? 'Not Executed') === status);
    const row = ws.addRow([status]);
    row.getCell(2).value = { formula: `COUNTIF(Web!${statusCol}:${statusCol},"${status}")`, result: web };
    row.getCell(3).value = { formula: `COUNTIF(Mobile!${statusCol}:${statusCol},"${status}")`, result: mobile };
    row.getCell(4).value = { formula: `B${row.number}+C${row.number}`, result: web + mobile };
  }

  ws.addRow([]);
  const typeHeading = ws.addRow(['Test Type', 'Web', 'Mobile', 'Total']);
  typeHeading.font = { bold: true };
  const types = [...new Set([...source.web, ...source.mobile].map((t) => t.type))].sort();
  for (const type of types) {
    const web = count(source.web, (t) => t.type === type);
    const mobile = count(source.mobile, (t) => t.type === type);
    ws.addRow([type, web, mobile, web + mobile]);
  }

  ws.addRow([]);
  ws.addRow(['Notes']).font = { bold: true };
  ws.addRow(['Both = executed manually first and automated for regression.']);
  ws.addRow(['Pre-filled Fail results come from the exploratory run on 2026-10-12; see docs/ac-deviations.md.']);
  ws.addRow(['Tags containing @known-issue mark tests expected to fail until the application is fixed.']);
}

function addTraceability(wb: ExcelJS.Workbook): void {
  const ws = wb.addWorksheet('AC Traceability');
  ws.columns = [{ width: 8 }, { width: 70 }, { width: 70 }, { width: 70 }];
  const criteria: Record<string, string> = {
    AC1: 'Login screen displays Username, Password and Login controls',
    AC2: 'User can enter valid credentials',
    AC3: 'Password is masked',
    AC4: 'Valid credentials allow successful login',
    AC5: 'Invalid credentials display appropriate error messages',
    AC6: 'Mandatory field validations are handled',
    AC7: 'Successful login navigates to the authenticated screen',
    AC8: 'Users cannot access authenticated screens without login',
    AC9: 'User can log out, where supported',
  };
  const header = ws.addRow(['AC', 'Acceptance Criterion', 'Web Test Cases', 'Mobile Test Cases']);
  header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E78' } };
  for (const ac of ACS) {
    const ids = (cases: TestCase[]): string =>
      cases.filter((t) => t.ac.includes(ac)).map((t) => t.id.replace('TC_', '').replace('_LOGIN', '')).join(', ');
    const row = ws.addRow([ac, criteria[ac], ids(source.web), ids(source.mobile)]);
    row.alignment = { vertical: 'top', wrapText: true };
  }
}

async function main(): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'SnapWork QA';
  addSummary(wb);
  addCaseSheet(wb, 'Web', source.web);
  addCaseSheet(wb, 'Mobile', source.mobile);
  addTraceability(wb);
  await wb.xlsx.writeFile(outputFile);
  console.log(`Created ${outputFile} (${source.web.length} web, ${source.mobile.length} mobile cases)`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
