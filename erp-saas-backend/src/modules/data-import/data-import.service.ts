import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { parseTabularCsv, pickField } from '../../common/csv/parse-tabular-csv';
import { ClientsService } from '../clients/clients.service';
import { ProductsService } from '../products/products.service';
import { WarehousesService } from '../warehouses/warehouses.service';
import { PrismaService } from '../../common/database/prisma.service';
import { InventoryService } from '../../common/inventory/inventory.service';

const MAX_ROWS = 500;

export type ImportRowError = { row: number; message: string };

export type ImportResult = {
  created: number;
  skipped: number;
  errors: ImportRowError[];
  dryRun: boolean;
};

@Injectable()
export class DataImportService {
  constructor(
    private readonly clients: ClientsService,
    private readonly products: ProductsService,
    private readonly warehouses: WarehousesService,
    private readonly prisma: PrismaService,
    private readonly inventory: InventoryService,
  ) {}

  getTemplate(type: 'warehouses' | 'clients' | 'products'): { filename: string; content: string } {
    const templates = {
      warehouses: {
        filename: 'plantilla-almacenes.csv',
        content: 'codigo;nombre;direccion;ciudad;notas\nALM01;Almacén principal;C/ Ejemplo 1;Madrid;\n',
      },
      clients: {
        filename: 'plantilla-clientes.csv',
        content:
          'nombre;email;telefono;nif;direccion;ciudad;cp;pais;notas\n' +
          'Cliente demo;cliente@ejemplo.com;600000000;B12345678;C/ Cliente 2;Barcelona;08001;ES;\n',
      },
      products: {
        filename: 'plantilla-productos.csv',
        content:
          'codigo;nombre;precio;coste;stock;stock_minimo;categoria;almacen;descripcion\n' +
          'PROD01;Producto demo;10.50;5;100;5;General;ALM01;Descripción opcional\n',
      },
    };
    return templates[type];
  }

  async importWarehouses(companyId: string, csv: string, dryRun = false): Promise<ImportResult> {
    const { rows } = parseTabularCsv(csv);
    this.assertRowLimit(rows.length);
    return this.runRowsAsync(rows, dryRun, async (row) => {
      const code = pickField(row, ['codigo', 'code']);
      const name = pickField(row, ['nombre', 'name']);
      if (!code) throw new Error('Falta codigo');
      if (!name) throw new Error('Falta nombre');

      const dto = {
        code,
        name,
        address: pickField(row, ['direccion', 'address']) || undefined,
        city: pickField(row, ['ciudad', 'city']) || undefined,
        notes: pickField(row, ['notas', 'notes']) || undefined,
      };

      if (!dryRun) {
        await this.warehouses.create(companyId, dto);
      }
    });
  }

