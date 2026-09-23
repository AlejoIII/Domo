import {
  buildAltaHashPayload,
  computeAltaHuella,
  computeAnulacionHuella,
  formatFechaExpedicion,
  formatMoneyForHash,
  sha256Hex,
} from './verifactu-hash';

describe('verifactu-hash', () => {
  it('formats money with two decimals', () => {
    expect(formatMoneyForHash(12.3)).toBe('12.30');
    expect(formatMoneyForHash('121')).toBe('121.00');
  });

  it('formats expedition date as DD-MM-YYYY in UTC', () => {
    expect(formatFechaExpedicion(new Date('2024-09-13T10:00:00Z'))).toBe('13-09-2024');
  });

  it('builds alta payload in AEAT field order', () => {
    const payload = buildAltaHashPayload({
      idEmisorFactura: 'A00000000',
      numSerieFactura: 'FAC-20240913-0001',
      fechaExpedicionFactura: '13-09-2024',
      tipoFactura: 'F1',
      cuotaTotal: '21.00',
      importeTotal: '121.00',
      huellaAnterior: '',
      fechaHoraHusoGenRegistro: '2024-09-13T19:20:30+02:00',
    });

    expect(payload).toBe(
      'IDEmisorFactura=A00000000&NumSerieFactura=FAC-20240913-0001&FechaExpedicionFactura=13-09-2024&TipoFactura=F1&CuotaTotal=21.00&ImporteTotal=121.00&Huella=&FechaHoraHusoGenRegistro=2024-09-13T19:20:30+02:00',
    );
  });

  it('computes deterministic SHA-256 huella (uppercase hex)', () => {
    const input = {
      idEmisorFactura: 'A00000000',
      numSerieFactura: 'FAC-20240913-0001',
      fechaExpedicionFactura: '13-09-2024',
      tipoFactura: 'F1',
      cuotaTotal: '21.00',
      importeTotal: '121.00',
      huellaAnterior: '',
      fechaHoraHusoGenRegistro: '2024-09-13T19:20:30+02:00',
    };
    const huella = computeAltaHuella(input);
    expect(huella).toHaveLength(64);
    expect(huella).toBe(sha256Hex(buildAltaHashPayload(input)));
    expect(huella).toBe(computeAltaHuella(input));
  });

  it('chains anulacion with previous huella', () => {
    const prev = computeAltaHuella({
      idEmisorFactura: 'A00000000',
      numSerieFactura: 'FAC-1',
      fechaExpedicionFactura: '13-09-2024',
      tipoFactura: 'F1',
      cuotaTotal: '21.00',
      importeTotal: '121.00',
      huellaAnterior: '',
      fechaHoraHusoGenRegistro: '2024-09-13T19:20:30+02:00',
    });

    const next = computeAnulacionHuella({
      idEmisorFactura: 'A00000000',
      numSerieFactura: 'FAC-1',
      fechaExpedicionFactura: '13-09-2024',
      huellaAnterior: prev,
      fechaHoraHusoGenRegistro: '2024-09-14T10:00:00+02:00',
    });

    expect(next).toHaveLength(64);
    expect(next).not.toBe(prev);
  });
});
