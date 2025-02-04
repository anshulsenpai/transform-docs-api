declare module "pdf-poppler" {
  interface PopplerOptions {
    format?: "jpeg" | "png" | "tiff";
    out_dir?: string;
    out_prefix?: string;
    page?: number;
  }

  function convert(filePath: string, options: PopplerOptions): Promise<void>;

  export { convert };
}
