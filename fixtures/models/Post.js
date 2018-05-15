

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
        categories:{
            collection: 'category',
            via: 'posts',
            dominant: true
        }
    }
}