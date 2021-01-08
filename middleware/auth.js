/* eslint-disable linebreak-style */
const jwt = require('jsonwebtoken');
const conexion = require('../db');
const { promisify } = require('util')
const queryMysql = promisify(conexion.query).bind(conexion);

module.exports = (secret) => (req, resp, next) => {
  const { authorization } = req.headers;

  if (!authorization) {
    return next();
  }

  const [type, token] = authorization.split(' ');

  if (type.toLowerCase() !== 'bearer') {
    return next();
  }

  jwt.verify(token, secret, async (err, decodedToken) => {
    if (err) {
      return next(403);
    }

    // TODO: Verificar identidad del usuario usando `decodeToken.uid`
    try {
      const query = `SELECT * FROM users WHERE id = ${decodedToken.id}`;
      const result = await queryMysql(query)

      if(result && result.length === 0){
        // console.log('entro');
        next(404);
      }

      req.user = {
        id: result[0].id,
        roles: JSON.parse(result[0].roles)
      };
      next();

    } catch(error){
      if (error) throw error;
    }
  });
};

module.exports.isAuthenticated = (req) => {
  // TODO: decidir por la informacion del request si la usuaria esta autenticada
  console.log('-- req.user --')
  console.log(req.user)
  if (req.user) {
    // console.log('entro2');
    return true;
  }
  return false;
};


module.exports.isAdmin = (req) => {
  // TODO: decidir por la informacion del request si la usuaria es admin
  if (req.user.roles && req.user.roles.admin) {
    // console.log('entro3');
    return true;
  }
  return false;
};


module.exports.requireAuth = (req, resp, next) => (
  (!module.exports.isAuthenticated(req))
    ? next(401)
    : next()
);


module.exports.requireAdmin = (req, resp, next) => (
  // eslint-disable-next-line no-nested-ternary
  (!module.exports.isAuthenticated(req))
    ? next(401)
    : (!module.exports.isAdmin(req))
      ? next(403)
      : next()
);
