export interface FileItem {
    id: string
    path: string
    name: string
    url: string
    title: string
    summary: string
    tags: string[]
    updated: Date
    date: Date
    handle: FileSystemFileHandle
}