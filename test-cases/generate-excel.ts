import ExcelJS from 'exceljs';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PLATFORMS = ['Web', 'Mobile'] as const;
const EXECUTION_TYPES = ['Manual', 'Automation', 'Both'] as const;
const AUTOMATION_PRIORITIES = ['P0 - Critical', 'P1 - High', 'P2 - Medium', 'P3 - Low', 'N/A'] as const;
const STATUSES = ['Not Run', 'Pass', 'Fail', 'Blocked'] as const;
const TEST_TYPES = ['Positive', 'Negative', 'Validation', 'UI', 'Navigation', 'Security', 'Compatibility'] as const;
const PRIORITIES = ['P0', 'P1', 'P2', 'P3'] as const;

type Platform = (typeof PLATFORMS)[number];
type ExecutionType = (typeof EXECUTION_TYPES)[number];
type AutomationPriority = (typeof AUTOMATION_PRIORITIES)[number];
type Status = (typeof STATUSES)[number];
type TestType = (typeof TEST_TYPES)[number];
type Priority = (typeof PRIORITIES)[number];

interface TestCase {
  testCaseId: string;
  userStoryId: string;
  platform: Platform;
  testScenario: string;
  testCaseDescription: string;
  preconditions: string[];
  testSteps: string[];
  testData: string | Record<string, string>;
  expectedResult: string;
  testType: TestType;
  executionType: ExecutionType;
  automationPriority: AutomationPriority;
  actualResult: string;
  executionStatus: Status;
  acRef: string;
  sourceReference: string;
  deviceOs: string;
  priority: Priority;
  automationScriptRef: string;
  tags: string[];
  remarks: string;
}

interface AcceptanceCriterion {
  acRef: string;
  summary: string;
  sourceReference: string;
  gap: string;
}

interface TestCaseFile {
  metadata: {
    suite: string;
    version: string;
    userStoryId: string;
    sourceDocuments: string[];
    generatedAt: string | null;
    acceptanceCriteria: AcceptanceCriterion[];
  };
  testCases: TestCase[];
}

interface Column {
  header: string;
  width: number;
  value: (tc: TestCase) => string;
}

const here = dirname(fileURLToPath(import.meta.url));
// test-cases.new.json is used until it is renamed to test-cases.json.
const canonicalInput = join(here, 'test-cases.json');
const inputFile = existsSync(canonicalInput) ? canonicalInput : join(here, 'test-cases.new.json');
const outputFile = join(here, 'US_LOGIN_001_TestCases.xlsx');

// The first 14 columns are mandated by the assignment, in this order.
const REQUIRED_HEADERS = [
  'Test Case ID', 'User Story ID', 'Platform (Web/Mobile)', 'Test Scenario', 'Test Case Description',
  'Preconditions', 'Test Steps', 'Test Data', 'Expected Result', 'Test Type',
  'Execution Type (Manual/Automation/Both)', 'Automation Priority', 'Actual Result', 'Execution Status',
];

const numbered = (items: string[]): string => items.map((s, i) => `${i + 1}. ${s}`).join('\n');
const renderTestData = (data: TestCase['testData']): string =>
  typeof data === 'string' ? data : Object.entries(data).map(([k, v]) => `${k}: ${v}`).join('\n');

const COLUMNS: Column[] = [
  { header: 'Test Case ID', width: 20, value: (t) => t.testCaseId },
  { header: 'User Story ID', width: 14, value: (t) => t.userStoryId },
  { header: 'Platform (Web/Mobile)', width: 12, value: (t) => t.platform },
  { header: 'Test Scenario', width: 30, value: (t) => t.testScenario },
  { header: 'Test Case Description', width: 44, value: (t) => t.testCaseDescription },
  { header: 'Preconditions', width: 34, value: (t) => t.preconditions.map((p) => `- ${p}`).join('\n') },
  { header: 'Test Steps', width: 48, value: (t) => numbered(t.testSteps) },
  { header: 'Test Data', width: 34, value: (t) => renderTestData(t.testData) },
  { header: 'Expected Result', width: 52, value: (t) => t.expectedResult },
  { header: 'Test Type', width: 14, value: (t) => t.testType },
  { header: 'Execution Type (Manual/Automation/Both)', width: 16, value: (t) => t.executionType },
  { header: 'Automation Priority', width: 14, value: (t) => t.automationPriority },
  { header: 'Actual Result', width: 44, value: (t) => t.actualResult },
  { header: 'Execution Status', width: 16, value: (t) => t.executionStatus },
];

const colIndex = (header: string): number => COLUMNS.findIndex((c) => c.header === header) + 1;

