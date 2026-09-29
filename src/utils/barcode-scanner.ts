export async function scanProductIdentifier(): Promise<string | null> {
  const { CapacitorBarcodeScanner, CapacitorBarcodeScannerAndroidScanningLibrary, CapacitorBarcodeScannerTypeHint } = await import('@capacitor/barcode-scanner');
  const result = await CapacitorBarcodeScanner.scanBarcode({
    hint: CapacitorBarcodeScannerTypeHint.ALL,
    scanInstructions: 'Aponte a câmera para o código do produto',
    scanButton: true,
    scanText: 'Ler código',
    cancelButtonAccessibilityLabel: 'Cancelar leitura',
    android: { scanningLibrary: CapacitorBarcodeScannerAndroidScanningLibrary.ZXING },
  });
  return result.ScanResult.trim() || null;
}
