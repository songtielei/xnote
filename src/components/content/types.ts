export interface FileItem {
    id: number
    name: string
    url: string
    title: string
    summary: string
    tags: string[]
    updated: Date
    date: Date
    handle: FileSystemDirectoryHandle
}