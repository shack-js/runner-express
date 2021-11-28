const os = require('os')

module.exports.hello = async (firstName,lastName) => `hello ${firstName} ${lastName}! from ${os.platform()}`