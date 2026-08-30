import type { AppEnvironment } from '@/types';

import { summarizeIterations } from '../lib';
import type {
  InputField,
  Profile,
  ProfileInput,
  Run,
  RunEvent,
  RunHistoryQuery,
  RunIteration,
  RunStatus,
  RunStep,
  RunSummary,
  Scenario,
  ScenarioDetail,
  ScenarioKind,
  StartRunRequest,
  StartRunResponse,
  StepDef,
} from '../types';
import type { TestRunsApi } from './index';

const STEP_BASE_MS = 620;
const STEP_JITTER_MS = 900;
const START_DELAY_MS = 400;

let seq = 1;
const uid = (prefix: string): string =>
  `${prefix}_${Date.now().toString(36)}${(seq++).toString(36)}`;
const nowIso = (): string => new Date().toISOString();
const isoAgo = (minutes: number): string => new Date(Date.now() - minutes * 60_000).toISOString();
const orderNo = (): string => `SO-${Math.floor(10_000_000 + Math.random() * 89_999_999)}`;
const randInt = (min: number, max: number): number =>
  Math.floor(min + Math.random() * (max - min + 1));

interface MockStep extends StepDef {
  emit?: (variables: Record<string, unknown>) => Record<string, unknown>;
}

interface MockScenario {
  id: string;
  key: string;
  name: string;
  description: string;
  kind: ScenarioKind;
  inputs: InputField[];
  steps: MockStep[];
  bulk?: ScenarioDetail['bulk'];
}

