const authentication = (req, res, next) => {
    let api_key = req.header("x-api-key"); //Add API key to headers
    if(req.header('x-api-key')){
        if (api_key == process.env.API_KEY) {
            next();
        } else {
            res.status(403).json({
                status: false,
                message: 'invalid API key'
            });
        }
    }else{
        const authheader = req.headers.authorization;
        console.log(req.headers);    
        if (!authheader) {
            res.setHeader('WWW-Authenticate', 'Basic');
            return res.status(401).json({"message":"You are not autheticated"});
        }    
        const auth = new Buffer.from(authheader.split(' ')[1],'base64').toString().split(':');
        const user = auth[0];
        const pass = auth[1];
        if (user == process.env.BASIC_AUTH_USERNAME && pass == process.env.BASIC_AUTH_PASSWORD) {
            next();
        } else {
            res.setHeader('WWW-Authenticate', 'Basic');
            return res.status(401).json({"message":"You are not autheticated"});
        }
    }
};

  module.exports = {authentication};