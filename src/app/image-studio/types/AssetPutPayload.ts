export interface AssetPutPayload {
  hubId: string;
  mode: string;
  assets: {
    src: string;
    name: string;
    label?: string;
    srcName?: string;
    bucketID?: string;
    folderID: string;
  }[];
}
