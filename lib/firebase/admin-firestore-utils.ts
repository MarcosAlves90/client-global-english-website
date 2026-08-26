export async function deleteDocsInBatches(
  db: FirebaseFirestore.Firestore,
  docs: FirebaseFirestore.QueryDocumentSnapshot[],
  batchSize = 450
) {
  if (!docs.length) return

  let batch = db.batch()
  let pendingWrites = 0

  for (const document of docs) {
    batch.delete(document.ref)
    pendingWrites += 1

    if (pendingWrites >= batchSize) {
      await batch.commit()
      batch = db.batch()
      pendingWrites = 0
    }
  }

  if (pendingWrites > 0) {
    await batch.commit()
  }
}

export function extractAttachmentUrlsFromDocs(
  docs: Array<Pick<FirebaseFirestore.QueryDocumentSnapshot, "data">>
) {
  const urls: string[] = []

  docs.forEach((document) => {
    const data = document.data()
    const attachments = Array.isArray(data?.attachments) ? data.attachments : []

    attachments.forEach((attachment: { url?: unknown }) => {
      if (typeof attachment?.url === "string" && attachment.url.trim()) {
        urls.push(attachment.url.trim())
      }
    })
  })

  return urls
}
