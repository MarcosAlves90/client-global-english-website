import { describe, expect, it } from "vitest"

import { extractAttachmentUrlsFromDocs } from "@/lib/firebase/admin-firestore-utils"

describe("extractAttachmentUrlsFromDocs", () => {
  it("collects only non-empty string attachment urls", () => {
    const urls = extractAttachmentUrlsFromDocs([
      {
        data: () => ({
          attachments: [
            { url: " https://cdn.example.com/a.pdf " },
            { url: "" },
            { url: null },
          ],
        }),
      },
      { data: () => ({ attachments: [{ url: "https://cdn.example.com/b.mp4" }] }) },
      { data: () => ({ attachments: "invalid" }) },
    ])

    expect(urls).toEqual([
      "https://cdn.example.com/a.pdf",
      "https://cdn.example.com/b.mp4",
    ])
  })
})
