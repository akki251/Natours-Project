// NOTE: VVVIMP, we are returning anonymous function, can be assumed, it is returning back to createTour
const catchAsync = func => {
  return (req, res, next) => {
    func(req, res, next).catch(err => next(err));
  };
};

module.exports = catchAsync;
