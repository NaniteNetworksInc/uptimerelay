#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/a9620e8362d3d1a5dd26c8dee13c90c6c537db18b2f4d64ed0285c6f9462abbc/contract';
import startContract from '../../snapshots/a9620e8362d3d1a5dd26c8dee13c90c6c537db18b2f4d64ed0285c6f9462abbc/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/de0854be2f72ede27df0a5c60874502b811c62d235b482c845db7d09f139da80/contract';
import endContract from '../../snapshots/de0854be2f72ede27df0a5c60874502b811c62d235b482c845db7d09f139da80/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  col,
  fn,
  lit,
  primaryKey,
  sql,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'status_page',
        table: 'MonitorResult',
        columns: [
          col('checkedAt', 'timestamptz', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('componentId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('latencyMs', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('status', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'status_page',
        table: 'ServiceMonitor',
        columns: [
          col('checkedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('componentId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('enabled', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('error', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('failureThreshold', 'int4', {
            notNull: true,
            default: lit(3),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('failures', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('intervalSeconds', 'int4', {
            notNull: true,
            default: lit(60),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('kind', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('latencyMs', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('matches', 'text', {
            notNull: true,
            default: lit(''),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('nextCheckAt', 'timestamptz', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('port', 'int4', {
            notNull: true,
            default: lit(443),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('revision', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('unknown'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('target', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('timeoutSeconds', 'int4', {
            notNull: true,
            default: lit(10),
            codecRef: { codecId: 'pg/int4@1' },
          }),
        ],
        constraints: [primaryKey(['componentId'])],
      }),
      this.addColumn({
        schema: 'status_page',
        table: 'ServiceComponent',
        column: col('statusUrl', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.createIndex({
        schema: 'status_page',
        table: 'MonitorResult',
        index: 'MonitorResult_componentId_checkedAt_idx_a1661c8f',
        columns: ['componentId', 'checkedAt'],
      }),
      this.createIndex({
        schema: 'status_page',
        table: 'ServiceMonitor',
        index: 'ServiceMonitor_nextCheckAt_idx_271e69e8',
        columns: ['nextCheckAt'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