const MOCK_SCENARIOS: MockScenario[] = [
  {
    id: 'scn_order_create',
    key: 'order-create',
    name: 'Sipariş Oluşturma',
    description: 'Tek bir siparişi uçtan uca oluşturur ve sistemde düştüğünü doğrular.',
    kind: 'generic',
    inputs: [
      {
        name: 'customerType',
        label: 'Müşteri',
        type: 'select',
        required: true,
        options: [
          { value: 'new', label: 'Yeni test müşterisi' },
          { value: 'existing', label: 'Var olan müşteri' },
        ],
        defaultValue: 'new',
      },
      {
        name: 'customerId',
        label: 'Müşteri no',
        type: 'string',
        required: false,
        placeholder: '1002453',
        help: 'Yalnızca “Var olan müşteri” seçildiğinde kullanılır.',
      },
      {
        name: 'productSku',
        label: 'Ürün SKU',
        type: 'string',
        required: true,
        placeholder: 'BOY-1234567',
      },
      { name: 'quantity', label: 'Adet', type: 'number', required: true, defaultValue: 1 },
      {
        name: 'paymentMethod',
        label: 'Ödeme yöntemi',
        type: 'select',
        required: true,
        options: [
          { value: 'creditCard', label: 'Kredi kartı (mock POS)' },
          { value: 'wallet', label: 'Cüzdan' },
          { value: 'transfer', label: 'Havale' },
        ],
        defaultValue: 'creditCard',
      },
      { name: 'couponCode', label: 'Kupon kodu', type: 'string', required: false },
      { name: 'note', label: 'Not', type: 'string', required: false },
    ],
    steps: [
      { key: 'prepare-customer', title: 'Test müşterisi ve sepet hazırlanır', kind: 'dbQuery' },
      { key: 'add-to-cart', title: 'Ürün sepete eklenir', kind: 'httpRequest' },
      {
        key: 'checkout',
        title: 'Ödeme (mock POS) ile sipariş oluşturulur',
        kind: 'httpRequest',
        emit: () => ({ orderNo: orderNo() }),
      },
      {
        key: 'verify-orchestrator',
        title: 'Order-orchestrator’da siparişin düştüğü doğrulanır',
        kind: 'poll',
      },
      {
        key: 'extract-result',
        title: 'Sipariş no ve durum çıktı olarak alınır',
        kind: 'extract',
        emit: (v) => ({ status: 'CREATED', orderNo: v['orderNo'] ?? orderNo() }),
      },
    ],
  },
  {
    id: 'scn_order_bulk',
    key: 'order-bulk',
    name: 'Toplu Sipariş Oluşturma',
    description: 'Aynı anda çok sayıda sipariş üretir (yük / kapsam testi).',
    kind: 'generic',
    bulk: { maxCount: 10, maxConcurrency: 5 },
    inputs: [
      {
        name: 'productSku',
        label: 'Ürün SKU',
        type: 'string',
        required: true,
        placeholder: 'BOY-1234567',
      },
      {
        name: 'quantityPerOrder',
        label: 'Sipariş başına adet',
        type: 'number',
        required: true,
        defaultValue: 1,
      },
      {
        name: 'customerPool',
        label: 'Müşteri havuzu',
        type: 'select',
        required: true,
        options: [
          { value: 'shared', label: 'Tek müşteri (paylaşımlı)' },
          { value: 'unique', label: 'Her sipariş için ayrı müşteri' },
        ],
        defaultValue: 'shared',
      },
      {
        name: 'paymentMethod',
        label: 'Ödeme yöntemi',
        type: 'select',
        required: true,
        options: [
          { value: 'creditCard', label: 'Kredi kartı (mock POS)' },
          { value: 'wallet', label: 'Cüzdan' },
        ],
        defaultValue: 'creditCard',
      },
    ],
    steps: [
      { key: 'prepare-pool', title: 'Müşteri havuzu ve ürün profili hazırlanır', kind: 'dbQuery' },
      { key: 'spawn-orders', title: 'N adet sipariş paralel oluşturulur', kind: 'httpRequest' },
      { key: 'collect-results', title: 'Başarılı / başarısız dağılımı toplanır', kind: 'extract' },
      { key: 'assert-distribution', title: 'Dağılım ve süre eşikleri doğrulanır', kind: 'assert' },
    ],
  },
  {
    id: 'scn_retail_invoice',
    key: 'retail-invoice',
    name: 'Retail Fatura Oluşturma',
    description: 'Boyner (retail) ürünleri için satış faturası kesme akışı.',
    kind: 'retail',
    inputs: [
      {
        name: 'orderNo',
        label: 'Sipariş no',
        type: 'string',
        required: true,
        placeholder: 'SO-40011234',
      },
      {
        name: 'invoiceType',
        label: 'Fatura tipi',
        type: 'select',
        required: true,
        options: [{ value: 'sales', label: 'Satış faturası' }],
        defaultValue: 'sales',
      },
      {
        name: 'sendEDocument',
        label: 'e-Belge gönderilsin',
        type: 'boolean',
        required: false,
        defaultValue: true,
      },
    ],
    steps: [
      { key: 'load-order', title: 'Faturalanacak retail siparişi yüklenir', kind: 'dbQuery' },
      {
        key: 'issue-invoice',
        title: 'Satış faturası kesme akışı tetiklenir',
        kind: 'soapRequest',
        emit: () => ({ invoiceNo: `FTR-${randInt(100000, 999999)}` }),
      },
      { key: 'poll-edocument', title: 'e-Belge durumu beklenir', kind: 'poll' },
      { key: 'assert-invoice', title: 'Fatura no ve e-belge durumu doğrulanır', kind: 'assert' },
    ],
  },
  {
    id: 'scn_retail_return_invoice',
    key: 'retail-return-invoice',
    name: 'Retail İade Faturası Oluşturma',
    description: 'Boyner (retail) ürünleri için iade faturası oluşturma akışı.',
    kind: 'retail',
    inputs: [
      {
        name: 'orderNo',
        label: 'Sipariş no',
        type: 'string',
        required: true,
        placeholder: 'SO-40011234',
      },
      {
        name: 'returnItems',
        label: 'İade kalemleri',
        type: 'string',
        required: true,
        placeholder: 'BOY-1234567:1, BOY-7654321:2',
        help: 'SKU:adet çiftleri, virgülle ayrılır.',
      },
      {
        name: 'reason',
        label: 'İade nedeni',
        type: 'select',
        required: true,
        options: [
          { value: 'customer', label: 'Müşteri vazgeçti' },
          { value: 'defect', label: 'Ürün kusurlu' },
          { value: 'wrongItem', label: 'Yanlış ürün' },
        ],
        defaultValue: 'customer',
      },
    ],
    steps: [
      { key: 'load-return', title: 'İadesi yapılacak sipariş / kalem yüklenir', kind: 'dbQuery' },
      {
        key: 'create-return-invoice',
        title: 'İade faturası oluşturma akışı tetiklenir',
        kind: 'soapRequest',
        emit: () => ({ returnInvoiceNo: `IAD-${randInt(100000, 999999)}` }),
      },
      { key: 'reconcile-amount', title: 'İade fatura tutar mutabakatı doğrulanır', kind: 'assert' },
      {
        key: 'extract-result',
        title: 'İade fatura no ve tutar çıktı olarak alınır',
        kind: 'extract',
      },
    ],
  },
  {
    id: 'scn_retail_shipment_advance',
    key: 'retail-shipment-advance',
    name: 'Retail Kargo Statüsü İlerletme',
    description: 'Retail siparişin kargo statüsünü hedef adıma kadar ilerletir.',
    kind: 'retail',
    inputs: [
      {
        name: 'orderNo',
        label: 'Sipariş no',
        type: 'string',
        required: true,
        placeholder: 'SO-40011234',
      },
      {
        name: 'targetStatus',
        label: 'Hedef statü',
        type: 'select',
        required: true,
        options: [
          { value: 'prepared', label: 'Hazırlandı' },
          { value: 'shipped', label: 'Kargoya verildi' },
          { value: 'inTransit', label: 'Yolda' },
          { value: 'delivered', label: 'Teslim edildi' },
        ],
        defaultValue: 'shipped',
      },
      {
        name: 'emitWebhooks',
        label: 'Webhook’lar tetiklensin',
        type: 'boolean',
        required: false,
        defaultValue: true,
      },
    ],
    steps: [
      {
        key: 'read-current-status',
        title: 'Siparişin mevcut kargo statüsü okunur',
        kind: 'dbQuery',
      },
      {
        key: 'advance-status',
        title: 'Hedef statüye kadar adımlar ilerletilir',
        kind: 'httpRequest',
        emit: (v) => ({ shipmentStatus: v['targetStatus'] ?? 'shipped' }),
      },
      {
        key: 'verify-events',
        title: 'Her adımda event / webhook tetiklendiği doğrulanır',
        kind: 'poll',
      },
      {
        key: 'assert-webhooks',
        title: 'Beklenen webhook’lar alındı mı doğrulanır',
        kind: 'assert',
      },
    ],
  },
  {
    id: 'scn_merchant_shipment_advance',
    key: 'merchant-shipment-advance',
    name: 'Merchant Kargo Statüsü İlerletme',
    description: '3. parti (merchant) satıcı siparişinin kargo statüsünü ilerletir.',
    kind: 'merchant',
    inputs: [
      { name: 'merchantOrderNo', label: 'Merchant sipariş no', type: 'string', required: true },
      { name: 'merchantId', label: 'Merchant no', type: 'string', required: true },
      {
        name: 'targetStatus',
        label: 'Hedef statü',
        type: 'select',
        required: true,
        options: [
          { value: 'approved', label: 'Onaylandı' },
          { value: 'shipped', label: 'Kargoya verildi' },
          { value: 'delivered', label: 'Teslim edildi' },
        ],
        defaultValue: 'shipped',
      },
      {
        name: 'merchantApiToken',
        label: 'Merchant API token',
        type: 'secret',
        required: false,
        help: 'Boş bırakılırsa ortamın varsayılan servis token’ı kullanılır.',
      },
    ],
    steps: [
      { key: 'resolve-merchant-order', title: '3. parti sipariş çözümlenir', kind: 'dbQuery' },
      {
        key: 'advance-merchant-status',
        title: 'Merchant kargo akışına göre statü ilerletilir',
        kind: 'httpRequest',
        emit: (v) => ({ shipmentStatus: v['targetStatus'] ?? 'shipped' }),
      },
      {
        key: 'verify-integration',
        title: 'Merchant entegrasyon adımları doğrulanır',
        kind: 'poll',
      },
      {
        key: 'assert-merchant-flow',
        title: 'Retail’den farklı merchant adımları doğrulanır',
        kind: 'assert',
      },
    ],
  },
];

