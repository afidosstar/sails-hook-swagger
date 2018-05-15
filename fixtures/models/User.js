
module.exports = {
    attributes:{
        fullname: {
            type: 'string'
        },
        credeantial:{
            model: 'credential',
            required: true,
            //unique: true,
        }
    }
}