// Colour coding in the Execution Type column.
const EXECUTION_FILL: Record<ExecutionType, string> = {
  Manual: 'FFFFE699',
  Automation: 'FFC6E0B4',
  Both: 'FFBDD7EE',
};

function assertRequiredColumns(): void {
  const actual = COLUMNS.slice(0, REQUIRED_HEADERS.length).map((c) => c.header);
  if (JSON.stringify(actual) !== JSON.stringify(REQUIRED_HEADERS)) {
    throw new Error(`The first ${REQUIRED_HEADERS.length} columns must be exactly: ${REQUIRED_HEADERS.join(' | ')}`);
  }
}

function loadFile(): TestCaseFile {
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(inputFile, 'utf-8'));
  } catch (error) {
    throw new Error(`Cannot read valid JSON from ${inputFile}: ${(error as Error).message}`);
  }
  const candidate = parsed as Partial<TestCaseFile>;
  if (!candidate.metadata || !Array.isArray(candidate.testCases)) {
    throw new Error(
      `${inputFile} is not in the expected schema. It must contain "metadata" and "testCases" (see .github/agents/test-designer.agent.md).`,
    );
  }
  return candidate as TestCaseFile;
}

const isText = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;
const isTextList = (v: unknown): v is string[] => Array.isArray(v) && v.length > 0 && v.every(isText);
const oneOf = <T extends string>(list: readonly T[], v: unknown): v is T => list.includes(v as T);

function validate(file: TestCaseFile): string[] {
  const errors: string[] = [];
  const known = new Set(file.metadata.acceptanceCriteria.map((c) => c.acRef));
  const seen = new Set<string>();

  if (file.testCases.length === 0) errors.push('testCases must not be empty');
  for (const c of file.metadata.acceptanceCriteria) {
    if (!isText(c.acRef) || !isText(c.summary) || !isText(c.sourceReference)) {
      errors.push(`metadata.acceptanceCriteria entry ${JSON.stringify(c.acRef)} needs acRef, summary and sourceReference`);
    }
  }

  file.testCases.forEach((tc, index) => {
    const id = isText(tc.testCaseId) ? tc.testCaseId : `testCases[${index}]`;
    const fail = (message: string): void => { errors.push(`${id}: ${message}`); };

    if (seen.has(id)) fail('duplicate testCaseId');
    seen.add(id);

    for (const key of ['testCaseId', 'userStoryId', 'testScenario', 'testCaseDescription', 'expectedResult',
      'acRef', 'sourceReference', 'deviceOs', 'automationScriptRef'] as const) {
      if (!isText(tc[key])) fail(`"${key}" is required`);
    }
    if (!isTextList(tc.preconditions)) fail('"preconditions" must be a non-empty array of strings');
    if (!isTextList(tc.testSteps)) fail('"testSteps" must be a non-empty array of strings');
    if (!Array.isArray(tc.tags)) fail('"tags" must be an array');
    if (typeof tc.actualResult !== 'string') fail('"actualResult" must be a string');
    if (typeof tc.remarks !== 'string') fail('"remarks" must be a string');
    if (!(isText(tc.testData) || (typeof tc.testData === 'object' && tc.testData !== null))) fail('"testData" is required');

    if (!oneOf(PLATFORMS, tc.platform)) fail(`"platform" must be one of ${PLATFORMS.join(', ')}`);
    if (!oneOf(EXECUTION_TYPES, tc.executionType)) fail(`"executionType" must be one of ${EXECUTION_TYPES.join(', ')}`);
    if (!oneOf(AUTOMATION_PRIORITIES, tc.automationPriority)) fail(`"automationPriority" must be one of ${AUTOMATION_PRIORITIES.join(', ')}`);
    if (!oneOf(STATUSES, tc.executionStatus)) fail(`"executionStatus" must be one of ${STATUSES.join(', ')}`);
    if (!oneOf(TEST_TYPES, tc.testType)) fail(`"testType" must be one of ${TEST_TYPES.join(', ')}`);
    if (!oneOf(PRIORITIES, tc.priority)) fail(`"priority" must be one of ${PRIORITIES.join(', ')}`);

    const idPattern = tc.platform === 'Web' ? /^TC_WEB_LOGIN_\d{3}$/ : /^TC_MOB_LOGIN_\d{3}$/;
    if (!idPattern.test(String(tc.testCaseId))) fail(`ID must match ${idPattern} for platform ${tc.platform}`);

    for (const ac of String(tc.acRef).split(',').map((s) => s.trim())) {
      if (!known.has(ac)) fail(`acRef "${ac}" is not defined in metadata.acceptanceCriteria`);
    }

    if (tc.executionType === 'Manual') {
      if (tc.automationPriority !== 'N/A') fail('Manual cases must use automationPriority "N/A"');
      if (tc.automationScriptRef !== 'Not Applicable') fail('Manual cases must use automationScriptRef "Not Applicable"');
    } else {
      if (tc.automationPriority === 'N/A') fail('Automation/Both cases need an automationPriority other than "N/A"');
      if (tc.automationScriptRef === 'Not Applicable') fail('Automation/Both cases need a Planned: or existing script reference');
    }
    if (tc.executionType === 'Both' && !isText(tc.remarks)) fail('"Both" cases must explain the manual/automation split in remarks');

    if (tc.executionStatus === 'Not Run' && isText(tc.actualResult)) fail('actualResult must be empty while status is "Not Run"');
    if (tc.executionStatus !== 'Not Run' && !isText(tc.actualResult)) fail('actualResult is required once the case has been run');
  });
  return errors;
}

