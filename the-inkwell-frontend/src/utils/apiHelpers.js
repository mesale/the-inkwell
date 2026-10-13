export const unwrapList = (res) => {
  const data = res.data?.data;
  if (Array.isArray(data)) return data;           // direct array
  if (Array.isArray(data?.content)) return data.content; // paginated
  return [];
};

export const unwrapItem = (res) => {
  const data = res.data?.data;
  if (data && typeof data === "object" && !Array.isArray(data)) return data;
  return null;
};