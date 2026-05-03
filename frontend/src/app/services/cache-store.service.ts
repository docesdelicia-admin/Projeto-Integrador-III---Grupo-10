import { Injectable } from '@angular/core';
import { concat, Observable, of } from 'rxjs';
import { finalize, shareReplay, tap } from 'rxjs/operators';

interface CacheEntry<T> {
  value: T;
  updatedAt: number;
  ttlMs: number;
}

@Injectable({
  providedIn: 'root',
})
export class CacheStoreService {
  private readonly cache = new Map<string, CacheEntry<unknown>>();
  private readonly inFlight = new Map<string, Observable<unknown>>();

  hasEntry(key: string): boolean {
    return this.cache.has(key);
  }

  getData<T>(key: string, request$: Observable<T>, ttlMs: number): Observable<T> {
    const fresh = this.get<T>(key);
    if (fresh !== undefined) {
      return of(this.cloneValue(fresh));
    }

    const cached = this.getStale<T>(key);
    if (cached !== undefined) {
      return concat(of(this.cloneValue(cached)), this.getInFlightOrCreate(key, request$, ttlMs));
    }

    return this.getInFlightOrCreate(key, request$, ttlMs);
  }

  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      return undefined;
    }

    if (Date.now() - entry.updatedAt >= entry.ttlMs) {
      return undefined;
    }

    return this.cloneValue(entry.value as T);
  }

  getStale<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) {
      return undefined;
    }

    return this.cloneValue(entry.value as T);
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    this.cache.set(key, {
      value: this.cloneValue(value),
      updatedAt: Date.now(),
      ttlMs,
    });
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidateByPrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  entriesByPrefix<T>(prefix: string): Array<{ key: string; value: T }> {
    const entries: Array<{ key: string; value: T }> = [];

    for (const [key, entry] of this.cache.entries()) {
      if (key.startsWith(prefix)) {
        entries.push({
          key,
          value: this.cloneValue(entry.value as T),
        });
      }
    }

    return entries;
  }

  private getInFlightOrCreate<T>(
    key: string,
    request$: Observable<T>,
    ttlMs: number,
  ): Observable<T> {
    const existente = this.inFlight.get(key) as Observable<T> | undefined;

    if (existente) {
      return existente;
    }

    const emExecucao = request$.pipe(
      tap((data) => this.set(key, data, ttlMs)),
      finalize(() => this.inFlight.delete(key)),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    this.inFlight.set(key, emExecucao as Observable<unknown>);
    return emExecucao;
  }

  private cloneValue<T>(value: T): T {
    if (typeof structuredClone === 'function') {
      return structuredClone(value);
    }

    return JSON.parse(JSON.stringify(value)) as T;
  }
}
