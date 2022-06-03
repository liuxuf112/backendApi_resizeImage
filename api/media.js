




const { Router } = require('express')
const { append } = require('express/lib/response')

const multer = require('multer')
const crypto = require('crypto')




const {
    
    
    getDownloadStreamByFilename,
    getDownloadStreamByFilename_thumbs
  
} = require('../models/media')

const router = Router()


router.get('/images/:filename', function (req, res, next) {
    getDownloadStreamByFilename(req.params.filename)
      .on('file', function (file) {
        res.status(200).type(file.metadata.mimetype)
      })
      .on('error', function (err) {
        if (err.code === 'ENOENT') {
          next()
        } else {
          next(err)
        }
      })
      .pipe(res)
})
  
  


router.get('/thumbs/:filename', function (req, res, next) {
  getDownloadStreamByFilename_thumbs(req.params.filename)
    .on('file', function (file) {
      res.status(200).type(file.metadata.mimetype)
    })
    .on('error', function (err) {
      if (err.code === 'ENOENT') {
        next()
      } else {
        next(err)
      }
    })
    .pipe(res)
})
  

module.exports = router