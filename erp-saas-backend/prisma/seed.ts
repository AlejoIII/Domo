import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PGCE_DEFAULT_ACCOUNTS, ACCOUNT_CODES } from '../src/modules/accounting/pgce-defaults';

const prisma = new PrismaClient();

const DEMO_EMAIL = 'admin@demo.com';
const DEMO_PASSWORD = 'admin123';
const VENTAS_EMAIL = 'ventas@demo.com';
const VENTAS_PASSWORD = 'ventas123';

/** IDs fijos para datos demo — sobreviven a re-seeds sin romper URLs en caché */
const DEMO_IDS = {
  client1: 'a1111111-1111-4111-8111-111111111101',
  client2: 'a1111111-1111-4111-8111-111111111102',
  product1: 'b2222222-2222-4222-8222-222222222201',
  product2: 'b2222222-2222-4222-8222-222222222202',
  product3: 'b2222222-2222-4222-8222-222222222203',
  product4: 'b2222222-2222-4222-8222-222222222204',
  warehouse: 'c3333333-3333-4333-8333-333333333301',
  quote: 'd4444444-4444-4444-8444-444444444401',
  order1: 'e5555555-5555-4555-8555-555555555501',
  order2: 'e5555555-5555-4555-8555-555555555502',
  invoice1: '735c864c-879a-4145-979e-1ed3a7598007',
  invoice2: 'f6666666-6666-4666-8666-666666666602',
  purchaseOrder: '07777777-7777-4777-8777-777777777701',
} as const;

const ALL_PERMISSIONS = [
  'users.read', 'users.write',
  'clients.read', 'clients.write',
  'products.read', 'products.write',
  'orders.read', 'orders.write',
  'invoices.read', 'invoices.write',
  'quotes.read', 'quotes.write',
  'suppliers.read', 'suppliers.write',
  'employees.read', 'employees.write',
  'settings.read', 'settings.write',
  'settings.billing',
  'api.manage',
  'reports.read',
  'accounting.read',
  'accounting.write',
  'treasury.read',
  'treasury.write',
  'crm.read',
  'crm.write',
  'projects.read',
  'projects.write',
  'manufacturing.read',
  'manufacturing.write',
];

async function clearCompanyData(companyId: string) {
  await prisma.manufacturingOrder.deleteMany({ where: { companyId } });
  await prisma.bomLine.deleteMany({ where: { bom: { companyId } } });
  await prisma.bom.deleteMany({ where: { companyId } });
  await prisma.timeEntry.deleteMany({ where: { companyId } });
  await prisma.project.deleteMany({ where: { companyId } });
  await prisma.crmActivity.deleteMany({ where: { companyId } });
  await prisma.crmOpportunity.deleteMany({ where: { companyId } });
  await prisma.crmLead.deleteMany({ where: { companyId } });
  await prisma.crmStage.deleteMany({ where: { companyId } });
  await prisma.bankMovement.deleteMany({ where: { companyId } });
  await prisma.bankAccount.deleteMany({ where: { companyId } });
  await prisma.journalLine.deleteMany({ where: { entry: { companyId } } });
  await prisma.journalEntry.deleteMany({ where: { companyId } });
  await prisma.account.deleteMany({ where: { companyId } });
  await prisma.entityCustomFieldData.deleteMany({ where: { companyId } });
  await prisma.formLayout.deleteMany({ where: { companyId } });
  await prisma.payment.deleteMany({ where: { companyId } });
  await prisma.invoiceLine.deleteMany({ where: { invoice: { companyId } } });
  await prisma.invoice.deleteMany({ where: { companyId } });
  await prisma.salesOrderLine.deleteMany({ where: { order: { companyId } } });
  await prisma.salesOrder.deleteMany({ where: { companyId } });
  await prisma.quoteLine.deleteMany({ where: { quote: { companyId } } });
  await prisma.quote.deleteMany({ where: { companyId } });
  await prisma.purchaseOrderLine.deleteMany({ where: { purchaseOrder: { companyId } } });
  await prisma.purchaseOrder.deleteMany({ where: { companyId } });
  await prisma.warehouseStock.deleteMany({ where: { warehouse: { companyId } } });
  await prisma.stockMovement.deleteMany({ where: { companyId } });
  await prisma.warehouse.deleteMany({ where: { companyId } });
  await prisma.product.deleteMany({ where: { companyId } });
  await prisma.category.deleteMany({ where: { companyId } });
  await prisma.client.deleteMany({ where: { companyId } });
  await prisma.supplier.deleteMany({ where: { companyId } });
  await prisma.employee.deleteMany({ where: { companyId } });
}

