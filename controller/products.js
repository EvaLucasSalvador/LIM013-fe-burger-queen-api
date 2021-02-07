const { promisify } = require('util');
const conexion = require('../db');

const queryMysql = promisify(conexion.query).bind(conexion);

async function findProductById(productId) {
  let product = null;

  const query = `SELECT * FROM PRODUCTS WHERE ID = ${productId} AND STATUS = 1`;
  const result = await queryMysql(query);
  console.log('-- result --');
  console.log(result);

  if (result && result.length === 1) {
    product = result[0];
  }
  return product;
}

function parseDateToOracle(date) {
  const mm = date.getMonth() + 1; // getMonth() is zero-based
  const dd = date.getDate();

  return [date.getFullYear(),
    (mm > 9 ? '' : '0') + mm,
    (dd > 9 ? '' : '0') + dd,
  ].join('-');
}

module.exports = {
  getProducts: async (req, resp, next) => {
    try {
      let { page, limit } = req.query;
      page = parseInt(page);
      limit = parseInt(limit);

      let query = `SELECT * FROM PRODUCTS WHERE STATUS = 1 LIMIT ${limit} OFFSET ${(page - 1) * limit}`;
      const result = await queryMysql(query);

      query = 'SELECT COUNT(*) AS TOTAL FROM PRODUCTS WHERE STATUS = 1';
      let length = await queryMysql(query);
      length = length[0].TOTAL;
      console.log('-- length --');
      console.log(length);
      const max = parseInt(length / limit) + 1;
      console.log('-- max --');
      console.log(max);

      if (page > max) {
        next(403);
        return;
      }

      const link = {
        first: `http://localhost:8080/products?page=1&limit=${limit}`,
        prev: `http://localhost:8080/products?page=${page > 1 ? page - 1 : 1}&limit=${limit}`,
        last: `http://localhost:8080/products?page=${max}&limit=${limit}`,
        next: `http://localhost:8080/products?page=${page < max ? page + 1 : max}&limit=${limit}`,
      };

      resp.append('link', JSON.stringify(link));
      // resp.append( 'link', link)

      resp.status(200).json({
        products: result,
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  },
  getProduct: async (req, resp, next) => {
    try {
      const { productId } = req.params;
      console.log('-- productId --');
      console.log(productId);

      const product = await findProductById(productId);

      console.log('-- product --');
      console.log(product);

      // valid exists product
      if (!product) {
        next(404);
        return;
      }

      return resp.status(200).json({ product });
    } catch (err) {
      console.log(err);
      next(err);
    }
  },
  createProduct: async (req, resp, next) => {
    try {
      const {
        name, price, image, type,
      } = req.body;

      // create user
      const today = new Date();
      query = `INSERT INTO PRODUCTS VALUES (DEFAULT, '${name}', ${price}, '${image}', '${type}', STR_TO_DATE('${parseDateToOracle(today)}', '%Y-%m-%d'), DEFAULT)`;
      result = await queryMysql(query);

      product = await findProductById(result.insertId);
      delete product.status;

      return resp.status(200).json({ product });
    } catch (err) {
      console.log(err);
      next(err);
    }
  },
  updateProduct: async (req, resp, next) => {
    try {
      const { productId } = req.params;
      console.log('-- productId --');
      console.log(productId);

      let product = await findProductById(productId);

      console.log('-- req.user --');
      console.log(req.user);

      console.log('-- product --');
      console.log(product);

      // valid exists product
      if (!product) {
        next(404);
        return;
      }

      // valid get info if is a admin
      if (!req.user.roles.admin && user.id !== req.user.id) {
        next(403);
        return;
      }

      // generate password hash

      const variables = [];
      if (req.body) {
        for (const prop in req.body) {
          if (prop === 'price') {
            variables.push(`${prop.toUpperCase()} = ${req.body[prop]}`);
          } else {
            variables.push(`${prop.toUpperCase()} = '${req.body[prop]}'`);
          }
        }
      }
      const query = `UPDATE PRODUCTS SET ${variables.join(', ')} WHERE ID = ${productId}`;
      console.log('-- query --');
      console.log(query);
      const result = await queryMysql(query);

      console.log('-- result update product --');
      console.log(result);

      product = await findProductById(productId);

      return resp.status(200).json({ product });
    } catch (err) {
      console.log(err);
      next(err);
    }
  },
  deleteProduct: async (req, resp, next) => {
    try {
      const { productId } = req.params;
      console.log('-- productId --');
      console.log(productId);

      const product = await findProductById(productId);

      console.log('-- req.user --');
      console.log(req.user);

      console.log('-- product --');
      console.log(product);

      // valid exists product
      if (!product) {
        next(404);
        return;
      }

      // valid get info if is a admin
      if (!req.user.roles.admin) {
        next(403);
        return;
      }

      const query = `UPDATE PRODUCTS SET STATUS = 0 WHERE ID = ${product.id}`;
      const result = await queryMysql(query);

      console.log('-- result delete product --');
      console.log(result);

      product.status = 0;

      return resp.status(200).json({ product });
    } catch (err) {
      console.log(err);
      next(err);
    }
  },
};
