export interface Cursor {
  updated_at: string;
  id: number;
}

export function encodeCursor(cursor: Cursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString("base64");
}

export function decodeCursor(cursor: string): Cursor {
  return JSON.parse(Buffer.from(cursor, "base64").toString("utf8"));
}