function styleHeader(row: ExcelJS.Row): void {
  row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E78' } };
  row.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  row.height = 36;
}

const thin: Partial<ExcelJS.Borders> = {
  top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' },
};

function addCaseSheet(wb: ExcelJS.Workbook, platform: Platform, cases: TestCase[]): void {
  const ws = wb.addWorksheet(platform, { views: [{ state: 'frozen', xSplit: 1, ySplit: 1 }] });
  ws.columns = COLUMNS.map((c) => ({ width: c.width }));

  styleHeader(ws.addRow(COLUMNS.map((c) => c.header)));
  const execCol = colIndex('Execution Type (Manual/Automation/Both)');
  const statusCol = colIndex('Execution Status');
  const autoCol = colIndex('Automation Priority');

  for (const tc of cases) {
    const row = ws.addRow(COLUMNS.map((c) => c.value(tc)));
    row.alignment = { vertical: 'top', wrapText: true };
    row.eachCell((cell) => { cell.border = thin; });
    const fill = EXECUTION_FILL[tc.executionType];
    row.getCell(execCol).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fill } };
    row.getCell(execCol).font = { bold: true };
    if (tc.executionStatus === 'Fail') row.getCell(statusCol).font = { bold: true, color: { argb: 'FFC00000' } };
    row.getCell(execCol).dataValidation = { type: 'list', allowBlank: false, formulae: [`"${EXECUTION_TYPES.join(',')}"`] };
    row.getCell(statusCol).dataValidation = { type: 'list', allowBlank: false, formulae: [`"${STATUSES.join(',')}"`] };
    row.getCell(autoCol).dataValidation = { type: 'list', allowBlank: false, formulae: [`"${AUTOMATION_PRIORITIES.join(',')}"`] };
  }
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: COLUMNS.length } };
}

const isCandidate = (tc: TestCase): boolean => tc.executionType !== 'Manual';
const needsClarification = (tc: TestCase): boolean => tc.expectedResult.startsWith('Needs Clarification');

function addSummary(wb: ExcelJS.Workbook, file: TestCaseFile): void {
  const cases = file.testCases;
  const ws = wb.addWorksheet('Summary', { properties: { tabColor: { argb: 'FF1F4E78' } } });
  ws.columns = [{ width: 48 }, { width: 18 }, { width: 18 }, { width: 18 }];
  ws.addRow([`${file.metadata.userStoryId} - Login Test Case Summary`]).font = { bold: true, size: 14 };
  ws.addRow([`Suite: ${file.metadata.suite} | Version: ${file.metadata.version}`]);
  ws.addRow([]);

  const count = (platform: Platform | null, predicate: (tc: TestCase) => boolean): number =>
    cases.filter((tc) => (platform === null || tc.platform === platform) && predicate(tc)).length;

  const table = (title: string, rows: Array<[string, (tc: TestCase) => boolean]>): void => {
    styleHeader(ws.addRow([title, 'Web', 'Mobile', 'Total']));
    for (const [label, predicate] of rows) {
      ws.addRow([label, count('Web', predicate), count('Mobile', predicate), count(null, predicate)]);
    }
    ws.addRow([]);
  };
  const byValue = <K extends keyof TestCase>(key: K, values: readonly string[]): Array<[string, (tc: TestCase) => boolean]> =>
    values.map((v) => [v, (tc: TestCase) => tc[key] === v]);

  table('Total test cases', [['All cases', () => true]]);
  table('Execution Type', [
    ...byValue('executionType', EXECUTION_TYPES),
    ['Automation candidates (Automation + Both)', isCandidate],
  ]);
  table('Test Type', byValue('testType', TEST_TYPES));
  table('Priority', byValue('priority', PRIORITIES));
  table('Automation Priority', byValue('automationPriority', AUTOMATION_PRIORITIES));
  table('Execution Status', byValue('executionStatus', STATUSES));
  table('Traceability checks', [
    ['Missing User Story ID', (tc) => tc.userStoryId === 'Not Provided'],
    ['Missing AC Ref', (tc) => tc.acRef === 'Not Provided'],
    ['Needs Clarification', needsClarification],
  ]);

  ws.addRow(['Rule: "Both" cases are counted as automation candidates and are also executed manually. They are not counted as Manual-only.']);
  ws.addRow(['Colours in the Execution Type column: Manual = amber, Automation = green, Both = blue.']);
  ws.addRow([]);
  styleHeader(ws.addRow(['Manual-only test case ID', 'Platform', 'Execution Type', 'Automation Priority']));
  for (const tc of cases.filter((t) => t.executionType === 'Manual')) {
    ws.addRow([tc.testCaseId, tc.platform, tc.executionType, tc.automationPriority]);
  }
  ws.addRow([]);
  styleHeader(ws.addRow(['Automation candidate ID', 'Platform', 'Execution Type', 'Automation Priority']));
  for (const tc of cases.filter(isCandidate)) {
    ws.addRow([tc.testCaseId, tc.platform, tc.executionType, tc.automationPriority]);
  }
}

