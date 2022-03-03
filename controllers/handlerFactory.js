const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

/// STANDARD TEMPLATE FOR DELETEONE CONTROLLER
exports.deleteOne = Model => {
  return catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      // NOTE: dont forget to write return
      return next(new AppError('No doc found with that Id', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  });
};

exports.updateOne = Model => {
  return catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!doc) {
      // NOTE: dont forget to write return
      return next(new AppError('No doc found with that Id', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        doc
      }
    });
  });
};

exports.createOne = Model => {
  return catchAsync(async (req, res, next) => {
    const newDoc = await Model.create(req.body);

    res.status(200).json({
      status: 'success',
      data: {
        tour: newDoc
      }
    });
  });
};
