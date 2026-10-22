#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/89ccfb45d2090b4dddcd9732c307becbefc1cd447eb58407fdce895b05f54215/contract';
import endContract from '../../snapshots/89ccfb45d2090b4dddcd9732c307becbefc1cd447eb58407fdce895b05f54215/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/de0854be2f72ede27df0a5c60874502b811c62d235b482c845db7d09f139da80/contract';
import startContract from '../../snapshots/de0854be2f72ede27df0a5c60874502b811c62d235b482c845db7d09f139da80/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'status_page',
        table: 'ServiceComponent',
        column: col('showUptime', 'bool', {
          notNull: true,
          default: lit(false),
          codecRef: { codecId: 'pg/bool@1' },
        }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
