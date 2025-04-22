import type { FileItem } from '@/components/content/types'
import { parse, stringify } from '@/utils/front_matter'
import { getObjectStore, noteObjectStore } from '@/utils/indexedDBUtil'

async function writeFile(fileHandle, contents) {
    // Create a FileSystemWritableFileStream to write to.
    const writable = await fileHandle.createWritable()
    // Write the contents of the file to the stream.
    await writable.write(contents)
    // Close the file and write the contents to disk.
    await writable.close()
}

export const saveItem = async (item: FileItem, content: string) => {
    const parsedMarkdown = {};
    parsedMarkdown['_content'] = content;
    parsedMarkdown['title'] = item.title;
    parsedMarkdown['summary'] = item.summary;
    parsedMarkdown['tags'] = item.tags;
    parsedMarkdown['updated'] = item.updated;
    parsedMarkdown['date'] = item.date;

    const saveContent = stringify(parsedMarkdown, { mode: '', separator: '---', prefixSeparator: true });

    await writeFile(item.handle, saveContent);
    const objectStore = await getObjectStore(noteObjectStore);
    if ((item as any)._content) {
        delete (item as any)._content; // 使用类型断言绕过检查
    }
    objectStore.put(item).onerror = (e) => {
        console.error('Error', e);
    }; // 更新数据库中的文件信息

}