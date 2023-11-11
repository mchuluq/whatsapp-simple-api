const {Client,LocalAuth,MessageMedia} = require('whatsapp-web.js');
const express = require('express');
const socketIO = require('socket.io');
const qrcode = require('qrcode');
const http = require('http');
const fileUpload = require('express-fileupload');

const dotenv = require('dotenv');
dotenv.config();

const {body, validationResult} = require('express-validator');
const {phoneNumberFormatter} = require('./helpers/formatter');
const {imageTypeValidator,fileSizeValidator} = require('./helpers/validator');
const auth = require('./helpers/auth');

const checkRegisteredNumber = async function(number){
    const isRegistered = await client.isRegisteredUser(number);
    return isRegistered;
}

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(fileUpload({
    debug : process.env.DEBUG
}));

const client = new Client({
    puppeteer : {
        headless: true,
        executablePath: '/usr/bin/google-chrome',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process', // <- this one doesn't works in Windows
            '--disable-gpu'
        ]
    },
    authStrategy: new LocalAuth({
        clientId: "sister-whatsapp-client"
    })
});

client.on('message', msg => {
    if(msg.body == '!ping'){
        msg.reply('pong!!!');
    }
});

client.initialize();

app.get('/',auth.authentication,(req,res) => {
    return res.sendFile('static/index.html',{root : __dirname})
});

io.on('connection',function(socket){
    socket.emit('message','Connecting... to '+process.env.APP_NAME);
    client.on('qr',(qr) => {
        console.log("QR received", qr);
        qrcode.toDataURL(qr,(err,url) => {
            socket.emit('qr',url);
            socket.emit('message','QR code received, scan please');
        })
    });
    client.on('ready',() => {
        socket.emit('message','whatsapp is ready');
        socket.emit('ready','whatsapp is ready');
        console.log("whatsapp is ready");
    });
    client.on('authenticated',() => {
        socket.emit('authenticated','whatsapp is authenticated');
        socket.emit('message','whatsapp is authenticated');
        console.log("whatsapp is authenticated");
    });
})

app.post('/send-message',auth.authentication, [
    body("number").notEmpty(),
    body("message").notEmpty(),
], async (req,res) => {
    const errors = validationResult(req).formatWith(({msg}) => {
        return msg
    })

    if(!errors.isEmpty()){
        return res.status(422).json({
            status: false,
            message: 'invalid input',
            errors : errors.mapped()
        });
    }

    const number = phoneNumberFormatter(req.body.number);
    const message = req.body.message;

    const isRegisteredNumber = await checkRegisteredNumber(number);
    if(!isRegisteredNumber){
        return res.status(422).json({
            status: false,
            message: "phone number not registered"
        });
    }

    client.sendMessage(number,message).then(resp => {
        res.status(200).json({
            status: true,
            response: resp
        });
    }).catch(err => {
        res.status(500).json({
            status: false,
            response: err
        }) 
    });
})

app.post('/send-media',auth.authentication, [
    body("number").notEmpty(),
    body("caption").notEmpty(),
], async (req,res) => {
    const errors = validationResult(req).formatWith(({msg}) => {
        return msg
    })

    // form validation
    if(!errors.isEmpty()){
        return res.status(422).json({
            status: false,
            message: 'invalid input',
            errors : errors.mapped()
        });
    }
    if(!req.files){
        return res.status(422).json({
            status: false,
            message: 'invalid input',
            errors : {'file':'File is required'}
        });
    }

    // get input
    const number = phoneNumberFormatter(req.body.number);
    const caption = req.body.caption;
    const file = req.files.file;

    // registered number validation
    const isRegisteredNumber = await checkRegisteredNumber(number);
    if(!isRegisteredNumber){
        return res.status(422).json({
            status: false,
            message: "phone number not registered"
        });
    }

    // file size & type vallidation
    if(!fileSizeValidator(file,1) || !imageTypeValidator(file)){
        return res.status(422).json({
            status: false,
            message: "invalid file upload"
        });
    }

    // return res.status(200).json({
    //     status: true,
    //     message: "OK",
    //     data : {
    //         number : number,
    //         caption : caption
    //     }
    // });

    // send media w/ caption
    const media = new MessageMedia(file.mimetype,file.data.toString('base64'),file.name);
    client.sendMessage(number,media,{caption:caption}).then(resp => {
        res.status(200).json({
            status: true,
            response: resp
        });
    }).catch(err => {
        res.status(500).json({
            status: false,
            response: err
        }) 
    });
})

server.listen(process.env.APP_PORT,function(){
    console.log("App running at port :"+process.env.APP_PORT);
});