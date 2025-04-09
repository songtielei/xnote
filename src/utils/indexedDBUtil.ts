const defaultDBName = 'xnote';
let db: IDBDatabase;

const openDB = (dbName: string, version: number, objectStoreName: string):Promise<void> => {
    const req: IDBOpenDBRequest = indexedDB.open(dbName, version);

    return new Promise<void>((resolve, reject) => {
        // 事件在数据库首次创建或版本号发生变化时触发。
        // 这通常用于设置数据库结构或升级数据库版本。
        req.onupgradeneeded = (event: IDBVersionChangeEvent) => {
            const changeDB = (event.target as IDBOpenDBRequest).result;
            changeDB.createObjectStore(objectStoreName, {
                keyPath: 'id'
            })
        }
        // 事件在数据库成功打开时触发。
        // 这通常用于执行读取或写入操作。
        req.onsuccess = (event: Event) => {
            db = (event.target as IDBOpenDBRequest).result
            // restoreHandle(db)
            resolve();
        };
        req.onerror = (event: Event) => {
            console.error('数据库打开失败:', (event.target as IDBOpenDBRequest).error);
            reject((event.target as IDBOpenDBRequest).error);
        };
    })
}

export const defaultObjectStoreName = 'fileHandle';

export interface FileHandleDO {
    id: number,
    current: boolean,
    file: FileSystemDirectoryHandle
};

export const openCursor = async (objectStoreName: string, callback: (objectStore:IDBObjectStore, cursor: IDBCursorWithValue) => void):Promise<void> => {
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

export const getCurrentFileHandle = async (objectStoreName: string): Promise<FileHandleDO> => {
    const objectStore: IDBObjectStore = await getObjectStore(objectStoreName);
    const req: IDBRequest = objectStore.openCursor();

    return new Promise<FileHandleDO>((resolve, reject) => {
        req.onsuccess = (event: IDBRequestEventMap['success']) => {
            const cursor: IDBCursorWithValue = (event.target as IDBRequest).result;
            if (cursor && cursor.value.current) {
                resolve(cursor.value);
            } else {
                console.log("没有更多记录了！");
            }
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
        await openDB(defaultDBName, 1, objectStoreName);
    }
    return db.transaction(objectStoreName, 'readwrite').objectStore(objectStoreName);
}