type StoredProfile = Profile & { scenarioId: string };

const profiles: StoredProfile[] = [
  {
    id: 'prf_oc_happy_dev',
    scenarioId: 'scn_order_create',
    name: 'Standart kredi kartı — 1 adet',
    environment: 'dev',
    values: {
      customerType: 'new',
      productSku: 'BOY-1002345',
      quantity: 1,
      paymentMethod: 'creditCard',
    },
    updatedAt: isoAgo(2600),
  },
  {
    id: 'prf_oc_wallet_dev',
    scenarioId: 'scn_order_create',
    name: 'Cüzdan ödemeli — kuponlu',
    environment: 'dev',
    values: {
      customerType: 'existing',
      customerId: '1002453',
      productSku: 'BOY-1002345',
      quantity: 2,
      paymentMethod: 'wallet',
      couponCode: 'WELCOME10',
    },
    updatedAt: isoAgo(880),
  },
  {
    id: 'prf_oc_happy_preprod',
    scenarioId: 'scn_order_create',
    name: 'Preprod duman testi',
    environment: 'preprod',
    values: {
      customerType: 'new',
      productSku: 'BOY-9000001',
      quantity: 1,
      paymentMethod: 'creditCard',
    },
    updatedAt: isoAgo(140),
  },
  {
    id: 'prf_bulk_10x3_dev',
    scenarioId: 'scn_order_bulk',
    name: '10 sipariş — 3 eşzamanlı',
    environment: 'dev',
    values: {
      productSku: 'BOY-1002345',
      quantityPerOrder: 1,
      customerPool: 'shared',
      paymentMethod: 'creditCard',
    },
    updatedAt: isoAgo(410),
  },
  {
    id: 'prf_inv_sales_dev',
    scenarioId: 'scn_retail_invoice',
    name: 'Satış faturası — e-belge açık',
    environment: 'dev',
    values: { orderNo: 'SO-40011234', invoiceType: 'sales', sendEDocument: true },
    updatedAt: isoAgo(300),
  },
  {
    id: 'prf_ship_shipped_dev',
    scenarioId: 'scn_retail_shipment_advance',
    name: 'Kargoya verildi statüsüne',
    environment: 'dev',
    values: { orderNo: 'SO-40011234', targetStatus: 'shipped', emitWebhooks: true },
    updatedAt: isoAgo(75),
  },
  {
    id: 'prf_merchant_shipped_preprod',
    scenarioId: 'scn_merchant_shipment_advance',
    name: 'Merchant — kargoya verildi',
    environment: 'preprod',
    values: { merchantOrderNo: 'MRC-556677', merchantId: 'M-1042', targetStatus: 'shipped' },
    updatedAt: isoAgo(190),
  },
];