async function seedPlans() {
  const plans = [
    {
      code: 'free',
      name: 'Free',
      maxUsers: 3,
      maxDocuments: 50,
      sortOrder: 0,
      stripePriceId: null,
      features: {
        reports: false,
        api: false,
        attachments: true,
        accounting: false,
        crm: false,
        treasury: false,
        projects: false,
        manufacturing: false,
        hr: false,
        webhooks: false,
        appearance: false,
        ads: true,
        pdfWatermark: true,
      },
    },
    {
      code: 'pro',
      name: 'Premium',
      maxUsers: 20,
      maxDocuments: 500,
      sortOrder: 1,
      stripePriceId: process.env.STRIPE_PRICE_PRO && !process.env.STRIPE_PRICE_PRO.includes('...')
        ? process.env.STRIPE_PRICE_PRO
        : null,
      features: {
        reports: true,
        api: false,
        attachments: true,
        accounting: true,
        crm: true,
        treasury: true,
        projects: false,
        manufacturing: false,
        hr: true,
        webhooks: true,
        appearance: true,
        ads: false,
        pdfWatermark: false,
      },
    },
    {
      code: 'enterprise',
      name: 'Enterprise',
      maxUsers: 999,
      maxDocuments: null,
      sortOrder: 2,
      stripePriceId: process.env.STRIPE_PRICE_ENTERPRISE && !process.env.STRIPE_PRICE_ENTERPRISE.includes('...')
        ? process.env.STRIPE_PRICE_ENTERPRISE
        : null,
      features: {
        reports: true,
        api: true,
        attachments: true,
        accounting: true,
        crm: true,
        treasury: true,
        projects: true,
        manufacturing: true,
        hr: true,
        webhooks: true,
        appearance: true,
        ads: false,
        pdfWatermark: false,
      },
    },
  ];

  const result: Record<string, { id: string }> = {};
  for (const plan of plans) {
    const row = await prisma.plan.upsert({
      where: { code: plan.code },
      update: {
        name: plan.name,
        maxUsers: plan.maxUsers,
        maxDocuments: plan.maxDocuments,
        features: plan.features,
        sortOrder: plan.sortOrder,
        stripePriceId: plan.stripePriceId,
      },
      create: plan,
    });
    result[plan.code] = row;
  }
  return result;
}

