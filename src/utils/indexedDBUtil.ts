import type { FileItem } from '../components/content/types'

const dbName = 'xnote'

export const storageObjectStore = 'storage'
export const noteObjectStore = 'note'

const openDB = (dbName: string, version: number): Promise<IDBDatabase> => {
    const req: IDBOpenDBRequest = indexedDB.open(dbName, version)

    return new Promise<IDBDatabase>((resolve, reject) => {
        // 事件在数据库首次创建或版本号发生变化时触发。
        // 这通常用于设置数据库结构或升级数据库版本。
        req.onupgradeneeded = (event: IDBVersionChangeEvent) => {
            const db = (event.target as IDBOpenDBRequest).result
            if (db.objectStoreNames.contains(noteObjectStore)) {
                db.deleteObjectStore(noteObjectStore);
            }
            if (db.objectStoreNames.contains(storageObjectStore)) {
                db.deleteObjectStore(storageObjectStore);
            }
            db.createObjectStore(storageObjectStore, {
                keyPath: 'id'
            }).createIndex('idx_active', 'active', { unique: false })
            const objectStore = db.createObjectStore(noteObjectStore, {
                keyPath: 'id'
            })
            objectStore.createIndex('idx_path_updated', ['path', 'updated'], { unique: false })
            objectStore.createIndex('idx_path_name', ['path', 'name'], { unique: false })
        }
        // 事件在数据库成功打开时触发。
        // 这通常用于执行读取或写入操作。
        req.onsuccess = (event: Event) => {
            const db = (event.target as IDBOpenDBRequest).result
            resolve(db)
        }
        req.onerror = (event: Event) => {
            console.error('数据库打开失败:', (event.target as IDBOpenDBRequest).error)
            reject((event.target as IDBOpenDBRequest).error)
        }
    })
}
let db: IDBDatabase;
await (async () => {
    db = await openDB(dbName, 7);
})();

export interface CustomStorage {
    id: number
    active: string
    file: FileSystemDirectoryHandle
}

export const openCursor = async (
    objectStoreName: string,
    callback: (objectStore: IDBObjectStore, cursor: IDBCursorWithValue) => void
): Promise<void> => {
    const objectStore: IDBObjectStore = await getObjectStore(objectStoreName)
    const req: IDBRequest = objectStore.openCursor()

    return new Promise<void>((resolve, reject) => {
        req.onsuccess = (event: IDBRequestEventMap['success']) => {
            const cursor: IDBCursorWithValue = (event.target as IDBRequest).result
            if (cursor) {
                callback(objectStore, cursor)
                cursor.continue()
            } else {
                console.log('没有更多记录了！')
                resolve()
            }
        }
        req.onerror = (event: IDBRequestEventMap['error']) => {
            console.error('打开游标时出错: ', (event.target as IDBRequest).error)
            reject((event.target as IDBRequest).error)
        }
    })
}

export const closeDB = () => {
    if (db) {
        db.close()
        console.log('数据库已关闭')
    }
}

export const getObjectStore = async (objectStoreName: string) => {
    const transaction: IDBTransaction = db.transaction(objectStoreName, 'readwrite');
    return transaction.objectStore(objectStoreName)
}

// storage
export const getActiveStorage = async (): Promise<CustomStorage> => {
    const objectStore: IDBObjectStore = await getObjectStore(storageObjectStore)
    const req: IDBRequest = objectStore.index('idx_active').get('true')
    return new Promise<CustomStorage>((resolve, reject) => {
        req.onsuccess = (event: IDBRequestEventMap['success']) => {
            resolve((event.target as IDBRequest).result)
        }
        req.onerror = (event: IDBRequestEventMap['error']) => {
            console.error('打开游标时出错: ', (event.target as IDBRequest).error)
            reject((event.target as IDBRequest).error)
        }
    })
}

export const getStorageArray = async (): Promise<CustomStorage[]> => {
    const objectStore: IDBObjectStore = await getObjectStore(storageObjectStore)
    const req: IDBRequest = objectStore.openCursor()

    const storageArray: CustomStorage[] = []
    return new Promise<CustomStorage[]>((resolve, reject) => {
        req.onsuccess = (event: IDBRequestEventMap['success']) => {
            const cursor: IDBCursorWithValue = (event.target as IDBRequest).result
            if (cursor) {
                storageArray.push(cursor.value)
            } else {
                resolve(storageArray)
            }
        }
        req.onerror = (event: IDBRequestEventMap['error']) => {
            console.error('打开游标时出错: ', (event.target as IDBRequest).error)
            reject((event.target as IDBRequest).error)
        }
    })
}

export const getStorageById = async (id: number): Promise<CustomStorage> => {
    const objectStore: IDBObjectStore = await getObjectStore(storageObjectStore)
    const req: IDBRequest = objectStore.get(id)
    return new Promise<CustomStorage>((resolve, reject) => {
        req.onsuccess = (event: IDBRequestEventMap['success']) => {
            resolve((event.target as IDBRequest).result)
        }
        req.onerror = (event: IDBRequestEventMap['error']) => {
            console.error('打开游标时出错: ', (event.target as IDBRequest).error)
            reject((event.target as IDBRequest).error)
        }
    })
}

// fileItem
export const getNoteByPathAndName = async (path: string, name: string): Promise<FileItem> => {
    const objectStore: IDBObjectStore = await getObjectStore(noteObjectStore)
    const req: IDBRequest = objectStore.index('idx_path_name').get([path, name])
    return new Promise<FileItem>((resolve, reject) => {
        req.onsuccess = (event: IDBRequestEventMap['success']) => {
            resolve((event.target as IDBRequest).result)
        }
        req.onerror = (event: IDBRequestEventMap['error']) => {
            console.error('打开游标时出错: ', (event.target as IDBRequest).error)
            reject((event.target as IDBRequest).error)
        }
    })
}
export const getNoteByPath = async (
    path: string,
    lastUpdated: Date | null,
    pageSize: number = 5000
): Promise<{}> => {
    const objectStore: IDBObjectStore = await getObjectStore(noteObjectStore)
    const index: IDBIndex = objectStore.index('idx_path_updated')
    const range = lastUpdated ? IDBKeyRange.bound([path], [path, lastUpdated], false, true) : null
    const result: FileItem[] = []
    const req: IDBRequest<IDBCursorWithValue | null> = index.openCursor(range, 'prev')

    const cursor = await new Promise<IDBCursorWithValue>((resolve, reject) => {
        req.onsuccess = (event: IDBRequestEventMap['success']) => {
            const cursor: IDBCursorWithValue = (event.target as IDBRequest).result
            if (cursor && result.length < pageSize) {
                result.push(cursor.value)
                cursor.continue()
            }

            if (!cursor || result.length >= pageSize) {
                resolve(cursor)
            }
        }
        req.onerror = (event: IDBRequestEventMap['error']) => {
            console.error('打开游标时出错: ', (event.target as IDBRequest).error)
            reject((event.target as IDBRequest).error)
        }
    })
    return {data: result, hasMore: !!cursor, lastUpdated: cursor ? cursor.value.lastUpdated : null}

    // return new Promise<FileItem[]>((resolve, reject) => {
    //     req.onsuccess = (event: IDBRequestEventMap['success']) => {
    //         const result: FileItem[] = (event.target as IDBRequest<FileItem[]>).result;
    //         resolve(result);

    //     }
    //     req.onerror = (event: IDBRequestEventMap['error']) => {
    //         console.error("打开游标时出错: ", (event.target as IDBRequest).error);
    //         reject((event.target as IDBRequest).error);
    //     }
    // })
}