const runs = new Map<string, Run>();
const history: RunSummary[] = seedHistory();

function seedHistory(): RunSummary[] {
  const rows: Array<Omit<RunSummary, 'id'>> = [
    scenarioSummary('order-create', 'dev', 'passed', 34, 12_400, 'Standart kredi kartı — 1 adet'),
    scenarioSummary('order-create', 'dev', 'failed', 190, 9_800, 'Cüzdan ödemeli — kuponlu'),
    scenarioSummary(
      'retail-invoice',
      'dev',
      'passed',
      320,
      15_200,
      'Satış faturası — e-belge açık',
    ),
    scenarioSummary('order-bulk', 'dev', 'passed', 900, 41_000, '10 sipariş — 3 eşzamanlı', {
      count: 10,
      concurrency: 3,
    }),
    scenarioSummary(
      'retail-shipment-advance',
      'dev',
      'cancelled',
      1500,
      6_300,
      'Kargoya verildi statüsüne',
    ),
    scenarioSummary(
      'merchant-shipment-advance',
      'preprod',
      'passed',
      260,
      18_700,
      'Merchant — kargoya verildi',
    ),
    scenarioSummary('retail-return-invoice', 'dev', 'passed', 2600, 13_100),
    scenarioSummary('order-create', 'preprod', 'passed', 60, 11_900, 'Preprod duman testi'),
  ];
  return rows.map((row, index) => ({ id: `run_seed_${index}`, ...row }));
}

