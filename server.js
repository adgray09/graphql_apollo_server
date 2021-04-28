const { ApolloServer, gql, PubSub, PubSubEngine } = require('apollo-server');
const pubsub = new PubSub();

const typeDefs = gql`
        type Post {
            message: String!
            date: String!
        }

        type Channel {
            name: String!
            posts: [Post!]!
        }

        type Query {
            posts(channel: String!): [Post!]
            channels: [String!]!
        }

        type Mutation {
            addPost(channel: String!, message: String!): Post!
            createChannel(name: String!): Channel
        }

        type Subscription {
            newPost(channel: String!): Post
            newChannel: Channel!
        }
`

// Mockup data

const data = [
    { message: 'hello world', date: new Date() }
]

const myChannels = {
    channel1: [{ message: 'hello world', date: new Date() }],
    channel2: [{ message: "I win, you lose", date: new Date() }],
}

const resolvers = {
    Query: {
        posts: (_, { channel }) => {
            var val = myChannels[channel]
            return val
        },
        channels: () => {
            const channels = Object.keys(myChannels)
            console.log(channels)
            return channels
        }
    },
    Mutation: {
        addPost: (_, { channel, message }) => {
            var theChannel = myChannels[channel]

            const post = { message, date: new Date() }
            theChannel.push(post)
            pubsub.publish('NEW_POST', { newPost: post })
            return post
        },
        createChannel: (_, { name }) => {
            // if channel exists return null
            // else create channel
            if (myChannels[name] !== undefined) {
                return null
            }

            myChannels[name] = []
            // newChannel: Channel!
            const channel = { name, posts: [] }
            pubsub.publish('CHANNELS', { newChannel: channel })
            return channel
        }
    },
    Subscription: {
        newPost: {
            subscribe: () => pubsub.asyncIterator('NEW_POST')
        },
        newChannel: {
            subscribe: () => pubsub.asyncIterator('CHANNELS')
        }
    }
}

const server = new ApolloServer({
    typeDefs,
    resolvers
});

// The `listen` method launches a web server.
server.listen().then(({ url }) => {
    console.log(`🚀 Server ready at ${url}`);
});
