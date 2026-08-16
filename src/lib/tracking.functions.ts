import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const createTrackingSheetFn = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ title: z.string().min(1).max(120) }).parse(data))
  .handler(async ({ data }) => {
    const { createTrackingSheet } = await import("./sheets.server");
    return createTrackingSheet(data.title);
  });

export const registerTestFn = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        spreadsheetId: z.string().min(10),
        row: z.array(z.string()).min(5).max(20),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { appendTrackingRow } = await import("./sheets.server");
    return appendTrackingRow(data.spreadsheetId, data.row);
  });

export const listTrackingFn = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ spreadsheetId: z.string().min(10) }).parse(data))
  .handler(async ({ data }) => {
    const { listTrackingRows } = await import("./sheets.server");
    return listTrackingRows(data.spreadsheetId);
  });
