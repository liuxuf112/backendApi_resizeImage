/*
 * API sub-router for businesses collection endpoints.
 */

const { Router } = require('express')
const { append } = require('express/lib/response')
const fs = require('fs/promises')

const { connectToRabbitMQ, getChannel } = require('../lib/rabbitmq')

const multer = require('multer')
const crypto = require('crypto')

const queue = 'images'

const fileTypes = {
  'image/jpeg': 'jpg',
  'image/png': 'png'
}

const upload = multer({
  storage: multer.diskStorage({
    destination: `${__dirname}/uploads`,
    filename: function (req, file, callback) {
      const ext = fileTypes[file.mimetype]
      const filename = crypto.pseudoRandomBytes(16).toString('hex')
      callback(null, `${filename}.${ext}`)
    }
  }),
  fileFilter: function (req, file, callback) {
    callback(null, !!fileTypes[file.mimetype])
  }
})






const { validateAgainstSchema } = require('../lib/validation')
const {
  PhotoSchema,
  insertNewPhoto,
  getPhotoById,
  saveImageFile,
  saveImageInfo,
  getImageInfoById,
  getImageDownloadStream

} = require('../models/photo')

const router = Router()

/*
 * POST /photos - Route to create a new photo.
 */
// router.post('/', async (req, res) => {
//   if (validateAgainstSchema(req.body, PhotoSchema)) {
//     try {
//       const id = await insertNewPhoto(req.body)
//       res.status(201).send({
//         id: id,
//         links: {
//           photo: `/photos/${id}`,
//           business: `/businesses/${req.body.businessId}`
//         }
//       })
//     } catch (err) {
//       console.error(err)
//       res.status(500).send({
//         error: "Error inserting photo into DB.  Please try again later."
//       })
//     }
//   } else {
//     res.status(400).send({
//       error: "Request body is not a valid photo object"
//     })
//   }
// })


router.post('/', upload.single('image'), async function (req, res, next) {
  console.log("== req.file:", req.file)
  console.log("== req.body:", req.body)
  if (req.file && req.body && req.body.businessId) {
    const image = {
      businessId: req.body.businessId,
      caption: req.body.caption,
      path: req.file.path,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      thumbId: null
    }


    // const id = await saveImageInfo(image)
    
    const id = await saveImageFile(image)
    await fs.unlink(req.file.path)

    const channel = getChannel()
    channel.sendToQueue(queue, Buffer.from(id.toString()))

    res.status(200).send({ id: id })
  } else {
    res.status(400).send({
      err: 'Request body needs an "image" and a "businessId"'
    })
  }
})





/*
 * GET /photos/{id} - Route to fetch info about a specific photo.
 */
// router.get('/:id', async (req, res, next) => {
//   try {
//     const photo = await getPhotoById(req.params.id)
//     if (photo) {
//       res.status(200).send(photo)
//     } else {
//       next()
//     }
//   } catch (err) {
//     console.error(err)
//     res.status(500).send({
//       error: "Unable to fetch photo.  Please try again later."
//     })
//   }
// })
router.get('/:id', async (req, res, next) => {
  try {
    const image = await getImageInfoById(req.params.id);
    if (image) {
      const resBody = {
        _id: image._id,
        url: `/media/images/${image.filename}`,
        mimetype: image.metadata.mimetype,
        businessId: image.metadata.businessId,
        thumbId: image.metadata.thumbId
      }
      res.status(200).send(resBody);
    } else {
      next();
    }
  } catch (err) {
    next(err);
  }
})





module.exports = router
