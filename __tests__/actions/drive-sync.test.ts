import { describe, it, expect, vi } from 'vitest';
import { syncSurveyToUserDrive } from '@/lib/drive-sync';
import { getSheetsClient, getDriveClient } from '@/lib/google-auth';

vi.mock('@/lib/google-auth', () => ({
  getSheetsClient: vi.fn(),
  getDriveClient: vi.fn(),
}));

vi.mock('@/lib/drive-utils', () => ({
  ensureFolder: vi.fn().mockResolvedValue('folder-id'),
  createSpreadsheet: vi.fn().mockResolvedValue({ id: 'sheet-id' }),
  getOrCreateSpreadsheet: vi.fn().mockResolvedValue({ id: 'sheet-id' }),
  getStandardFolderWithHealing: vi.fn().mockResolvedValue('folder-id'),
  syncDataToSheet: vi.fn().mockResolvedValue({ success: true }),
  appendDataToSheet: vi.fn().mockResolvedValue({ success: true }),
  DRIVE_FOLDERS: {
    CADASTRO: '1.Cadastro',
    SURVEYS: '2.Surveys',
    FINANCEIRO: '3.Financeiro'
  },
  LEGACY_FOLDERS: {
    CADASTRO: ['Cadastro'],
    SURVEYS: ['Surveys'],
    FINANCEIRO: ['Financeiro']
  }
}));

/**
 * ATUALIZADO no BUG-110. Este teste afirmava que a resposta de survey ia para o
 * Drive via `syncDataToSheet` — que APAGA a aba antes de escrever. Ele estava
 * certo sobre o codigo da epoca e passou a estar errado sobre a REGRA: por
 * decisao da Gestora (2026-07-20), toda resposta de survey acumula historico,
 * porque o Drive e a estrategia de backup independente da plataforma.
 *
 * O teste falhou no momento certo e por motivo certo (Licao 22) — a mudanca aqui
 * e de contrato deliberada, nao conserto de teste para ficar verde.
 */
describe('Drive Sync Helper 🛰️', () => {
  it('anexa a resposta do survey, preservando o historico', async () => {
    const mockSheets = {};
    const mockDrive = {};

    vi.mocked(getSheetsClient).mockResolvedValue(mockSheets as never);
    vi.mocked(getDriveClient).mockResolvedValue(mockDrive as never);

    const config = {
      matricula: 'BP-001-PF-260418',
      surveyTitle: 'Welcome',
      headers: ['Matricula', 'Status'],
      rowData: ['BP-001-PF-260418', 'Done'],
    };

    const { appendDataToSheet, syncDataToSheet } = await import('@/lib/drive-utils');

    await syncSurveyToUserDrive(config);

    // Anexa UMA linha (nao um array de linhas, como fazia o snapshot).
    expect(appendDataToSheet).toHaveBeenCalledWith(
      mockSheets,
      'sheet-id',
      ['Matricula', 'Status'],
      ['BP-001-PF-260418', 'Done']
    );

    // E, sobretudo, NAO apaga a aba: era isso que esvaziava o backup.
    expect(syncDataToSheet).not.toHaveBeenCalled();
  });
});
