import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';

@Injectable()
export class TreasuryReconciliationService {
  constructor(private readonly prisma: PrismaService) {}

  async getReconciliationBoard(companyId: string, bankAccountId?: string) {
    const movementWhere = {
      companyId,
      status: 'pending',
      type: 'in',
      ...(bankAccountId ? { bankAccountId } : {}),
    };

    const [pendingMovements, unmatchedPayments] = await Promise.all([
      this.prisma.bankMovement.findMany({
        where: movementWhere,
        orderBy: [{ movementDate: 'desc' }, { createdAt: 'desc' }],
        include: { bankAccount: { select: { id: true, name: true } } },
      }),
      this.prisma.payment.findMany({
        where: {
          companyId,
          bankMovement: null,
        },
        orderBy: { paymentDate: 'desc' },
        include: {
          invoice: { select: { id: true, number: true, client: { select: { name: true } } } },
        },
      }),
    ]);

    const suggestions = this.buildSuggestions(pendingMovements, unmatchedPayments);

    return {
      pendingMovements: pendingMovements.map((m) => ({
        id: m.id,
        bankAccountId: m.bankAccountId,
        bankAccount: m.bankAccount,
        movementDate: m.movementDate.toISOString().slice(0, 10),
        description: m.description,
        amount: Number(m.amount),
        reference: m.reference,
      })),
      unmatchedPayments: unmatchedPayments.map((p) => ({
        id: p.id,
        amount: Number(p.amount),
        paymentDate: p.paymentDate.toISOString().slice(0, 10),
        method: p.method,
        reference: p.reference,
        invoice: p.invoice,
      })),
      suggestions,
    };
  }

  async reconcile(companyId: string, movementId: string, paymentId: string) {
    const movement = await this.prisma.bankMovement.findFirst({
      where: { id: movementId, companyId },
    });
    if (!movement) throw new NotFoundException('Movimiento no encontrado');
    if (movement.status === 'reconciled') {
      throw new BadRequestException('El movimiento ya está conciliado');
    }
    if (movement.type !== 'in') {
      throw new BadRequestException('Solo se concilian entradas con cobros de factura');
    }

    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, companyId },
      include: { bankMovement: true, invoice: { select: { number: true } } },
    });
    if (!payment) throw new NotFoundException('Pago no encontrado');
    if (payment.bankMovement) {
      throw new BadRequestException('El pago ya está conciliado con otro movimiento');
    }

    const movementAmount = Number(movement.amount);
    const paymentAmount = Number(payment.amount);
    if (Math.abs(movementAmount - paymentAmount) > 0.01) {
      throw new BadRequestException('El importe del movimiento no coincide con el pago');
    }

    await this.prisma.bankMovement.update({
      where: { id: movementId },
      data: {
        status: 'reconciled',
        paymentId,
        reference: movement.reference ?? payment.reference ?? `FAC ${payment.invoice.number}`,
      },
    });

    return {
      message: `Movimiento conciliado con pago de factura ${payment.invoice.number}`,
    };
  }

  async unreconcile(companyId: string, movementId: string) {
    const movement = await this.prisma.bankMovement.findFirst({
      where: { id: movementId, companyId },
    });
    if (!movement) throw new NotFoundException('Movimiento no encontrado');
    if (movement.status !== 'reconciled') {
      throw new BadRequestException('El movimiento no está conciliado');
    }

    await this.prisma.bankMovement.update({
      where: { id: movementId },
      data: { status: 'pending', paymentId: null },
    });

    return { message: 'Conciliación anulada' };
  }

  private buildSuggestions(
    movements: Array<{ id: string; amount: { toNumber?: () => number } | number | string; movementDate: Date; reference: string | null }>,
    payments: Array<{ id: string; amount: { toNumber?: () => number } | number | string; paymentDate: Date; reference: string | null }>,
  ) {
    const suggestions: Array<{ movementId: string; paymentId: string; reason: string }> = [];

    for (const movement of movements) {
      const mAmount = Number(movement.amount);
      const mDate = movement.movementDate.getTime();

      for (const payment of payments) {
        const pAmount = Number(payment.amount);
        if (Math.abs(mAmount - pAmount) > 0.01) continue;

        const daysDiff = Math.abs(mDate - payment.paymentDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysDiff > 7) continue;

        let reason = 'Importe coincidente';
        if (movement.reference && payment.reference && movement.reference === payment.reference) {
          reason = 'Importe y referencia coincidentes';
        } else if (daysDiff <= 1) {
          reason = 'Importe y fecha coincidentes';
        }

        suggestions.push({ movementId: movement.id, paymentId: payment.id, reason });
      }
    }

    return suggestions;
  }
}
