import { VerifactuXmlBuilder } from './verifactu-xml.builder';

describe('VerifactuXmlBuilder', () => {
  const builder = new VerifactuXmlBuilder();

  it('builds RegistroAlta XML with encadenamiento primer registro', () => {
    const xml = builder.buildRegistroAlta({
      idEmisorFactura: 'B12345678',
      numSerieFactura: 'FAC-1',
      fechaExpedicionFactura: '13-09-2024',
      tipoFactura: 'F1',
      descripcionOperacion: 'Venta',
      cuotaTotal: '21.00',
      importeTotal: '121.00',
      huella: 'ABC',
      huellaAnterior: null,
      fechaHoraHusoGenRegistro: '2024-09-13T19:20:30+02:00',
      nombreRazonEmisor: 'Demo SL',
      desglose: [
        {
          impuesto: '01',
          claveRegimen: '01',
          calificacionOperacion: 'S1',
          tipoImpositivo: '21.00',
          baseImponibleOimporteNoSujeto: '100.00',
          cuotaRepercutida: '21.00',
        },
      ],
      destinatario: { nif: '12345678Z', nombreRazon: 'Cliente' },
    });

    expect(xml).toContain('<RegistroAlta>');
    expect(xml).toContain('<PrimerRegistro>S</PrimerRegistro>');
    expect(xml).toContain('<NumSerieFactura>FAC-1</NumSerieFactura>');
    expect(xml).toContain('<Huella>ABC</Huella>');
    expect(xml).toContain('<NombreSistemaInformatico>Domo</NombreSistemaInformatico>');
  });

  it('escapes XML special characters', () => {
    const xml = builder.buildRegistroAnulacion({
      idEmisorFactura: 'B1',
      numSerieFactura: 'A&B',
      fechaExpedicionFactura: '01-01-2026',
      huella: 'HH',
      huellaAnterior: 'PREV',
      fechaHoraHusoGenRegistro: '2026-01-01T12:00:00+01:00',
    });
    expect(xml).toContain('A&amp;B');
    expect(xml).toContain('<RegistroAnterior>');
  });
});
