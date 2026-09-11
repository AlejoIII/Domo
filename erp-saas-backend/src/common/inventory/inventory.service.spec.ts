import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { PrismaService } from '../database/prisma.service';
import { WebhookDispatcherService } from '../../modules/integrations/webhook-dispatcher.service';

describe('InventoryService', () => {
  let service: InventoryService;
  let prisma: {
    warehouse: { findFirst: jest.Mock; findUnique?: jest.Mock };
    company: { findFirst: jest.Mock };
    product: { findFirst: jest.Mock; updateMany: jest.Mock };
    warehouseStock: { findUnique: jest.Mock; upsert: jest.Mock; findMany: jest.Mock };
    stockMovement: { create: jest.Mock };
    $transaction: jest.Mock;
  };
  let webhooks: { emit: jest.Mock };

  beforeEach(() => {
    prisma = {
      warehouse: { findFirst: jest.fn() },
      company: { findFirst: jest.fn() },
      product: { findFirst: jest.fn(), updateMany: jest.fn() },
      warehouseStock: { findUnique: jest.fn(), upsert: jest.fn(), findMany: jest.fn() },
      stockMovement: { create: jest.fn() },
      $transaction: jest.fn((fn) => fn(prisma)),
    };
    webhooks = { emit: jest.fn() };

    service = new InventoryService(
      prisma as unknown as PrismaService,
      webhooks as unknown as WebhookDispatcherService,
    );
  });

  describe('resolveWarehouseId', () => {
    it('returns explicit warehouse when valid', async () => {
      prisma.warehouse.findFirst.mockResolvedValue({ id: 'wh-1' });

      await expect(service.resolveWarehouseId('co-1', 'wh-1')).resolves.toBe('wh-1');
    });

    it('throws when explicit warehouse is missing', async () => {
      prisma.warehouse.findFirst.mockResolvedValue(null);

      await expect(service.resolveWarehouseId('co-1', 'missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws when company has no warehouses', async () => {
      prisma.company.findFirst.mockResolvedValue({ defaultWarehouseId: null });
      prisma.warehouse.findFirst.mockResolvedValue(null);

      await expect(service.resolveWarehouseId('co-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('onSalesOrderStatusChange', () => {
    it('does nothing when stock status does not change', async () => {
      await expect(
        service.onSalesOrderStatusChange(
          'co-1',
          'wh-1',
          'confirmed',
          'shipped',
          [{ productId: 'p1', quantity: 1 }],
        ),
      ).resolves.toBeUndefined();
    });
  });

  describe('onManufacturingComplete', () => {
    it('rejects non-positive quantity', async () => {
      prisma.warehouse.findFirst.mockResolvedValue({ id: 'wh-1' });

      await expect(
        service.onManufacturingComplete('co-1', 'wh-1', 'prod-1', 0, [], 'mo-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