function scenarioSummary(
  key: string,
  environment: AppEnvironment,
  status: RunStatus,
  agoMin: number,
  durationMs: number,
  profileName?: string,
  repeat?: { count: number; concurrency: number },
): Omit<RunSummary, 'id'> {
  const scenario = MOCK_SCENARIOS.find((s) => s.key === key);
  const startedAt = isoAgo(agoMin);
  return {
    scenarioId: scenario?.id ?? key,
    scenarioKey: key,
    scenarioName: scenario?.name ?? key,
    kind: scenario?.kind ?? 'generic',
    environment,
    status,
    startedAt,
    finishedAt: new Date(new Date(startedAt).getTime() + durationMs).toISOString(),
    durationMs,
    triggeredBy: 'mock@boyner',
    ...(profileName ? { profileName } : {}),
    ...(repeat ? { repeat } : {}),
  };
}

function latency<T>(value: T, ms = 120): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function toScenario(scenario: MockScenario): Scenario {
  return {
    id: scenario.id,
    key: scenario.key,
    name: scenario.name,
    description: scenario.description,
    kind: scenario.kind,
    inputs: scenario.inputs.map((field) => ({ ...field })),
  };
}

function toScenarioDetail(scenario: MockScenario): ScenarioDetail {
  return {
    ...toScenario(scenario),
    steps: scenario.steps.map((step) => ({ key: step.key, title: step.title, kind: step.kind })),
    ...(scenario.bulk ? { bulk: scenario.bulk } : {}),
  };
}

function findScenario(idOrKey: string): MockScenario | undefined {
  return MOCK_SCENARIOS.find((s) => s.id === idOrKey || s.key === idOrKey);
}

function stripScenario(profile: StoredProfile): Profile {
  return {
    id: profile.id,
    name: profile.name,
    environment: profile.environment,
    values: profile.values,
    updatedAt: profile.updatedAt,
  };
}

function stepIo(step: MockStep, run: Run, emitted: Record<string, unknown>): Partial<RunStep> {
  const paramSample = pickParams(run.runParams, 4);
  switch (step.kind) {
    case 'httpRequest':
      return {
        request: { method: 'POST', url: `/internal/${step.key}`, body: paramSample },
        response: { status: 200, ok: true, ...emitted },
      };
    case 'soapRequest':
      return {
        request: { action: step.key, envelope: paramSample },
        response: { faultCode: null, ok: true, ...emitted },
      };
    case 'dbQuery':
      return {
        request: { query: `select * from ops.${step.key.replace(/-/g, '_')} where env = :env` },
        response: { rows: randInt(1, 3), ...emitted },
      };
    case 'poll':
      return {
        request: { target: step.key, intervalMs: 1000, maxAttempts: 5 },
        response: { settled: true, ...emitted },
      };
    case 'assert':
      return {
        response: { passed: true, checks: [`${step.key}: ok`], ...emitted },
      };
    case 'extract':
      return { response: { ...emitted } };
    default:
      return {};
  }
}

function pickParams(params: Record<string, unknown>, max: number): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === '' || value == null) continue;
    out[key] = key.toLowerCase().includes('token') ? '••••••' : value;
    if (Object.keys(out).length >= max) break;
  }
  return out;
}

function buildRun(request: StartRunRequest, env: AppEnvironment): Run {
  const scenario = findScenario(request.scenarioId);
  if (!scenario) throw new Error(`Senaryo bulunamadı: ${request.scenarioId}`);
  const profile = profiles.find((p) => p.id === request.profileId);
  const steps: RunStep[] = scenario.steps.map((step) => ({
    key: step.key,
    title: step.title,
    kind: step.kind,
    status: 'pending',
  }));
  return {
    id: uid('run'),
    scenarioId: scenario.id,
    scenarioKey: scenario.key,
    scenarioName: scenario.name,
    kind: scenario.kind,
    ...(profile ? { profileId: profile.id, profileName: profile.name } : {}),
    environment: env,
    status: 'queued',
    startedAt: nowIso(),
    triggeredBy: 'mock@boyner',
    runParams: { ...request.runParams },
    variables: {},
    steps,
    ...(request.repeat ? { repeat: request.repeat } : {}),
  };
}

function syncHistory(run: Run): void {
  const summary: RunSummary = {
    id: run.id,
    scenarioId: run.scenarioId,
    scenarioKey: run.scenarioKey,
    scenarioName: run.scenarioName,
    kind: run.kind,
    ...(run.profileId ? { profileId: run.profileId } : {}),
    ...(run.profileName ? { profileName: run.profileName } : {}),
    environment: run.environment,
    status: run.status,
    startedAt: run.startedAt,
    ...(run.finishedAt ? { finishedAt: run.finishedAt } : {}),
    ...(run.finishedAt
      ? { durationMs: new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime() }
      : {}),
    triggeredBy: run.triggeredBy,
    ...(run.repeat ? { repeat: run.repeat } : {}),
  };
  const index = history.findIndex((row) => row.id === run.id);
  if (index >= 0) history[index] = summary;
  else history.unshift(summary);
}

