import FlexSearch, { Index, Document } from 'flexsearch';
import type { IndexOptions } from 'flexsearch';
// chinese-tokenizer.ts
import { 
  Segment,
  useDefault,
} from 'segmentit';

// 初始化分词器
const segmentit = useDefault(new Segment());


  // 中文分词方法
function  tokenizeChinese(text: string): string[] {
  const tokens = segmentit.doSegment(text, {
    simple: true,
    stripPunctuation: true
  });
  return tokens;
  // return tokens.flatMap(token => FlexSearch.tokenize(token));
}

/**
 * FlexSearch 配置选项
 */
export interface FlexSearchOptions<T> {
  // 索引配置
  indexConfig?: IndexOptions;
  // 是否启用异步搜索
  // async?: boolean;
  // 是否启用 Worker
  worker?: boolean;
}

/**
 * 搜索结果项
 */
export interface SearchResultItem<T> {
  id: string | number;
  doc: T;
  score: number;
}

/**
 * FlexSearch 工具类
 */
export class FlexSearchHelper<T extends Record<string, any>> {
  private index: Index;
  // private readonly async: boolean;
  private readonly worker: boolean;

  /**
   * 构造函数
   * @param fields 要索引的字段
   * @param options 配置选项
   */
  constructor(
    private readonly fields: Array<keyof T>,
    options: FlexSearchOptions<T> = {
      indexConfig: {
        // tokenize: 'full',
        encode: tokenizeChinese
      }
    }
  ) {
    // this.async = options.async ?? false;
    this.worker = options.worker ?? false;

    // 创建索引
    this.index = new FlexSearch.Index(options.indexConfig);
  }

  /**
   * 添加文档到索引
   * @param id 文档ID
   * @param doc 文档内容
   */
  add(id: string | number, doc: T): void {
    this.index.add(id, this.getIndexContent(doc));
  }

  /**
   * 批量添加文档
   * @param docs 文档数组
   * @param getId 获取文档ID的函数
   */
  addBulk(docs: T[], getId: (doc: T) => string | number = (doc) => doc.name): void {
    docs.forEach((doc) => {
      this.index.add(getId(doc), this.getIndexContent(doc));
    });
  }

  /**
   * 更新文档
   * @param id 文档ID
   * @param doc 文档内容
   */
  update(id: string | number, doc: T): void {
    this.index.update(id, this.getIndexContent(doc));
  }

  /**
   * 删除文档
   * @param id 文档ID
   */
  remove(id: string | number): void {
    this.index.remove(id);
  }

  /**
   * 搜索文档
   * @param query 搜索查询
   * @param limit 结果数量限制
   * @returns 搜索结果
   */
  async search(query: string, limit: number = 10): Promise<Array<SearchResultItem<T>>> {
    const results = this.index.search(query, limit) as Array<string | number>;

    return results.map((id: string | number) => ({
      id,
      doc: {} as T, // 简单索引模式没有文档内容
      score: 1, // 简单索引模式没有评分
    }));
  }

  /**
   * 带过滤条件的搜索
   * @param query 搜索查询
   * @param filter 过滤函数
   * @param limit 结果数量限制
   * @returns 过滤后的搜索结果
   */
  async searchWithFilter(
    query: string,
    filter: (doc: T) => boolean,
    limit: number = 10
  ): Promise<Array<SearchResultItem<T>>> {
    const results = await this.search(query, limit * 5); // 获取更多结果以便过滤
    return results.filter((item) => filter(item.doc)).slice(0, limit);
  }

  /**
   * 导出索引数据
   * @returns 索引数据
   */
  export(): any {
    // 用于存储导出数据的对象
    const exportedData: { [key: string]: string } = {};

    // 定义导出处理函数
    const exportHandler = (key: string, data: string) => {
      exportedData[key] = data;
    };
    this.index.export(exportHandler);
    return exportedData;
  }

  /**
   * 导入索引数据
   * @param data 索引数据
   */
  import(key: string, data: string): void {
    this.index.import(key, data);
  }

  /**
   * 获取索引内容（简单索引模式使用）
   * @param doc 文档
   * @returns 索引内容字符串
   */
  private getIndexContent(doc: T): string {
    return this.fields.map((field) => doc[field]).join(' ');
  }

  /**
   * 清空索引
   */
  clear(): void {
    this.index.clear();
  }

  /**
   * 销毁索引
   */
  destroy(): void {
    this.index.destroy();
  }
}