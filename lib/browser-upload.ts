export function uploadWithProgress(
  url: string,
  file: File,
  contentType: string,
  signal: AbortSignal,
  onProgress: (loaded: number) => void,
) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const abort = () => xhr.abort();
    const clean = () => signal.removeEventListener("abort", abort);
    if (signal.aborted) {
      reject(new DOMException("Subida cancelada.", "AbortError"));
      return;
    }
    xhr.open("PUT", url);
    xhr.timeout = 2 * 60 * 60 * 1000;
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.upload.onprogress = (event) =>
      onProgress(Math.min(event.loaded, file.size));
    xhr.onload = () => {
      clean();
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(file.size);
        resolve();
        return;
      }
      let message =
        xhr.status === 413
          ? "El archivo supera el tamaño permitido por el servidor."
          : "No se pudo subir el archivo. Revisa tu conexión e inténtalo de nuevo.";
      try {
        message = JSON.parse(xhr.responseText).error || message;
      } catch {}
      reject(new Error(message));
    };
    xhr.onerror = () => {
      clean();
      reject(
        new Error(
          "La conexión se interrumpió durante la subida. Inténtalo de nuevo.",
        ),
      );
    };
    xhr.ontimeout = () => {
      clean();
      reject(
        new Error(
          "La subida tardó demasiado. Revisa tu conexión e inténtalo de nuevo.",
        ),
      );
    };
    xhr.onabort = () => {
      clean();
      reject(new DOMException("Subida cancelada.", "AbortError"));
    };
    signal.addEventListener("abort", abort, { once: true });
    xhr.send(file);
  });
}
