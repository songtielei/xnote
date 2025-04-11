import type { FileItem } from '../components/content/types';

const dbName = 'xnote';

let db: IDBDatabase | null = null;
const openDB = (dbName: string, version: number): Promise<IDBDatabase> => {
    const req: IDBOpenDBRequest = indexedDB.open(dbName, version);

    return new Promise<IDBDatabase>((resolve, reject) => {
        // 事件在数据库首次创建或版本号发生变化时触发。
        // 这通常用于设置数据库结构或升级数据库版本。
        req.onupgradeneeded = (event: IDBVersionChangeEvent) => {
            const db = (event.target as IDBOpenDBRequest).result;
            db.createObjectStore(storageObjectStore, { autoIncrement: true }).createIndex('idx_active', 'active', { unique: false });
            const objectStore = db.createObjectStore(noteObjectStore, { autoIncrement: true });
            objectStore.createIndex('idx_path', 'path', { unique: false });
            objectStore.createIndex('idx_path_name', ['path', 'name'], { unique: true });
        }
        // 事件在数据库成功打开时触发。
        // 这通常用于执行读取或写入操作。
        req.onsuccess = (event: Event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            resolve(db);
        };
        req.onerror = (event: Event) => {
            console.error('数据库打开失败:', (event.target as IDBOpenDBRequest).error);
            reject((event.target as IDBOpenDBRequest).error);
        };
    })
}

export const storageObjectStore = 'storage';
export const noteObjectStore = 'note';

export interface Storage {
    id: number,
    active: string,
    file: FileSystemDirectoryHandle
};

export const openCursor = async (objectStoreName: string, callback: (objectStore:IDBObjectStore, cursor: IDBCursorWithValue) => void): Promise<void> => {
    const objectStore: IDBObjectStore = await getObjectStore(objectStoreName);
    const req: IDBRequest = objectStore.openCursor();

    return new Promise<void>((resolve, reject) => {
        req.onsuccess = (event: IDBRequestEventMap['success']) => {
            const cursor: IDBCursorWithValue = (event.target as IDBRequest).result;
            if (cursor) {
                callback(objectStore, cursor);
            } else {
                console.log("没有更多记录了！");
            }
            resolve();
        }
        req.onerror = (event: IDBRequestEventMap['error']) => {
            console.error("打开游标时出错: ", (event.target as IDBRequest).error);
            reject((event.target as IDBRequest).error);
        }
    })

}

export const closeDB = () => {
    if (db) {
        db.close();
        console.log('数据库已关闭')
    }
}

export const getObjectStore = async (objectStoreName: string) => {
    if (!db) {
        db = await openDB(dbName, 1);
    }
    return db.transaction(objectStoreName, 'readwrite').objectStore(objectStoreName);
}

// storage
export const getActiveStorage = async (): Promise<Storage> => {
    const objectStore: IDBObjectStore = await getObjectStore(storageObjectStore);
    const req: IDBRequest = objectStore.index('idx_active').get('true');
    return new Promise<Storage>((resolve, reject) => {
        req.onsuccess = (event: IDBRequestEventMap['success']) => {
            resolve((event.target as IDBRequest).result);
        }
        req.onerror = (event: IDBRequestEventMap['error']) => {
            console.error("打开游标时出错: ", (event.target as IDBRequest).error);
            reject((event.target as IDBRequest).error);
        }
    })
}

export const getStorageArray = async (): Promise<Storage[]> => {
    const objectStore: IDBObjectStore = await getObjectStore(storageObjectStore);
    const req: IDBRequest = objectStore.openCursor();

    const storageArray: Storage[] = [];
    return new Promise<Storage[]>((resolve, reject) => {
        req.onsuccess = (event: IDBRequestEventMap['success']) => {
            const cursor: IDBCursorWithValue = (event.target as IDBRequest).result;
            if (cursor) {
                storageArray.push(cursor.value);
            } else {
                resolve(storageArray);
            }
        }
        req.onerror = (event: IDBRequestEventMap['error']) => {
            console.error("打开游标时出错: ", (event.target as IDBRequest).error);
            reject((event.target as IDBRequest).error);
        }
    })
}

// fileItem
export const getNoteByPathAndName = async (path: string, name: string): Promise<Storage> => {
    const objectStore: IDBObjectStore = await getObjectStore(storageObjectStore);
    const req: IDBRequest = objectStore.index('idx_path_name').get([path, name]);
    return new Promise<Storage>((resolve, reject) => {
        req.onsuccess = (event: IDBRequestEventMap['success']) => {
            resolve((event.target as IDBRequest).result);
        }
        req.onerror = (event: IDBRequestEventMap['error']) => {
            console.error("打开游标时出错: ", (event.target as IDBRequest).error);
            reject((event.target as IDBRequest).error);
        }
    })
}
export const getNoteByPath = async (path: string): Promise<FileItem[]> => {
    const objectStore: IDBObjectStore = await getObjectStore(noteObjectStore);
    const req: IDBRequest<FileItem[]> = objectStore.index('idx_path').getAll(path);
    return new Promise<FileItem[]>((resolve, reject) => {
        req.onsuccess = (event: IDBRequestEventMap['success']) => {
            const result: FileItem[] = (event.target as IDBRequest<FileItem[]>).result;
            resolve(result);

        }
        req.onerror = (event: IDBRequestEventMap['error']) => {
            console.error("打开游标时出错: ", (event.target as IDBRequest).error);
            reject((event.target as IDBRequest).error);
        }
    })
}