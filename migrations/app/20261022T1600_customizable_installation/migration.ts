#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/1379348fe845b8c21d77d1079f9bae8b772cbcaadaa2da67d7a910e7f158639e/contract';
import endContract from '../../snapshots/1379348fe845b8c21d77d1079f9bae8b772cbcaadaa2da67d7a910e7f158639e/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/89ccfb45d2090b4dddcd9732c307becbefc1cd447eb58407fdce895b05f54215/contract';
import startContract from '../../snapshots/89ccfb45d2090b4dddcd9732c307becbefc1cd447eb58407fdce895b05f54215/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'status_page',
        table: 'SiteSettings',
        columns: [
          col('accent', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('buttonColor', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('copyright', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('description', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('favicon', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('logo', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addColumn({
        schema: 'status_page',
        table: 'StaffAccount',
        column: col('role', 'text', {
          notNull: true,
          default: lit('staff'),
          codecRef: { codecId: 'pg/text@1' },
        }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
