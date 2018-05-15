
module.exports = {
    attributes:{
        label:{
            type: 'string',
        },
        posts: {
            collection: 'post',
            via: 'categories'
        }
    }
}