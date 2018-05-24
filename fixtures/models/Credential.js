

module.exports = {
    username: {
        type: 'string'
    },
    password: {
        type: 'string'
    },
   user:{
    model: 'user',
    required: true,
    //unique: true,
  }
}