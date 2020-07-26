const mongoose = require('mongoose');

const Book = require('../models/book');

module.exports = {};

module.exports.getAll = (page, perPage) => {
  return Book.find().limit(perPage).skip(perPage*page).lean();
}

module.exports.getById = (bookId) => {
  if (!mongoose.Types.ObjectId.isValid(bookId)) {
    return null;
  }
  return Book.findOne({ _id: bookId }).lean();
}

module.exports.getByAuthorId = (authorId) => {
  if (!mongoose.Types.ObjectId.isValid(authorId)) {
    return null;
  }
  return Book.find({ authorId: authorId });
}

module.exports.getBySearchTerm = (query) => {
    return Book.find(
      { $text: {$search: query}},
      { score: {$meta: "textScore"}}
      )
      .sort({ score: { $meta: "textScore" }}).lean();
}

module.exports.getAuthorStats = () => {
  return Book.aggregate([
    { $group: {
        _id: "$authorId",
        averagePageCount: { $avg: "$pageCount" },
        numBooks: { $sum: 1 },
        titles: { $addToSet: "$title" }
      }
    },
    {
      $project: {
        _id: 0,
        authorId: "$_id",
        averagePageCount: 1,
        numBooks: 1,
        titles: 1,
      },
    }
 ])
}

module.exports.getAuthorStatsAndInfo = () => {
  return Book.aggregate([
    {
      $group: {
        _id: "$authorId",
        averagePageCount: { $avg: "$pageCount" },
        numBooks: { $sum: 1 },
        titles: { $addToSet: "$title" },
      },
    },
    {
      $project: {
        _id: 0,
        authorId: "$_id",
        averagePageCount: 1,
        numBooks: 1,
        titles: 1,
      },
    },
    {
      $lookup: {
        from: "authors",
        localField: "_id",
        foreignField: "authorId",
        as: "author",
      },
    },
    { $unwind: "$author" }
 ])
}

module.exports.deleteById = async (bookId) => {
  if (!mongoose.Types.ObjectId.isValid(bookId)) {
    return false;
  }
  await Book.deleteOne({ _id: bookId });
  return true;
}

module.exports.updateById = async (bookId, newObj) => {
  if (!mongoose.Types.ObjectId.isValid(bookId)) {
    return false;
  }
  await Book.updateOne({ _id: bookId }, newObj);
  return true;
}

module.exports.create = async (bookData) => {
  try {
    const created = await Book.create(bookData);
    return created;
  } catch (e) {
    if (e.message.includes('validation failed')) {
      throw new BadDataError(e.message);
    }
    throw e;
  }
}

class BadDataError extends Error {};
module.exports.BadDataError = BadDataError;