function addTraceability(wb: ExcelJS.Workbook, file: TestCaseFile): void {
  const ws = wb.addWorksheet('AC Traceability', { views: [{ state: 'frozen', ySplit: 1 }] });
  ws.columns = [14, 8, 22, 54, 50, 50, 16, 18, 60].map((width) => ({ width }));
  styleHeader(ws.addRow([
    'User Story ID', 'AC Ref', 'Source Reference', 'Requirement / AC Summary', 'Web Test Case IDs',
    'Mobile Test Case IDs', 'Platform Coverage', 'Coverage Status', 'Gap / Clarification',
  ]));

  const related = (ac: string, platform: Platform): TestCase[] =>
    file.testCases.filter((tc) => tc.platform === platform && tc.acRef.split(',').map((s) => s.trim()).includes(ac));

  for (const criterion of file.metadata.acceptanceCriteria) {
    const web = related(criterion.acRef, 'Web');
    const mobile = related(criterion.acRef, 'Mobile');
    const coverage = web.length > 0 && mobile.length > 0 ? 'Web, Mobile' : web.length > 0 ? 'Web only' : mobile.length > 0 ? 'Mobile only' : 'None';
    const status = coverage === 'Web, Mobile' ? 'Covered' : coverage === 'None' ? 'Not Covered' : 'Partially Covered';
    const flagged = [...web, ...mobile].filter(needsClarification).map((tc) => tc.testCaseId);
    const gap = [criterion.gap, flagged.length > 0 ? `Needs Clarification: ${flagged.join(', ')}` : ''].filter(isText).join(' ');
    const row = ws.addRow([
      file.metadata.userStoryId, criterion.acRef, criterion.sourceReference, criterion.summary,
      web.map((tc) => tc.testCaseId).join(', '), mobile.map((tc) => tc.testCaseId).join(', '), coverage, status, gap,
    ]);
    row.alignment = { vertical: 'top', wrapText: true };
    row.eachCell((cell) => { cell.border = thin; });
  }
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: 9 } };
}

async function main(): Promise<void> {
  assertRequiredColumns();
  const file = loadFile();
  const errors = validate(file);
  if (errors.length > 0) {
    throw new Error(`Validation failed (${errors.length}):\n- ${errors.join('\n- ')}`);
  }

  const web = file.testCases.filter((tc) => tc.platform === 'Web');
  const mobile = file.testCases.filter((tc) => tc.platform === 'Mobile');

  const wb = new ExcelJS.Workbook();
  wb.creator = 'SnapWork QA';
  addCaseSheet(wb, 'Web', web);
  addCaseSheet(wb, 'Mobile', mobile);
  addSummary(wb, file);
  addTraceability(wb, file);

  mkdirSync(dirname(outputFile), { recursive: true });
  await wb.xlsx.writeFile(outputFile);

  const counts = (cases: TestCase[]): string =>
    EXECUTION_TYPES.map((t) => `${t}=${cases.filter((tc) => tc.executionType === t).length}`).join(' ');
  console.log(`Workbook: ${outputFile}`);
  console.log(`Total=${file.testCases.length} Web=${web.length} Mobile=${mobile.length}`);
  console.log(`Web: ${counts(web)}`);
  console.log(`Mobile: ${counts(mobile)}`);
  console.log(`Automation candidates (Web): ${web.filter(isCandidate).map((tc) => tc.testCaseId).join(', ')}`);
  console.log(`Automation candidates (Mobile): ${mobile.filter(isCandidate).map((tc) => tc.testCaseId).join(', ')}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
