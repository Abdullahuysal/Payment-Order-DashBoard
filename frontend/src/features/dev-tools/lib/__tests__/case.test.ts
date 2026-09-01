import { describe, expect, it } from 'vitest';

import { convertCase } from '../case';

describe('convertCase', () => {
  const cases: Array<[string, string]> = [
    ['camel', 'orderStatusChanged'],
    ['pascal', 'OrderStatusChanged'],
    ['snake', 'order_status_changed'],
    ['kebab', 'order-status-changed'],
    ['constant', 'ORDER_STATUS_CHANGED'],
    ['sentence', 'Order status changed'],
    ['title', 'Order Status Changed'],
  ];

  it.each(cases)('converts to %s case', (target, expected) => {
    const result = convertCase('order status-changed', { target });
    expect(result.output).toBe(expected);
  });

  it('splits camelCase and CONSTANT_CASE input into words', () => {
    expect(convertCase('MERCHANT_SHIPMENT', { target: 'kebab' }).output).toBe('merchant-shipment');
    expect(convertCase('retailInvoiceLine', { target: 'snake' }).output).toBe(
      'retail_invoice_line',
    );
  });

  it('converts each line independently', () => {
    const result = convertCase('order status\ninvoice line', { target: 'camel' });
    expect(result.output).toBe('orderStatus\ninvoiceLine');
    expect(result.stats.find((stat) => stat.label === 'Satır')?.value).toBe('2');
  });

  it('throws on empty input', () => {
    expect(() => convertCase('   ', { target: 'camel' })).toThrow(/Girdi boş/);
  });
});
