



const fs = require('fs')
const { ObjectId, GridFSBucket } = require('mongodb')

const { getDbReference } = require('../lib/mongo')
const { extractValidFields } = require('../lib/validation')



exports.getDownloadStreamByFilename = function(filename) {
    const db = getDbReference()
    const bucket = new GridFSBucket(db, { bucketName: 'images' })
    return bucket.openDownloadStreamByName(filename)
  
}


exports.getDownloadStreamByFilename_thumbs = function(filename) {
  const db = getDbReference()
  const bucket = new GridFSBucket(db, { bucketName: 'thumbs' })
  return bucket.openDownloadStreamByName(filename)
}


exports.getDownloadStreamById = function (id) {
  const db = getDbReference()
  const bucket = new GridFSBucket(db, { bucketName: 'images' })
  if (!ObjectId.isValid(id)) {
    return null
  } else {
    return bucket.openDownloadStream(new ObjectId(id))
  }
}


exports.updateImageTagsById = async function (id, thumbId) {
  console.log(`test3`)
  const db = getDbReference()
  const collection = db.collection('images.files')
  if (!ObjectId.isValid(id)) {
    return null
  } else {
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { "metadata.thumbId": thumbId }}
    )
    return result.matchedCount > 0
  }
}