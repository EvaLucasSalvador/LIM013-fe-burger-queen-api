/* eslint-disable linebreak-style */
const jwt = require('jsonwebtoken');
//const bcrypt = require('bcrypt');
const config = require('../config.js');

const conexion = require('../db');
const { validationResult, body, param, query } = require('express-validator');
const { promisify } = require('util');
const queryMysql = promisify(conexion.query).bind(conexion);

const { secret } = config;

/** @module auth */
module.exports = (app, nextMain) => {
  /**
     * @name /auth
     * @description Crea token de autenticación.
     * @path {POST} /auth
     * @body {String} email Correo
     * @body {String} password Contraseña
     * @response {Object} resp
     * @response {String} resp.token Token a usar para los requests sucesivos
     * @code {200} si la autenticación es correcta
     * @code {400} si no se proveen `email` o `password` o ninguno de los dos
     * @auth No requiere autenticación
     */

  app.post('/auth', 
    [
      body('email').isEmail(),
      body('password').isString()
    ],
    async (req, resp, next) => {
      const errors = validationResult(req)
      if(!errors.isEmpty()){
        return resp.status(400).json({
          success: 0,
          errors: errors.array()
        })
      }

      try {

        const query = `SELECT * FROM users WHERE email = "${req.body.email}"`;
        const result = await queryMysql(query)
        
        console.log('-- result --')
        console.log(result)

        if(result && result.length === 0){
          throw new Error('Invalid email.')
        }

        const pass = req.body.password === result[0].password;
        if(!pass){
          throw new Error('Invalid password.')
        }

        const jsontoken = jwt.sign({ result }, secret, {
          expiresIn: '1h',
        });
        resp.header('authorization', jsontoken);
        resp.status(200).json({
          success: 1,
          message: 'login successfully',
          token: jsontoken,
        });

      } catch(error){
        return resp.status(400).json({
          success: 0,
          errors: [
            {
              msg: error.message
            }
          ]
        });
      };
  });

  return nextMain();
};