  async importClients(companyId: string, csv: string, dryRun = false): Promise<ImportResult> {
    const { rows } = parseTabularCsv(csv);
    this.assertRowLimit(rows.length);
    return this.runRowsAsync(rows, dryRun, async (row) => {
      const name = pickField(row, ['nombre', 'name']);
      if (!name) throw new Error('Falta nombre');

      const email = pickField(row, ['email', 'correo']);
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error('Email no válido');
      }
      const dto = {
        name,
        email: email || undefined,
        phone: pickField(row, ['telefono', 'phone', 'movil']) || undefined,
        taxId: pickField(row, ['nif', 'cif', 'taxid', 'tax_id']) || undefined,
        address: pickField(row, ['direccion', 'address']) || undefined,
        city: pickField(row, ['ciudad', 'city']) || undefined,
        postalCode: pickField(row, ['cp', 'postal_code', 'postalcode']) || undefined,
        country: pickField(row, ['pais', 'country']) || 'ES',
        notes: pickField(row, ['notas', 'notes']) || undefined,
      };

      if (!dryRun) {
        await this.clients.create(companyId, dto);
      }
    });
  }

  async importProducts(
    companyId: string,
    csv: string,
    dryRun = false,
    defaultWarehouseCode?: string,
  ): Promise<ImportResult> {
    const { rows } = parseTabularCsv(csv);
    this.assertRowLimit(rows.length);

    const warehouseCache = new Map<string, string>();

    const resolveWarehouse = async (code: string | undefined) => {
      const key = (code || defaultWarehouseCode || '').trim();
      if (!key) {
        return this.inventory.resolveWarehouseId(companyId);
      }
      if (warehouseCache.has(key)) return warehouseCache.get(key)!;
      const wh = await this.prisma.warehouse.findFirst({
        where: { companyId, code: key, deletedAt: null, isActive: true },
      });
      if (!wh) throw new Error(`Almacén no encontrado: ${key}`);
      warehouseCache.set(key, wh.id);
      return wh.id;
    };

    return this.runRowsAsync(rows, dryRun, async (row) => {
      const code = pickField(row, ['codigo', 'code', 'sku']);
      const name = pickField(row, ['nombre', 'name']);
      if (!code) throw new Error('Falta codigo');
      if (!name) throw new Error('Falta nombre');

      const priceRaw = pickField(row, ['precio', 'price']);
      const costRaw = pickField(row, ['coste', 'cost']);
      const stockRaw = pickField(row, ['stock', 'cantidad']);
      const minStockRaw = pickField(row, ['stock_minimo', 'min_stock', 'minstock']);

      const price = priceRaw ? Number(priceRaw.replace(',', '.')) : 0;
      const cost = costRaw ? Number(costRaw.replace(',', '.')) : undefined;
      const stock = stockRaw ? Number(stockRaw.replace(',', '.')) : 0;
      const minStock = minStockRaw ? Number(minStockRaw.replace(',', '.')) : undefined;

      if (Number.isNaN(price) || price < 0) throw new Error('Precio no válido');
      if (cost !== undefined && (Number.isNaN(cost) || cost < 0)) throw new Error('Coste no válido');
      if (Number.isNaN(stock) || stock < 0) throw new Error('Stock no válido');
      if (minStock !== undefined && (Number.isNaN(minStock) || minStock < 0)) {
        throw new Error('Stock mínimo no válido');
      }

      const warehouseCode = pickField(row, ['almacen', 'warehouse', 'warehouse_code']);

      if (dryRun) {
        await resolveWarehouse(warehouseCode || undefined);
        return;
      }

      const initialStock = stock;
      const product = await this.products.create(companyId, {
        code,
        name,
        description: pickField(row, ['descripcion', 'description']) || undefined,
        category: pickField(row, ['categoria', 'category']) || undefined,
        price,
        cost,
        stock: 0,
        minStock,
      });

      if (initialStock > 0) {
        const warehouseId = await resolveWarehouse(warehouseCode || undefined);
        await this.inventory.setWarehouseStock(
          companyId,
          warehouseId,
          product.id,
          initialStock,
          'Stock inicial importación CSV',
        );
      }
    });
  }

  private assertRowLimit(count: number) {
    if (count === 0) {
      throw new BadRequestException('El CSV no contiene filas de datos (solo cabecera o vacío)');
    }
    if (count > MAX_ROWS) {
      throw new BadRequestException(`Máximo ${MAX_ROWS} filas por importación`);
    }
  }

  private async runRowsAsync(
    rows: Record<string, string>[],
    dryRun: boolean,
    fn: (row: Record<string, string>, rowNum: number) => Promise<void>,
  ): Promise<ImportResult> {
    const errors: ImportRowError[] = [];
    let created = 0;
    let skipped = 0;

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      const rowNum = index + 2;
      try {
        await fn(row, rowNum);
        created++;
      } catch (e) {
        skipped++;
        errors.push({ row: rowNum, message: this.errorMessage(e) });
      }
    }

    return { created, skipped, errors, dryRun };
  }

  private errorMessage(e: unknown): string {
    if (e instanceof ConflictException) {
      return e.message;
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return 'Registro duplicado (código o identificador ya existe)';
    }
    if (e instanceof Error) return e.message;
    return 'Error desconocido';
  }
}
