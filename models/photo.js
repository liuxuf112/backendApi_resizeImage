/*
 * Photo schema and data accessor methods.
 */
const { Readable } = require('stream')
const fs = require('fs')
const { ObjectId, GridFSBucket } = require('mongodb')

const { getDbReference } = require('../lib/mongo')
const { extractValidFields } = require('../lib/validation')

/*
 * Schema describing required/optional fields of a photo object.
 */
const PhotoSchema = {
  businessId: { required: true },
  caption: { required: false }
}
exports.PhotoSchema = PhotoSchema

/*
 * Executes a DB query to insert a new photo into the database.  Returns
 * a Promise that resolves to the ID of the newly-created photo entry.
 */
async function insertNewPhoto(photo) {
  photo = extractValidFields(photo, PhotoSchema)
  photo.businessId = ObjectId(photo.businessId)
  const db = getDbReference()
  const collection = db.collection('photos')
  const result = await collection.insertOne(photo)
  return result.insertedId
}
exports.insertNewPhoto = insertNewPhoto

/*
 * Executes a DB query to fetch a single specified photo based on its ID.
 * Returns a Promise that resolves to an object containing the requested
 * photo.  If no photo with the specified ID exists, the returned Promise
 * will resolve to null.
 */
async function getPhotoById(id) {
  const db = getDbReference()
  const collection = db.collection('photos')
  if (!ObjectId.isValid(id)) {
    return null
  } else {
    const results = await collection
      .find({ _id: new ObjectId(id) })
      .toArray()
    return results[0]
  }
}
exports.getPhotoById = getPhotoById



async function saveImageInfo (image) {
  const db = getDbReference();
  const collection = db.collection('photos');
  const result = await collection.insertOne(image);
  return result.insertedId;
}


exports.saveImageInfo = saveImageInfo





function saveImageFile (image) {
  return new Promise(function (resolve, reject) {
    const db = getDbReference();
    const bucket = new GridFSBucket(db, { bucketName: 'images' })
    const metadata = {
      businessId: image.businessId,
      caption: image.caption,
      mimetype: image.mimetype
    }
    const uploadStream = bucket.openUploadStream(image.filename, {
      metadata: metadata
    })
    fs.createReadStream(image.path).pipe(uploadStream)
      .on('error', function (err) {
        reject(err)
      })
      .on('finish', function (result) {
        console.log("== stream result:", result)
        resolve(result._id)
      })
  })
}

exports.saveImageFile = saveImageFile


async function getImageInfoById (id) {
  const db = getDbReference();
  // const collection = db.collection('images');
  const bucket = new GridFSBucket(db, { bucketName: 'images' })

  if (!ObjectId.isValid(id)) {
    return null;
  } else {
    const results = await bucket.find({ _id: new ObjectId(id) })
      .toArray();
    return results[0];
  }
}

exports.getImageInfoById = getImageInfoById




function saveImageFile_thumbs (image, buffer) {
  return new Promise(function (resolve, reject) {
    const db = getDbReference();
    const bucket = new GridFSBucket(db, { bucketName: 'thumbs' })
    const metadata = {
      
      mimetype: image.mimetype,
      filename: image.filename
      
    }
    const uploadStream = bucket.openUploadStream(image.filename, {
      metadata: metadata
    })

    const readableStream  = new Readable()
    readableStream._read = () => {}
    readableStream.push(buffer) //process
    readableStream.push(null) //end
    readableStream.pipe(uploadStream)
      .on('error', function (err) {
        reject(err)
      })
      .on('finish', function (result) {
        //console.log("== stream result:", result)
        resolve(result._id)
      })
  })
}

exports.saveImageFile_thumbs = saveImageFile_thumbs


async function getImageInfoById_thumbs (id) {
  const db = getDbReference();
  // const collection = db.collection('images');
  const bucket = new GridFSBucket(db, { bucketName: 'thumbs' })

  if (!ObjectId.isValid(id)) {
    return null;
  } else {
    const results = await bucket.find({ _id: new ObjectId(id) })
      .toArray();
    return results[0];
  }
}

exports.getImageInfoById_thumbs = getImageInfoById_thumbs