function synthesizeRun(runId: string): Run | undefined {
  const summary = history.find((row) => row.id === runId);
  if (!summary) return undefined;
  const scenario = findScenario(summary.scenarioId);
  const stepDefs = scenario?.steps ?? [];
  const failStepIndex = summary.status === 'failed' ? stepDefs.length - 1 : -1;

  const steps: RunStep[] = stepDefs.map((step, index) => {
    let status: RunStep['status'] = 'passed';
    if (summary.status === 'cancelled' && index >= Math.ceil(stepDefs.length / 2))
      status = 'skipped';
    else if (index === failStepIndex) status = 'failed';
    return {
      key: step.key,
      title: step.title,
      kind: step.kind,
      status,
      durationMs: status === 'skipped' ? undefined : randInt(500, 2600),
      ...(step.kind === 'poll' && status === 'passed' ? { attempts: randInt(2, 4) } : {}),
      ...(status === 'failed' ? { error: 'Beklenen yanıt alınamadı (mock geçmiş kaydı).' } : {}),
    };
  });

  const variables: Record<string, unknown> =
    summary.status === 'passed' ? { orderNo: orderNo(), status: 'CREATED' } : {};

  return {
    id: summary.id,
    scenarioId: summary.scenarioId,
    scenarioKey: summary.scenarioKey,
    scenarioName: summary.scenarioName,
    kind: summary.kind,
    ...(summary.profileId ? { profileId: summary.profileId } : {}),
    ...(summary.profileName ? { profileName: summary.profileName } : {}),
    environment: summary.environment,
    status: summary.status,
    startedAt: summary.startedAt,
    ...(summary.finishedAt ? { finishedAt: summary.finishedAt } : {}),
    triggeredBy: summary.triggeredBy ?? 'mock@boyner',
    runParams: {},
    variables,
    steps,
    ...(summary.repeat ? { repeat: summary.repeat } : {}),
  };
}

function buildIterations(run: Run): RunIteration[] {
  const count = run.repeat?.count ?? 1;
  return Array.from({ length: count }, (_unused, index) => {
    const failed = index > 0 && index % 7 === 0;
    return {
      index: index + 1,
      status: failed ? 'failed' : 'passed',
      durationMs: randInt(2200, 9200),
      ...(failed ? { error: 'mock POS zaman aşımı' } : { orderNo: orderNo() }),
    } satisfies RunIteration;
  });
}

