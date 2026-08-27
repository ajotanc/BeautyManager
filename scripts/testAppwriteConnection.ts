import { Client, Databases } from 'node-appwrite'

const client = new Client()
client
  .setEndpoint('http://localhost:8090/v1')
  .setProject('beauty-manager')

console.log('Appwrite client initialized with endpoint http://localhost:8090/v1')
