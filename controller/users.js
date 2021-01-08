const conexion = require('../db');
const { promisify } = require('util');
const { runInNewContext } = require('vm');
const { json } = require('body-parser');
const queryMysql = promisify(conexion.query).bind(conexion);
const bcrypt = require('bcrypt')

async function findUserByUid(uid){
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
  return user
}

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

      const link = { "first":"https://laboratoria.github.io/burger-queen-api/module-users.html","prev":"https://laboratoria.github.io/burger-queen-api/module-users.html","last":"https://laboratoria.github.io/burger-queen-api/module-users.html","next":"https://laboratoria.github.io/burger-queen-api/module-users.html"}
      
      resp.append( 'link', JSON.stringify(link))
      // resp.append( 'link', link)

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

      let user = await getUserByUid(uid)

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
      let user = req.body

      // valid email is unique
      let query = `SELECT * FROM USERS WHERE EMAIL = "${user.email}"`
      let result = await queryMysql(query)
      console.log('-- result --')
      console.log(result)

      if(result && result.length > 0 ){
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

      user.password = bcrypt.hashSync(user.password, 10)

      // create user
      query = `INSERT INTO USERS VALUES (${id},'${user.email}','${user.password}','${JSON.stringify(user.roles)}')`
      result = await queryMysql(query)

      console.log('-- result --')
      console.log(result)

      user = await findUserByUid(user.email)
      delete user.password

      return resp.status(200).json({ user })
    } catch(err){
      console.log(err)
      next(err)
    }
  },
  updateUser: async (req, resp, next) => {
    try {
      const uid = req.params.uid
      console.log('-- uid --')
      console.log(uid)

      let user = await findUserByUid(uid)
      
      console.log('-- req.user --')
      console.log(req.user)

      console.log('-- user --')
      console.log(user)

      // valid exists user
      if(!user){
        next(404)
        return
      }

      // valid get info if is a admin
      if(!req.user.roles.admin && user.id !== req.user.id){
        next(403)
        return
      }

      // valid if is admin to change role
      if(req.body.roles && !req.user.roles.admin){
        next(403)
        return
      }

      // generate password hash
      req.body.password = bcrypt.hashSync(req.body.password, 10)

      let queryArray = [`UPDATE USERS SET EMAIL = '${req.body.email}', PASSWORD = '${req.body.password}'`]
      
      if(req.body.roles){
        queryArray.push(`, ROLES = '${JSON.stringify(req.body.roles)}'`)
      }

      queryArray.push(`WHERE ID = ${user.id}`)
      
      const query = queryArray.join(' ')
      console.log('-- query --')
      console.log(query)
      const result = await queryMysql(query)

      console.log('-- result update user --')
      console.log(result)

      user = await findUserByUid(uid)

      return resp.status(200).json({ user })
    } catch(err){
      console.log(err)
      next(err)
    }
  },
  deleteUser: async (req, resp, next) => {
    try {
      const uid = req.params.uid
      console.log('-- uid --')
      console.log(uid)

      let user = await findUserByUid(uid)
      
      console.log('-- req.user --')
      console.log(req.user)

      console.log('-- user --')
      console.log(user)

      // valid exists user
      if(!user){
        next(404)
        return
      }

      // valid get info if is a admin
      if(!req.user.roles.admin && user.id !== req.user.id){
        next(403)
        return
      }

      const query = `DELETE FROM USERS WHERE ID = ${user.id}`
      const result = await queryMysql(query)

      console.log('-- result delete user --')
      console.log(result)

      return resp.status(200).json({ user })
    } catch(err){
      console.log(err)
      next(err)
    }
  }
};
