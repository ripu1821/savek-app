// utils/responseHelpers.js
export const makePagination = ({ items = [], total = 0, page = 1, limit = 20 }) => {
  const p = Number(page) || 1;
  const l = Number(limit) || 20;
  const totalPages = l > 0 ? Math.ceil(total / l) : 0;
  return {
    items,
    total,
    page: p,
    limit: l,
    totalPages,
    currentPageItems: Array.isArray(items) ? items.length : 0,
    previousPage: p > 1,
    nextPage: p * l < total,
  };
};

export const sendSuccess = (res, { message = "Success", status = 200, payload = {} }) => {
  // payload should already be an object (e.g. result of makePagination or { items:[], meta:{} } )
  return res.status(status).json({
    success: true,
    status,
    message,
    data: payload,
  });
};

export const sendError = (res, { message = "Error", status = 500, payload = {} }) => {
  return res.status(status).json({
    success: false,
    status,
    message,
    data: payload,
  });
};