async function main() {
  const plans = await seedPlans();
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const company = await prisma.company.upsert({
    where: { slug: 'domo-demo' },
    update: {
      name: 'Domo Demo',
      taxId: 'B12345678',
      email: 'contacto@domodemo.es',
      phone: '912345678',
      address: 'Calle Mayor 1',
      city: 'Madrid',
      postalCode: '28013',
      country: 'ES',
      defaultTaxRate: 21,
      currency: 'EUR',
      planId: plans.enterprise.id,
      subscriptionStatus: 'active',
      onboardingCompleted: true,
    },
    create: {
      name: 'Domo Demo',
      slug: 'domo-demo',
      taxId: 'B12345678',
      email: 'contacto@domodemo.es',
      phone: '912345678',
      address: 'Calle Mayor 1',
      city: 'Madrid',
      postalCode: '28013',
      country: 'ES',
      defaultTaxRate: 21,
      currency: 'EUR',
      isActive: true,
      planId: plans.enterprise.id,
      subscriptionStatus: 'active',
      onboardingCompleted: true,
    },
  });

  const permissions = await Promise.all(
    ALL_PERMISSIONS.map((name) =>
      prisma.permission.upsert({
        where: { name },
        update: {},
        create: { name, description: name },
      }),
    ),
  );

  const adminRole = await prisma.role.upsert({
    where: { companyId_name: { companyId: company.id, name: 'admin' } },
    update: { description: 'Administrador' },
    create: {
      name: 'admin',
      description: 'Administrador',
      companyId: company.id,
    },
  });

  const salesRole = await prisma.role.upsert({
    where: { companyId_name: { companyId: company.id, name: 'ventas' } },
    update: { description: 'Equipo de ventas' },
    create: {
      name: 'ventas',
      description: 'Equipo de ventas',
      companyId: company.id,
    },
  });

  await prisma.rolePermission.deleteMany({
    where: { roleId: { in: [adminRole.id, salesRole.id] } },
  });
  await prisma.rolePermission.createMany({
    data: [
      ...permissions.map((p) => ({ roleId: adminRole.id, permissionId: p.id })),
      ...permissions
        .filter((p) =>
          ['clients', 'orders', 'quotes', 'products', 'reports'].some((m) =>
            p.name.startsWith(m),
          ),
        )
        .map((p) => ({ roleId: salesRole.id, permissionId: p.id })),
    ],
    skipDuplicates: true,
  });

  const platformAdmin = process.env.PLATFORM_ADMIN_ENABLED === 'true';

  const adminUser = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {
      password: passwordHash,
      firstName: 'Admin',
      lastName: 'Domo',
      isActive: true,
      emailVerified: true,
      companyId: company.id,
      roleId: adminRole.id,
      isPlatformAdmin: platformAdmin,
    },
    create: {
      email: DEMO_EMAIL,
      password: passwordHash,
      firstName: 'Admin',
      lastName: 'Domo',
      isActive: true,
      emailVerified: true,
      companyId: company.id,
      roleId: adminRole.id,
      isPlatformAdmin: platformAdmin,
    },
  });

  const ventasPasswordHash = await bcrypt.hash(VENTAS_PASSWORD, 10);
  await prisma.user.upsert({
    where: { email: VENTAS_EMAIL },
    update: {
      password: ventasPasswordHash,
      firstName: 'Ana',
      lastName: 'Ventas',
      isActive: true,
      emailVerified: true,
      companyId: company.id,
      roleId: salesRole.id,
    },
    create: {
      email: VENTAS_EMAIL,
      password: ventasPasswordHash,
      firstName: 'Ana',
      lastName: 'Ventas',
      isActive: true,
      emailVerified: true,
      companyId: company.id,
      roleId: salesRole.id,
    },
  });

  await clearCompanyData(company.id);

  const [catOficina, catInformatica] = await Promise.all([
    prisma.category.create({
      data: { companyId: company.id, name: 'Oficina', description: 'Material de oficina' },
    }),
    prisma.category.create({
      data: { companyId: company.id, name: 'Informática', description: 'Hardware y consumibles' },
    }),
  ]);

  const [p1, p2, p3, p4] = await Promise.all([
    prisma.product.create({
      data: {
        id: DEMO_IDS.product1,
        companyId: company.id,
        code: 'PAP-A4',
        name: 'Pack papel A4 500h',
        category: 'Oficina',
        categoryId: catOficina.id,
        price: 4.5,
        cost: 2.1,
        stock: 80,
        minStock: 20,
        unit: 'ud',
      },
    }),
    prisma.product.create({
      data: {
        id: DEMO_IDS.product2,
        companyId: company.id,
        code: 'TEC-RAT',
        name: 'Ratón inalámbrico',
        category: 'Informática',
        categoryId: catInformatica.id,
        price: 19.9,
        cost: 9.5,
        stock: 30,
        minStock: 35,
        unit: 'ud',
      },
    }),
    prisma.product.create({
      data: {
        id: DEMO_IDS.product3,
        companyId: company.id,
        code: 'TEC-TEC',
        name: 'Teclado USB',
        category: 'Informática',
        categoryId: catInformatica.id,
        price: 24.5,
        cost: 11,
        stock: 20,
        minStock: 5,
        unit: 'ud',
      },
    }),
    prisma.product.create({
      data: {
        id: DEMO_IDS.product4,
        companyId: company.id,
        code: 'KIT-INFO',
        name: 'Kit informática básica',
        category: 'Informática',
        categoryId: catInformatica.id,
        price: 39.9,
        cost: 20.5,
        stock: 0,
        minStock: 0,
        unit: 'ud',
      },
    }),
  ]);

  const [c1, c2] = await Promise.all([
    prisma.client.create({
      data: {
        id: DEMO_IDS.client1,
        companyId: company.id,
        name: 'Acme Corp',
        email: 'compras@acme.es',
        phone: '600111222',
        taxId: 'A11111111',
        city: 'Barcelona',
        address: 'Av. Diagonal 100',
        postalCode: '08018',
        country: 'ES',
      },
    }),
    prisma.client.create({
      data: {
        id: DEMO_IDS.client2,
        companyId: company.id,
        name: 'Beta SL',
        email: 'admin@betasl.es',
        phone: '600333444',
        taxId: 'B22222222',
        city: 'Valencia',
        country: 'ES',
      },
    }),
  ]);

  const [s1] = await Promise.all([
    prisma.supplier.create({
      data: {
        companyId: company.id,
        name: 'Suministros Norte',
        email: 'pedidos@sumnorte.es',
        phone: '943000111',
        taxId: 'B33333333',
        city: 'Bilbao',
        country: 'ES',
      },
    }),
    prisma.supplier.create({
      data: {
        companyId: company.id,
        name: 'Tech Distribuidores',
        email: 'ventas@techdist.es',
        phone: '916000222',
        taxId: 'B44444444',
        city: 'Madrid',
        country: 'ES',
      },
    }),
  ]);

  const wh = await prisma.warehouse.create({
    data: {
      id: DEMO_IDS.warehouse,
      companyId: company.id,
      code: 'MAD-01',
      name: 'Almacén Madrid',
      city: 'Madrid',
      address: 'Polígono Sur 5',
    },
  });

  await prisma.company.update({
    where: { id: company.id },
    data: { defaultWarehouseId: wh.id },
  });

  await prisma.warehouseStock.createMany({
    data: [
      { warehouseId: wh.id, productId: p1.id, quantity: 70 },
      { warehouseId: wh.id, productId: p2.id, quantity: 27 },
      { warehouseId: wh.id, productId: p3.id, quantity: 22 },
      { warehouseId: wh.id, productId: p4.id, quantity: 0 },
    ],
  });

  await prisma.product.update({ where: { id: p1.id }, data: { stock: 70 } });
  await prisma.product.update({ where: { id: p2.id }, data: { stock: 27 } });
  await prisma.product.update({ where: { id: p3.id }, data: { stock: 22 } });

  await Promise.all([
    prisma.employee.create({
      data: {
        companyId: company.id,
        firstName: 'Laura',
        lastName: 'García',
        email: 'laura@domodemo.es',
        jobTitle: 'Comercial',
        department: 'Ventas',
        hireDate: new Date('2024-03-01'),
      },
    }),
    prisma.employee.create({
      data: {
        companyId: company.id,
        firstName: 'Carlos',
        lastName: 'Ruiz',
        email: 'carlos@domodemo.es',
        jobTitle: 'Almacenero',
        department: 'Logística',
        hireDate: new Date('2023-09-15'),
      },
    }),
  ]);

  const taxRate = 21;
  const line = (productId: string, description: string, quantity: number, unitPrice: number) => {
    const lineTotal = quantity * unitPrice;
    return { productId, description, quantity, unitPrice, lineTotal };
  };
  const totals = (lines: { lineTotal: number }[]) => {
    const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
    const taxAmount = Math.round(subtotal * taxRate) / 100;
    return { subtotal, taxRate, taxAmount, total: subtotal + taxAmount };
  };

  const quoteLines = [
    line(p2.id, p2.name, 2, Number(p2.price)),
    line(p3.id, p3.name, 1, Number(p3.price)),
  ];
  const quoteT = totals(quoteLines);
  await prisma.quote.create({
    data: {
      id: DEMO_IDS.quote,
      companyId: company.id,
      number: 'PRE-DEMO-001',
      clientId: c1.id,
      status: 'sent',
      notes: 'Presupuesto de prueba',
      ...quoteT,
      lines: { create: quoteLines },
    },
  });

  const orderLines = [
    line(p1.id, p1.name, 10, Number(p1.price)),
    line(p2.id, p2.name, 3, Number(p2.price)),
  ];
  const orderT = totals(orderLines);
  const order = await prisma.salesOrder.create({
    data: {
      id: DEMO_IDS.order1,
      companyId: company.id,
      number: 'PED-DEMO-001',
      clientId: c1.id,
      warehouseId: wh.id,
      status: 'confirmed',
      notes: 'Pedido de prueba (confirmado — stock descontado)',
      ...orderT,
      lines: { create: orderLines },
    },
  });

  await prisma.stockMovement.createMany({
    data: [
      {
        companyId: company.id,
        productId: p1.id,
        warehouseId: wh.id,
        type: 'out',
        quantity: -10,
        referenceType: 'sales_order',
        referenceId: order.id,
        notes: 'Salida por pedido PED-DEMO-001',
        createdBy: adminUser.id,
      },
      {
        companyId: company.id,
        productId: p2.id,
        warehouseId: wh.id,
        type: 'out',
        quantity: -3,
        referenceType: 'sales_order',
        referenceId: order.id,
        notes: 'Salida por pedido PED-DEMO-001',
        createdBy: adminUser.id,
      },
      {
        companyId: company.id,
        productId: p3.id,
        warehouseId: wh.id,
        type: 'adjustment',
        quantity: 2,
        referenceType: 'manual',
        notes: 'Ajuste demo: recepción verificada',
        createdBy: adminUser.id,
      },
    ],
  });

  const order2Lines = [line(p3.id, p3.name, 2, Number(p3.price))];
  const order2T = totals(order2Lines);
  await prisma.salesOrder.create({
    data: {
      id: DEMO_IDS.order2,
      companyId: company.id,
      number: 'PED-DEMO-002',
      clientId: c2.id,
      status: 'draft',
      ...order2T,
      lines: { create: order2Lines },
    },
  });

  const invLines = [
    line(p1.id, p1.name, 10, Number(p1.price)),
    line(p2.id, p2.name, 3, Number(p2.price)),
  ];
  const invT = totals(invLines);
  const inv1 = await prisma.invoice.create({
    data: {
      id: DEMO_IDS.invoice1,
      companyId: company.id,
      number: 'FAC-DEMO-001',
      clientId: c1.id,
      orderId: order.id,
      status: 'issued',
      dueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      notes: 'Factura de prueba (vencida, sin pagos)',
      ...invT,
      lines: { create: invLines },
    },
  });

  const inv2Lines = [line(p1.id, p1.name, 5, Number(p1.price))];
  const inv2T = totals(inv2Lines);
  const inv2 = await prisma.invoice.create({
    data: {
      id: DEMO_IDS.invoice2,
      companyId: company.id,
      number: 'FAC-DEMO-002',
      clientId: c2.id,
      status: 'partially_paid',
      ...inv2T,
      lines: { create: inv2Lines },
    },
  });
  const payment2 = await prisma.payment.create({
    data: {
      companyId: company.id,
      invoiceId: inv2.id,
      amount: Math.round(Number(inv2T.total) * 0.4 * 100) / 100,
      paymentDate: new Date(),
      method: 'transfer',
      notes: 'Anticipo del 40%',
    },
  });

  await seedDemoAccounting(company.id, [
    {
      id: inv1.id,
      number: inv1.number,
      issueDate: inv1.issueDate,
      subtotal: Number(inv1.subtotal),
      taxAmount: Number(inv1.taxAmount),
      total: Number(inv1.total),
    },
    {
      id: inv2.id,
      number: inv2.number,
      issueDate: inv2.issueDate,
      subtotal: Number(inv2.subtotal),
      taxAmount: Number(inv2.taxAmount),
      total: Number(inv2.total),
    },
  ], [
    {
      id: payment2.id,
      invoiceNumber: inv2.number,
      amount: Number(payment2.amount),
      paymentDate: payment2.paymentDate,
    },
  ]);

  await seedDemoTreasury(company.id, payment2);
  await seedDemoCrm(company.id, c1.id, c2.id, adminUser.id);
  await seedDemoProjects(company.id, c1.id, c2.id);
  await seedDemoManufacturing(company.id, p4.id, p2.id, p3.id, wh.id);

  const poLines = [line(p1.id, p1.name, 50, Number(p1.cost ?? 2))];
  const poT = totals(poLines);
  await prisma.purchaseOrder.create({
    data: {
      id: DEMO_IDS.purchaseOrder,
      companyId: company.id,
      number: 'OC-DEMO-001',
      supplierId: s1.id,
      status: 'sent',
      notes: 'Orden de compra de prueba',
      ...poT,
      lines: { create: poLines },
    },
  });

  console.log('Seed completado con datos de prueba');
  console.log(`  Admin:  ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  console.log(`  Ventas: ${VENTAS_EMAIL} / ${VENTAS_PASSWORD} (sin acceso a facturas)`);
  console.log('  Datos: 2 clientes, 3 productos, 2 proveedores, 2 empleados,');
  console.log('         1 almacén, movimientos de stock, 1 presupuesto, 2 pedidos,');
  console.log('         2 facturas (1 vencida, 1 parcialmente pagada), 1 OC');
  console.log('         asientos contables demo en libro diario');
  console.log('         1 cuenta bancaria demo con movimientos y conciliación');
  console.log('         pipeline CRM demo (leads, oportunidades, actividades)');
  console.log('         2 proyectos demo con partes de horas');
}

type DemoInvoice = {
  id: string;
  number: string;
  issueDate: Date;
  subtotal: number;
  taxAmount: number;
  total: number;
};

type DemoPayment = {
  id: string;
  invoiceNumber: string;
  amount: number;
  paymentDate: Date;
};

async function seedDemoAccounting(
  companyId: string,
  invoices: DemoInvoice[],
  payments: DemoPayment[],
) {
  await prisma.account.createMany({
    data: PGCE_DEFAULT_ACCOUNTS.map((a) => ({
      companyId,
      code: a.code,
      name: a.name,
      type: a.type,
      isSystem: true,
    })),
    skipDuplicates: true,
  });

  const accounts = await prisma.account.findMany({ where: { companyId } });
  const byCode = new Map(accounts.map((a) => [a.code, a.id]));

  let entryNumber = 0;

  async function createEntry(params: {
    entryDate: Date;
    description: string;
    referenceType: string;
    referenceId: string;
    lines: Array<{ code: string; debit: number; credit: number }>;
  }) {
    entryNumber += 1;
    await prisma.journalEntry.create({
      data: {
        companyId,
        entryNumber,
        entryDate: params.entryDate,
        description: params.description,
        referenceType: params.referenceType,
        referenceId: params.referenceId,
        lines: {
          create: params.lines.map((line, index) => ({
            accountId: byCode.get(line.code)!,
            debit: line.debit,
            credit: line.credit,
            lineOrder: index,
          })),
        },
      },
    });
  }

  for (const inv of invoices) {
    if (inv.total <= 0) continue;
    const lines: Array<{ code: string; debit: number; credit: number }> = [
      { code: ACCOUNT_CODES.clients, debit: inv.total, credit: 0 },
      { code: ACCOUNT_CODES.sales, debit: 0, credit: inv.subtotal },
    ];
    if (inv.taxAmount > 0) {
      lines.push({ code: ACCOUNT_CODES.vatOutput, debit: 0, credit: inv.taxAmount });
    }
    await createEntry({
      entryDate: inv.issueDate,
      description: `Emisión factura ${inv.number}`,
      referenceType: 'invoice_issue',
      referenceId: inv.id,
      lines,
    });
  }

  for (const pay of payments) {
    if (pay.amount <= 0) continue;
    await createEntry({
      entryDate: pay.paymentDate,
      description: `Cobro factura ${pay.invoiceNumber}`,
      referenceType: 'invoice_payment',
      referenceId: pay.id,
      lines: [
        { code: ACCOUNT_CODES.bank, debit: pay.amount, credit: 0 },
        { code: ACCOUNT_CODES.clients, debit: 0, credit: pay.amount },
      ],
    });
  }
}

async function seedDemoTreasury(
  companyId: string,
  payment: { id: string; amount: { toNumber?: () => number } | number | string; paymentDate: Date },
) {
  const bankAccount = await prisma.bankAccount.create({
    data: {
      companyId,
      name: 'Cuenta principal (demo)',
      iban: 'ES12 3456 7890 1234 5678 9012',
      bankName: 'Banco Demo',
      openingBalance: 1000,
      notes: 'Cuenta de prueba para tesorería',
    },
  });

  const paymentAmount = Number(payment.amount);

  await prisma.bankMovement.createMany({
    data: [
      {
        companyId,
        bankAccountId: bankAccount.id,
        movementDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        description: 'Saldo inicial operativo',
        amount: 1000,
        type: 'in',
        status: 'pending',
      },
      {
        companyId,
        bankAccountId: bankAccount.id,
        movementDate: payment.paymentDate,
        description: 'Transferencia cobro FAC-DEMO-002',
        amount: paymentAmount,
        type: 'in',
        status: 'reconciled',
        paymentId: payment.id,
        reference: 'TRF-DEMO-002',
      },
      {
        companyId,
        bankAccountId: bankAccount.id,
        movementDate: new Date(),
        description: 'Comisión mantenimiento cuenta',
        amount: 3.5,
        type: 'out',
        status: 'pending',
      },
    ],
  });
}

async function seedDemoCrm(
  companyId: string,
  client1Id: string,
  client2Id: string,
  adminUserId: string,
) {
  const { DEFAULT_CRM_STAGES } = await import('../src/modules/crm/crm-default-stages');

  await prisma.crmStage.createMany({
    data: DEFAULT_CRM_STAGES.map((s) => ({
      companyId,
      name: s.name,
      sortOrder: s.sortOrder,
      color: s.color,
      isClosed: s.isClosed,
      outcome: s.outcome,
    })),
  });

  const stages = await prisma.crmStage.findMany({
    where: { companyId },
    orderBy: { sortOrder: 'asc' },
  });
  const byName = new Map(stages.map((s) => [s.name, s]));

  const [lead1, lead2] = await Promise.all([
    prisma.crmLead.create({
      data: {
        companyId,
        name: 'Carlos Ruiz',
        email: 'carlos@startup.io',
        companyName: 'Startup IO',
        source: 'Web',
        status: 'new',
        assignedToId: adminUserId,
      },
    }),
    prisma.crmLead.create({
      data: {
        companyId,
        name: 'María López',
        email: 'maria@consulting.es',
        phone: '600999888',
        source: 'Referido',
        status: 'contacted',
        assignedToId: adminUserId,
      },
    }),
  ]);

  await Promise.all([
    prisma.crmOpportunity.create({
      data: {
        companyId,
        title: 'Renovación equipamiento Acme',
        stageId: byName.get('Negociación')!.id,
        clientId: client1Id,
        amount: 2500,
        probability: 70,
        expectedCloseDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        assignedToId: adminUserId,
      },
    }),
    prisma.crmOpportunity.create({
      data: {
        companyId,
        title: 'Pack informática Beta SL',
        stageId: byName.get('Propuesta')!.id,
        clientId: client2Id,
        amount: 890,
        probability: 50,
        assignedToId: adminUserId,
      },
    }),
    prisma.crmOpportunity.create({
      data: {
        companyId,
        title: 'Proyecto Startup IO',
        stageId: byName.get('Prospección')!.id,
        leadId: lead1.id,
        amount: 4200,
        probability: 20,
        assignedToId: adminUserId,
      },
    }),
  ]);

  const opp = await prisma.crmOpportunity.findFirst({
    where: { companyId, title: 'Renovación equipamiento Acme' },
  });

  await Promise.all([
    prisma.crmActivity.create({
      data: {
        companyId,
        type: 'call',
        subject: 'Llamada de seguimiento Acme',
        dueAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        clientId: client1Id,
        opportunityId: opp?.id,
        assignedToId: adminUserId,
        createdById: adminUserId,
      },
    }),
    prisma.crmActivity.create({
      data: {
        companyId,
        type: 'meeting',
        subject: 'Demo producto — Startup IO',
        dueAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        leadId: lead1.id,
        assignedToId: adminUserId,
        createdById: adminUserId,
      },
    }),
    prisma.crmActivity.create({
      data: {
        companyId,
        type: 'task',
        subject: 'Enviar propuesta a María',
        dueAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        leadId: lead2.id,
        assignedToId: adminUserId,
        createdById: adminUserId,
      },
    }),
  ]);
}

async function seedDemoProjects(companyId: string, client1Id: string, client2Id: string) {
  const employees = await prisma.employee.findMany({
    where: { companyId },
    take: 2,
    orderBy: { createdAt: 'asc' },
  });
  if (employees.length === 0) return;

  const [emp1, emp2] = employees;

  const [proj1, proj2] = await Promise.all([
    prisma.project.create({
      data: {
        companyId,
        clientId: client1Id,
        name: 'Implantación ERP Acme',
        code: 'PRJ-ACME',
        description: 'Consultoría e implantación inicial',
        status: 'active',
        hourlyRate: 65,
        budgetHours: 80,
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.project.create({
      data: {
        companyId,
        clientId: client2Id,
        name: 'Soporte mensual Beta SL',
        code: 'PRJ-BETA',
        status: 'active',
        hourlyRate: 45,
        budgetHours: 20,
      },
    }),
  ]);

  const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

  await prisma.timeEntry.createMany({
    data: [
      {
        companyId,
        projectId: proj1.id,
        employeeId: emp1.id,
        entryDate: daysAgo(10),
        hours: 4,
        description: 'Análisis requisitos',
        billable: true,
      },
      {
        companyId,
        projectId: proj1.id,
        employeeId: emp1.id,
        entryDate: daysAgo(5),
        hours: 6,
        description: 'Configuración módulos',
        billable: true,
      },
      {
        companyId,
        projectId: proj1.id,
        employeeId: emp2.id,
        entryDate: daysAgo(3),
        hours: 3,
        description: 'Formación usuarios',
        billable: true,
      },
      {
        companyId,
        projectId: proj2.id,
        employeeId: emp1.id,
        entryDate: daysAgo(7),
        hours: 2,
        description: 'Incidencias soporte',
        billable: true,
      },
      {
        companyId,
        projectId: proj2.id,
        employeeId: emp2.id,
        entryDate: daysAgo(1),
        hours: 1.5,
        description: 'Revisión mensual',
        billable: true,
      },
    ],
  });
}

async function seedDemoManufacturing(
  companyId: string,
  kitProductId: string,
  ratProductId: string,
  keyboardProductId: string,
  warehouseId: string,
) {
  const bom = await prisma.bom.create({
    data: {
      companyId,
      productId: kitProductId,
      name: 'Kit informática estándar',
      notes: 'Ratón + teclado por unidad',
      lines: {
        create: [
          { componentProductId: ratProductId, quantity: 1, lineOrder: 0 },
          { componentProductId: keyboardProductId, quantity: 1, lineOrder: 1 },
        ],
      },
    },
  });

  await prisma.manufacturingOrder.create({
    data: {
      companyId,
      number: 'OF-0001',
      bomId: bom.id,
      productId: kitProductId,
      warehouseId,
      quantity: 5,
      status: 'draft',
      plannedDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      notes: 'Lote demo — pendiente de completar',
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
