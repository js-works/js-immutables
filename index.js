'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./dist/js-immutables.cjs.production.js')
} else {
  module.exports = require('./dist/js-immutables.cjs.development.js')
}