export const mockTestRunsApi: TestRunsApi = {
  listScenarios() {
    return latency(MOCK_SCENARIOS.map(toScenario));
  },

  getScenario(_env, idOrKey) {
    const scenario = findScenario(idOrKey);
    if (!scenario) return Promise.reject(new Error(`Senaryo bulunamadı: ${idOrKey}`));
    return latency(toScenarioDetail(scenario));
  },

  listProfiles(env, scenarioId) {
    const scenario = findScenario(scenarioId);
    const list = profiles
      .filter((p) => p.scenarioId === (scenario?.id ?? scenarioId) && p.environment === env)
      .map(stripScenario)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return latency(list);
  },

  saveProfile(env, scenarioId, input: ProfileInput, profileId) {
    const scenario = findScenario(scenarioId);
    const resolvedScenarioId = scenario?.id ?? scenarioId;
    if (profileId) {
      const existing = profiles.find((p) => p.id === profileId);
      if (!existing) return Promise.reject(new Error('Profil bulunamadı'));
      existing.name = input.name;
      existing.values = { ...input.values };
      existing.updatedAt = nowIso();
      return latency(stripScenario(existing));
    }
    const created: StoredProfile = {
      id: uid('prf'),
      scenarioId: resolvedScenarioId,
      name: input.name,
      environment: env,
      values: { ...input.values },
      updatedAt: nowIso(),
    };
    profiles.unshift(created);
    return latency(stripScenario(created));
  },

  deleteProfile(_env, _scenarioId, profileId) {
    const index = profiles.findIndex((p) => p.id === profileId);
    if (index >= 0) profiles.splice(index, 1);
    return latency(undefined);
  },

  startRun(env, request): Promise<StartRunResponse> {
    const run = buildRun(request, env);
    runs.set(run.id, run);
    syncHistory(run);
    return latency({ runId: run.id }, 220);
  },

  listRuns(env, query: RunHistoryQuery) {
    const fromTs = query.from ? new Date(query.from).getTime() : undefined;
    const toTs = query.to ? new Date(query.to).getTime() + 86_399_000 : undefined;
    const list = history
      .filter((row) => row.environment === env)
      .filter((row) => !query.scenarioId || row.scenarioId === query.scenarioId)
      .filter((row) => !query.status || row.status === query.status)
      .filter((row) => fromTs == null || new Date(row.startedAt).getTime() >= fromTs)
      .filter((row) => toTs == null || new Date(row.startedAt).getTime() <= toTs)
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
    return latency(list);
  },

  getRun(_env, runId) {
    const run = runs.get(runId) ?? synthesizeRun(runId);
    if (!run) return Promise.reject(new Error(`Koşum bulunamadı: ${runId}`));
    return latency(structuredClone(run));
  },

  cancelRun(_env, runId) {
    const run = runs.get(runId);
    if (run && (run.status === 'queued' || run.status === 'running')) {
      run.status = 'cancelled';
    }
    return latency(undefined);
  },

  subscribeRunEvents(_env, runId, onEvent: (event: RunEvent) => void) {
    const run = runs.get(runId);
    if (!run) return () => undefined;

    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        timers.push(setTimeout(resolve, ms));
      });

    const scenario = findScenario(run.scenarioId);
    const stopped = () => run.status === 'cancelled';

    const drive = async (): Promise<void> => {
      await wait(START_DELAY_MS);
      if (cancelled) return;
      if (run.status === 'queued') run.status = 'running';

      for (let i = 0; i < run.steps.length; i++) {
        const step = run.steps[i];
        const mockStep = scenario?.steps[i];
        if (!step || cancelled) return;
        if (stopped()) break;

        step.status = 'running';
        step.startedAt = nowIso();
        onEvent({ type: 'step-started', stepKey: step.key, at: step.startedAt });

        const duration = STEP_BASE_MS + Math.round(Math.random() * STEP_JITTER_MS);
        await wait(duration);
        if (cancelled) return;
        if (stopped()) break;

        const emitted = mockStep?.emit ? mockStep.emit(run.variables) : {};
        Object.assign(run.variables, emitted);
        const io = stepIo(mockStep ?? step, run, emitted);
        step.status = 'passed';
        step.finishedAt = nowIso();
        step.durationMs = duration;
        if (step.kind === 'poll') step.attempts = randInt(2, 4);
        if (io.request !== undefined) step.request = io.request;
        if (io.response !== undefined) step.response = io.response;

        onEvent({
          type: 'step-finished',
          stepKey: step.key,
          status: 'passed',
          at: step.finishedAt,
          durationMs: duration,
          ...(step.attempts != null ? { attempts: step.attempts } : {}),
        });
      }

      if (cancelled) return;

      if (stopped()) {
        for (const step of run.steps) {
          if (step.status === 'pending' || step.status === 'running') step.status = 'skipped';
        }
        run.finishedAt = nowIso();
        syncHistory(run);
        onEvent({ type: 'run-finished', status: 'cancelled', at: run.finishedAt });
        return;
      }

      if (run.repeat) {
        run.iterations = buildIterations(run);
        run.summary = summarizeIterations(run.iterations);
        run.variables['orderNos'] = run.summary.orderNos;
        run.status = run.summary.failed > 0 ? 'failed' : 'passed';
      } else {
        run.status = 'passed';
      }
      run.finishedAt = nowIso();
      syncHistory(run);
      onEvent({
        type: 'run-finished',
        status: run.status,
        at: run.finishedAt,
        ...(run.summary ? { summary: run.summary } : {}),
      });
    };

    void drive();

    return () => {
      cancelled = true;
      for (const timer of timers) clearTimeout(timer);
    };
  },
};
