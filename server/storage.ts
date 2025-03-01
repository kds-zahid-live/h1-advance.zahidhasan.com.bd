import { urlResults, type UrlResult, type MoreTagResult } from "@shared/schema";

export interface IStorage {
  createUrlResult(result: Omit<UrlResult, "id">): Promise<UrlResult>;
  createMoreTagResult(result: Omit<MoreTagResult, "id">): Promise<MoreTagResult>;
}

export class MemStorage implements IStorage {
  private results: Map<number, UrlResult | MoreTagResult>;
  private currentId: number;

  constructor() {
    this.results = new Map();
    this.currentId = 1;
  }

  async createUrlResult(result: Omit<UrlResult, "id">): Promise<UrlResult> {
    const id = this.currentId++;
    const urlResult: UrlResult = { ...result, id };
    this.results.set(id, urlResult);
    return urlResult;
  }

  async createMoreTagResult(result: Omit<MoreTagResult, "id">): Promise<MoreTagResult> {
    const id = this.currentId++;
    const moreTagResult: MoreTagResult = { ...result, id };
    this.results.set(id, moreTagResult);
    return moreTagResult;
  }
}

export const storage = new MemStorage();