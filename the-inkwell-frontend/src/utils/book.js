export function getBookImageUrl(book) {
  const documents = book?.documents || book?.documentResponses || [];
  const imageDocument =
    documents.find((document) => document.documentType === "BOOK_IMAGE") ||
    documents[0];

  return book?.imageUrl || book?.image_url || imageDocument?.url || null;
}

export function getBookDocumentUrl(book) {
  const documents = book?.documents || book?.documentResponses || [];
  const bookDocument = documents.find((document) =>
    ["BOOK_DOCUMENT", "BOOK_FILE", "BOOK_PDF"].includes(document.documentType)
  );

  return book?.documentUrl || book?.document_url || bookDocument?.url || null;
}

export function getBooksFromResponse(response) {
  const payload = response?.data?.data ?? response?.data;

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.content)) {
    return payload.content;
  }

  return [];
}

export function getBookBranchId(book) {
  return book?.branchId || book?.branch_id || "";
}

export function getBookStoreId(book) {
  return book?.storeId || book?.store_id || "";
}

export function isBookAvailable(book) {
  return book?.approved ?? true;
}
