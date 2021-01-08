const conexion = require('../db');
const { promisify } = require('util');
const { runInNewContext } = require('vm');
const queryMysql = promisify(conexion.query).bind(conexion);

module.exports = {
  getUsers: async (req, resp, next) => {
    try {
      const query = 'SELECT * FROM USERS'
      let result = await queryMysql(query)

      result = result.map(user => ({
        id: user.id,
        email: user.email,
        roles: JSON.parse(user.roles)
      }))

      resp.status(200).json({
        users: result
      })
    } catch(err){
      console.log(err)
      next(err)
    }
  },
  getUser: async (req, resp, next) => {
    try {
      const uid = req.params.uid
      console.log('-- uid --')
      console.log(uid)

      let user = null
      if(isNaN(parseInt(uid))){
        // is email
        const query = `SELECT * FROM USERS WHERE EMAIL = "${uid}"`
        let result = await queryMysql(query)
        console.log('-- result --')
        console.log(result)

        if(result && result.length === 1){
          user = result[0]
        }
      } else {
        // is integer
        const query = `SELECT * FROM USERS WHERE ID = ${uid}`
        let result = await queryMysql(query)

        if(result && result.length === 1){
          user = result[0]
        }
      }

      if(user){
        user.roles = JSON.parse(user.roles)
      }

      console.log('-- req.user --')
      console.log(req.user)

      console.log('-- user --')
      console.log(user)
      
      // valid exists user
      if(!user){
        next(404)
        return
      }

      // valid get info if isa admin
      if(!req.user.roles.admin && user.id !== req.user.id){
        next(403)
        return
      }

      return resp.status(200).json({ user })
    } catch(err){
      console.log(err)
      next(err)
    }
  },
  createUser: async (req, resp, next) => {
    try {
      const user = req.body

      // valid email is unique
      let query = `SELECT * FROM USERS WHERE EMAIL = "${user.email}"`
      let result = await queryMysql(query)
      console.log('-- result --')
      console.log(result)

      if(result && result.length === 1){
        next(403)
      }

      // get new id
      query = 'SELECT MAX(ID) + 1 AS ID FROM USERS'
      result = await queryMysql(query)
      console.log('-- result --')
      console.log(result)

      let id = null
      if(result && result.length === 1){
        id = result[0].ID
      }

      console.log('-- id --')
      console.log(id)

      // create user
      query = `INSERT INTO USERS VALUES (${id},'${user.email}','${user.password}','${JSON.stringify(user.roles)}')`
      result = await queryMysql(query)

      console.log('-- result --')
      console.log(result)

      return resp.status(200).json({ user })
    } catch(err){
      console.log(err)
      next(err)
    }
  }
};
