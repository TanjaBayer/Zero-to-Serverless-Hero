export function getHeader(
  headerName: string,
  headers: { [id: string]: unknown }
): string | undefined {
  const keys = Object.keys(headers);
  const key = keys.find((k) => k.toLowerCase() === headerName.toLowerCase());
  if (key) {
    return headers[key] as string;
  } else {
    return undefined;
  }
}
