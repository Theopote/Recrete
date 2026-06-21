import * as WebIFC from "web-ifc";

let ifcApiPromise: Promise<WebIFC.IfcAPI> | null = null;

export async function getBrowserIfcApi() {
  if (!ifcApiPromise) {
    ifcApiPromise = (async () => {
      const ifcApi = new WebIFC.IfcAPI();
      ifcApi.SetWasmPath("/wasm/web-ifc/", true);
      await ifcApi.Init();
      return ifcApi;
    })();
  }
  return ifcApiPromise;
}

export async function openIfcModelFromUrl(url: string) {
  const ifcApi = await getBrowserIfcApi();
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch IFC (${response.status})`);
  }

  const data = new Uint8Array(await response.arrayBuffer());
  const modelId = ifcApi.OpenModel(data, { COORDINATE_TO_ORIGIN: true });
  if (modelId < 0) {
    throw new Error("Failed to open IFC model");
  }

  return {
    ifcApi,
    modelId,
    close: () => {
      ifcApi.CloseModel(modelId);
    },
  };
}
