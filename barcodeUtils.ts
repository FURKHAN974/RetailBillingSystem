import JsBarcode from 'jsbarcode';

/**
 * Generates a barcode as a data URL
 * @param value The value to encode in the barcode
 * @param options Optional configuration options
 * @returns A data URL containing the barcode image
 */
export function generateBarcodeDataURL(
  value: string, 
  options: {
    format?: string,
    width?: number,
    height?: number,
    displayValue?: boolean,
    fontSize?: number,
    margin?: number
  } = {}
): string {
  // Create a canvas element
  const canvas = document.createElement('canvas');
  
  // Configure the barcode
  JsBarcode(canvas, value, {
    format: options.format || 'CODE128',
    width: options.width || 2,
    height: options.height || 100,
    displayValue: options.displayValue !== undefined ? options.displayValue : true,
    fontSize: options.fontSize || 16,
    margin: options.margin || 10,
    lineColor: '#000',
  });
  
  // Return the data URL
  return canvas.toDataURL('image/png');
}

/**
 * Generates a unique barcode value based on a product's attributes
 * @param sku The product SKU
 * @param storeId The store ID
 * @returns A unique barcode value
 */
export function generateBarcodeValue(sku: string, storeId: number | null | undefined): string {
  // Use the SKU as the base for the barcode
  // Add a prefix based on the store ID to ensure uniqueness across stores
  const storePrefix = storeId ? `S${storeId}` : 'S0';
  
  // Clean the SKU to remove any non-alphanumeric characters
  const cleanSku = sku.replace(/[^a-zA-Z0-9]/g, '');
  
  // Combine store prefix and SKU
  const baseValue = `${storePrefix}${cleanSku}`;
  
  // Add a timestamp suffix for uniqueness
  const timestamp = new Date().getTime().toString().slice(-6);
  
  return `${baseValue}${timestamp}`;
}