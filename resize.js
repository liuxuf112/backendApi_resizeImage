const sharp = require('sharp')

const fs = require('fs')
const { connectToDb } = require('./lib/mongo')
const { connectToRabbitMQ, getChannel } = require('./lib/rabbitmq')

const {
    
    getDownloadStreamById,
    updateImageTagsById
  
} = require('./models/media')

const {
    
    saveImageFile_thumbs,
    getImageInfoById_thumbs,
    getImageInfoById
    
  
} = require('./models/photo')


const queue = 'images'



connectToDb(async function () {
    
    await connectToRabbitMQ(queue)
    const channel = getChannel()
    

    channel.consume(queue, async function (msg) {
        if (msg) {
            const id = msg.content.toString()
            const downloadStream = getDownloadStreamById(id)
            const image_data = await getImageInfoById(id)

            const imageData = []
            downloadStream.on('data', function (data) {
                imageData.push(data)
            })
            downloadStream.on('end', async function () {

                const thumbsfilename = image_data.filename

                console.log('thumbsfilename is ', thumbsfilename)

                const thumbspath = `${__dirname}/thumbs/${thumbsfilename}`
                
                const imagebuffer = Buffer.concat(imageData)
                const resizeImage = await sharp(imagebuffer).resize(100, 100).jpeg().toBuffer()
                
                const thumbsImage = {
                    filename: thumbsfilename,
                    path: thumbspath,
                    mimetype: 'image/jpeg'
                }
                
                const thumbs_id = await saveImageFile_thumbs(thumbsImage, resizeImage)
                
                await updateImageTagsById(id, thumbs_id)
                console.log(`test 5`)

            })
        }

        
        channel.ack(msg)
    })
})
