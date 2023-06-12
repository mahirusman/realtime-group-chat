const paginationResponse = (records, page, resPerPage, count) => {
  return {
    records,
    paginationInfo: {
      currentPage: Number(page),
      pages: Math.ceil(count / resPerPage),
      totalRecords: Number(count),
      perPage: Number(resPerPage),
    },
  };
};

module.exports = paginationResponse