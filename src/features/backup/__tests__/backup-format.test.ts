import {
  backupFileName,
  buildBackup,
  parseBackup,
  BACKUP_SCHEMA_VERSION,
  type BackupData,
} from '../backup-format';

const T = new Date(2026, 10, 5, 9).getTime();

const sample = (): BackupData => ({
  profile: {
    id: 1,
    name: 'Valentina',
    incomeType: 'mesada',
    incomeRange: '500k-1m',
    monthlyIncomeEstimate: 750000,
    diagnostic: { sabeGasto: 'masomenos' },
    detectionConsent: false,
    themePreference: 'system',
    onboardingDone: true,
    createdAt: T,
  },
  categories: [
    {
      id: 1,
      slug: 'cafe',
      name: 'Tinto y café',
      icon: 'cafe',
      kind: 'expense',
      isHormiga: true,
      sortOrder: 0,
      archived: false,
    },
  ],
  transactions: [
    {
      id: 10,
      type: 'expense',
      amount: 2500,
      categoryId: 1,
      note: null,
      merchant: null,
      bank: null,
      occurredAt: T,
      source: 'shortcut',
      createdAt: T,
    },
  ],
  shortcuts: [{ id: 3, label: 'Tinto', icon: 'cafe', amount: 2500, categoryId: 1, sortOrder: 0 }],
  goals: [
    {
      id: 2,
      name: 'Portátil',
      targetAmount: 2_000_000,
      targetDate: null,
      createdAt: T,
      completedAt: null,
      archived: false,
    },
  ],
  goalContributions: [
    { id: 5, goalId: 2, amount: 50000, note: null, fromSavings: false, createdAt: T },
  ],
  budgets: [{ id: 7, categoryId: 1, limitAmount: 60000, createdAt: T }],
  lessonCompletions: [{ id: 1, lessonId: 'gastos-hormiga', score: 2, total: 2, completedAt: T }],
});

const NOW = new Date(2026, 10, 5, 10);

describe('respaldo', () => {
  it('ida y vuelta: lo que se exporta se puede importar idéntico', () => {
    const backup = buildBackup(sample(), NOW);
    const parsed = parseBackup(JSON.stringify(backup));
    expect(parsed).toEqual({ ok: true, backup });
  });

  it('nombra el archivo con la fecha', () => {
    expect(backupFileName(NOW)).toBe('bolsillo-respaldo-2026-11-05.json');
  });

  it('rechaza texto que no es JSON', () => {
    expect(parseBackup('hola')).toEqual({ ok: false, error: 'El archivo no es un JSON válido.' });
  });

  it('rechaza archivos de otras apps', () => {
    const r = parseBackup(JSON.stringify({ app: 'otra', data: {} }));
    expect(r).toEqual({ ok: false, error: 'Este archivo no es un respaldo de BOLSILLO.' });
  });

  it('rechaza respaldos de una versión futura con un mensaje claro', () => {
    const b = { ...buildBackup(sample(), NOW), schemaVersion: BACKUP_SCHEMA_VERSION + 1 };
    const r = parseBackup(JSON.stringify(b));
    expect(r.ok).toBe(false);
    expect(!r.ok && r.error).toMatch(/versión más nueva/);
  });

  it('rechaza montos con decimales', () => {
    const data = sample();
    data.transactions[0]!.amount = 2500.5;
    const r = parseBackup(JSON.stringify(buildBackup(data, NOW)));
    expect(r.ok).toBe(false);
  });

  it('rechaza referencias rotas (movimiento con categoría inexistente)', () => {
    const data = sample();
    data.transactions[0]!.categoryId = 99;
    const r = parseBackup(JSON.stringify(buildBackup(data, NOW)));
    expect(r).toEqual({
      ok: false,
      error: 'El respaldo está incompleto: hay datos que apuntan a otros que no existen.',
    });
  });

  it('rechaza aportes a Apartados inexistentes', () => {
    const data = sample();
    data.goalContributions[0]!.goalId = 42;
    expect(parseBackup(JSON.stringify(buildBackup(data, NOW))).ok).toBe(false);
  });

  it('lee respaldos v1 (antes de los topes) con topes vacíos', () => {
    const { budgets: _omit, lessonCompletions: _omit2, ...v1Data } = sample();
    const v1 = { ...buildBackup(sample(), NOW), schemaVersion: 1, data: v1Data };
    const r = parseBackup(JSON.stringify(v1));
    expect(r.ok && r.backup.data.budgets).toEqual([]);
  });

  it('rechaza topes de categorías inexistentes o repetidos', () => {
    const missing = sample();
    missing.budgets[0]!.categoryId = 99;
    expect(parseBackup(JSON.stringify(buildBackup(missing, NOW))).ok).toBe(false);
    const dup = sample();
    dup.budgets.push({ id: 8, categoryId: 1, limitAmount: 1000, createdAt: T });
    expect(parseBackup(JSON.stringify(buildBackup(dup, NOW))).ok).toBe(false);
  });
});
