const errorHandler = (err, req, res, next) => {
  console.error(err); 
  // Create a copy of the error object
  let error = { ...err };
  error.message = err.message;

  res.status(error.statusCode || 500).json({
    error: error.message || "Internal Server Error" ,
  });
};

module.exports = errorHandler;
