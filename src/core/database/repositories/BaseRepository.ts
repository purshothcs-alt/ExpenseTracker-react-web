import type { Table } from 'dexie';
import type { BaseEntity } from '../types';

export class BaseRepository<T extends BaseEntity> {
  protected table: Table<T, number>;

  constructor(table: Table<T, number>) {
    this.table = table;
  }

  async getAll(): Promise<T[]> {
    return this.table.toArray();
  }

  async getAllActive(): Promise<T[]> {
    return this.table
      .filter((item) => (item as T & { isActive?: boolean }).isActive !== false)
      .toArray();
  }

  async getById(id: number): Promise<T | undefined> {
    return this.table.get(id);
  }

  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    const ts = new Date().toISOString();
    return this.table.add({ ...data, createdAt: ts, updatedAt: ts } as unknown as T);
  }

  async update(id: number, data: Partial<T>): Promise<void> {
    await this.table.update(id, { ...data, updatedAt: new Date().toISOString() } as never);
  }

  async delete(id: number): Promise<void> {
    await this.table.delete(id);
  }

  async setActive(id: number, isActive: boolean): Promise<void> {
    await this.table.update(id, { isActive, updatedAt: new Date().toISOString() } as never);
  }

  async count(): Promise<number> {
    return this.table.count();
  }

  async search(predicate: (item: T) => boolean): Promise<T[]> {
    return this.table.filter(predicate).toArray();
  }
}
