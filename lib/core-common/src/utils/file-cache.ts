// @ts-ignore - this package has no typings, so we wrap it and add typings that way, because we expose it
import Cache from 'file-system-cache';

export interface Options {
  basePath?: string;
  ns?: string | string[];
  extension?: string;
}

export class FileSystemCache {
  constructor(options: Options) {
    this.internal = Cache(options) as any as FileSystemCache;
  }

  private internal: FileSystemCache;

  path(key: string): string {
    return this.internal.path(key);
  }

  fileExists(key: string): Promise<boolean> {
    return this.internal.fileExists(key);
  }

  ensureBasePath(): Promise<void> {
    return this.internal.ensureBasePath();
  }

  get(key: string, defaultValue?: any): Promise<any | typeof defaultValue> {
    return this.internal.get(key, defaultValue);
  }

  getSync(key: string, defaultValue?: any): any | typeof defaultValue {
    this.internal.getSync(key, defaultValue);
  }

  set(key: string, value: any): Promise<{ path: string }> {
    return this.internal.set(key, value);
  }

  setSync(key: string, value: any): this {
    this.internal.setSync(key, value);
    return this;
  }

  remove(key: string): Promise<void> {
    return this.internal.remove(key);
  }

  clear(): Promise<void> {
    return this.internal.clear();
  }

  save(): Promise<{ paths: string[] }> {
    return this.internal.save();
  }

  load(): Promise<{ files: Array<{ path: string; value: any }> }> {
    return this.internal.load();
  }
}

export function createFileSystemCache(options: Options): FileSystemCache {
  return new FileSystemCache(options);
}
