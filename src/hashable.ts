import {DeepReadonly, Primitive} from 'ts-essentials';

/**
 * A hashable type expected to remain immutable so that it can be used as a dictionary / hash map key.
 */
export abstract class Hashable {
  abstract strictEquals(other: Hashable | Primitive): boolean;

  abstract valueOf(): Primitive;
}

/**
 * Python style dictionary implementation using hashable keys.
 */
export class HashMap<Key extends DeepReadonly<Hashable> | Primitive, Value>
  implements Map<Key, Value>
{
  private map: Map<Primitive, [Key, Value][]>;

  constructor(entries?: Iterable<[Key, Value]>) {
    this.map = new Map();
    if (entries === undefined) {
      return;
    }
    for (const [key, value] of entries) {
      this.set(key, value);
    }
  }

  set(key: Key, value: Value) {
    if (typeof key !== 'object' || key === null) {
      const subEntries = this.map.get(key) ?? [];
      for (let i = 0; i < subEntries.length; ++i) {
        const [existing] = subEntries[i];
        if (key === existing) {
          subEntries[i] = [key, value];
          return this;
        }
      }
      subEntries.push([key, value]);
      this.map.set(key, subEntries);
      return this;
    }
    const hash = key.valueOf();
    const subEntries = this.map.get(hash) ?? [];
    for (let i = 0; i < subEntries.length; ++i) {
      const [existing] = subEntries[i];
      if (key.strictEquals(existing)) {
        subEntries[i] = [key, value];
        return this;
      }
    }
    subEntries.push([key, value]);
    this.map.set(hash, subEntries);
    return this;
  }

  get(key: Key) {
    if (typeof key !== 'object' || key === null) {
      const subEntries = this.map.get(key);
      if (subEntries === undefined) {
        return undefined;
      }
      for (const [existing, value] of subEntries) {
        if (key === existing) {
          return value;
        }
      }
      return undefined;
    }
    const hash = key.valueOf();
    const subEntries = this.map.get(hash);
    if (subEntries === undefined) {
      return undefined;
    }
    for (const [existing, value] of subEntries) {
      if (key.strictEquals(existing)) {
        return value;
      }
    }
    return undefined;
  }

  clear(): void {
    this.map.clear();
  }

  delete(key: Key): boolean {
    if (typeof key !== 'object' || key === null) {
      const subEntries = this.map.get(key);
      if (subEntries === undefined) {
        return false;
      }
      for (let i = 0; i < subEntries.length; ++i) {
        const [existing] = subEntries[i];
        if (key === existing) {
          subEntries.splice(i, 1);
          if (!subEntries.length) {
            this.map.delete(key);
          }
          return true;
        }
      }
      return false;
    }
    const hash = key.valueOf();
    const subEntries = this.map.get(hash);
    if (subEntries === undefined) {
      return false;
    }
    for (let i = 0; i < subEntries.length; ++i) {
      const [existing] = subEntries[i];
      if (key.strictEquals(existing)) {
        subEntries.splice(i, 1);
        if (!subEntries.length) {
          this.map.delete(hash);
        }
        return true;
      }
    }
    return false;
  }

  has(key: Key): boolean {
    if (typeof key !== 'object' || key === null) {
      const subEntries = this.map.get(key);
      if (subEntries === undefined) {
        return false;
      }
      for (const [existing] of subEntries) {
        if (key === existing) {
          return true;
        }
      }
      return false;
    }
    const hash = key.valueOf();
    const subEntries = this.map.get(hash);
    if (subEntries === undefined) {
      return false;
    }
    for (const [existing] of subEntries) {
      if (key.strictEquals(existing)) {
        return true;
      }
    }
    return false;
  }

  get size(): number {
    let total = 0;
    for (const subEntries of this.map.values()) {
      total += subEntries.length;
    }
    return total;
  }

  *entries(): IterableIterator<[Key, Value]> {
    for (const subEntries of this.map.values()) {
      for (const entry of subEntries) {
        yield entry;
      }
    }
  }

  *keys(): IterableIterator<Key> {
    for (const subEntries of this.map.values()) {
      for (const [key] of subEntries) {
        yield key;
      }
    }
  }

  *values(): IterableIterator<Value> {
    for (const subEntries of this.map.values()) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for (const [_, value] of subEntries) {
        yield value;
      }
    }
  }

  *[Symbol.iterator]() {
    yield* this.entries();
  }

  get [Symbol.toStringTag]() {
    return 'HashMap';
  }

  forEach(
    callbackfn: (value: Value, key: Key, map: HashMap<Key, Value>) => void,
    thisArg?: any
  ): void {
    callbackfn = callbackfn.bind(thisArg);
    for (const subEntries of this.map.values()) {
      for (const [key, value] of subEntries) {
        callbackfn(value, key, this);
      }
    }
  }
}

/**
 * Python style set implementation using hashable values.
 */
export class HashSet<T extends DeepReadonly<Hashable> | Primitive>
  implements Set<T>
{
  private hashmap: HashMap<T, null>;
  constructor(values?: Iterable<T>) {
    this.hashmap = new HashMap();
    if (values === undefined) {
      return;
    }
    for (const value of values) {
      this.hashmap.set(value, null);
    }
  }
  add(value: T) {
    this.hashmap.set(value, null);
    return this;
  }
  clear(): void {
    this.hashmap.clear();
  }
  delete(value: T): boolean {
    return this.hashmap.delete(value);
  }
  has(value: T): boolean {
    return this.hashmap.has(value);
  }
  get size() {
    return this.hashmap.size;
  }
  *entries(): IterableIterator<[T, T]> {
    for (const key of this.hashmap.keys()) {
      yield [key, key];
    }
  }
  *keys(): IterableIterator<T> {
    yield* this.hashmap.keys();
  }
  *values(): IterableIterator<T> {
    yield* this.hashmap.keys();
  }
  *[Symbol.iterator]() {
    yield* this.hashmap.keys();
  }

  get [Symbol.toStringTag]() {
    return 'HashSet';
  }
  forEach(
    callbackfn: (value: T, value2: T, set: Set<T>) => void,
    thisArg?: any
  ): void {
    callbackfn = callbackfn.bind(thisArg);
    this.hashmap.forEach((_, key) => callbackfn(key, key, this));
  }
}
