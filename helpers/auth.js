const authenticateKey = (req, res, next) => {
    let api_key = req.header("x-api-key"); //Add API key to headers
    if (api_key == process.env.API_KEY) {
        next();
    } else {
        res.status(403).json({
            status: false,
            message: 'invalid API key'
        });
    }
  };

  module.exports = {authenticateKey};