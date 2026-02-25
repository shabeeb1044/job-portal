declare module 'adm-zip' {
  export default class AdmZip {
    constructor(buffer: Buffer)
    getEntries(): { entryName: string; getData(): Buffer }[]
  }
}
