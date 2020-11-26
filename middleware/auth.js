const jwt = require('jsonwebtoken');
const config = require('config');

module.exports = function(req,res,next){
    //Get Token from header
    const token = req.header('x-auth-token');

    //Check if token
    if(!token){
        return res.status(401).json({msg:"No Token authorization denied"});
    }

    try {
        const decode = jwt.verify(token,config.get('jwtSecret'));
        req.user = decode.user;
        next();
    } catch(err) {
        res.status(401).json({msg:"Invalid auth Token"});
    }
}