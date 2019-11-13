const express = require('express')
const app = express()
app.listen(5568)
const cookieParser = require('cookie-parser')
app.use(cookieParser())
bodyParser = require('body-parser')
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
const { ApolloServer, gql } = require('apollo-server-express')
const messages = [{ name: '', message: '' }]
const fetch = require('node-fetch')
app.get('/users/new', (req, res) => {
  res.send(
    `
    <form action = '/login' method = 'POST'>
    <input type = "text" name = "name" />
    <button type = "submit">Login </button>
    </form>
    `
  )
})
app.post('/login', (req, res) => {
  res.cookie('name', req.body.name)
  res.redirect('/chat')
})
app.get('/chat', (req, res) => {
  if (!req.cookies.name) {
    res.redirect('/users/new')
    return
  }
  res.send(`
    <div>
      <input type='text' id='comBox'/>
      <button id='subBox'> Click Here</button>
      <pre id= 'Message'/>
    </div>
    <script>
      const displayMessage=(arr)=>{
        const finalString = arr.data.messages.reduce((acc, obj)=>{
          acc+="<div>"+obj.name+": "+obj.value+"</div>";
          return acc;
        },'');
        const comMessage = document.getElementById('Message');
        comMessage.innerHTML = finalString;
      };
      const getMessage=()=>{
        fetch('/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: "{ messages { name value }}" 
         })
         })
          .then(res=>res.json())
          .then((msg)=>displayMessage(msg));
      }
      window.setInterval(getMessage, 1000);
      const button = document.getElementById('subBox');
      button.onclick=()=>{
      const comment = document.getElementById('comBox').value;
      fetch('/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          },
          body: JSON.stringify({
          query: \`mutation {
          addMessage(value: "\${comment}"){
            name
            value
            }
          }\`,
          }),
          })
          } 
          </script>
            `
  )
})
const nameMessage = []
const server = new ApolloServer({
  typeDefs: gql(`
  type Message{
     name: String,
     value: String
  }
  type Query{
    messages: [Message]
  }
  type Mutation{
     addMessage(value: String): Message
  }
  `),
  resolvers: {
    Query: {
      messages: () => nameMessage
    },
    Mutation: {
      addMessage: (_, args, context) => {
        nameMessage.push({ name: context.req.cookies.name, value: args.value })
        return { name: 'saum', value: args.value }
      }
    }
  },
  context: ({ req }) => ({ req })
})
server.applyMiddleware({ app })
