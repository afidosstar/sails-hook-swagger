

module.exports = {
    attributes:{
        title:{
            type: 'string',
            unique: true,
            required: true,
        },
        content: {
            type: 'string'
        },
        author: {
            model: 'user'
        },
        status:{
            type: 'string',
            isIn: ['PUPLUSHED','EDITING','LOKED']
        },
        categories:{
            collection: 'category',
            via: 'posts',
            dominant: true
        }
    }
}