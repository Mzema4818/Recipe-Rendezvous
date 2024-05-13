const { NlpManager } = require('node-nlp');

const manager = new NlpManager({ languages: ['en'] });

//add document
manager.addDocument('en','hello','greeting')
manager.addDocument('en','hi','greeting')
manager.addDocument('en','hey you','greeting')
manager.addDocument('en','yo','greeting')
manager.addDocument('en','good morning','greeting')
manager.addDocument('en','good afternoon','greeting')
manager.addDocument('en','good day','greeting')
manager.addDocument('en','goodbye for now','greeting.bye')
manager.addDocument('en','bye bye take care','greeting.bye')
manager.addDocument('en','okay bye see you later','greeting.bye')
manager.addDocument('en','bye for now','greeting.bye')
manager.addDocument('en','i must go','greeting.bye')
manager.addDocument('en','recipe','recipe')
manager.addDocument('en','i want','recipe')
manager.addDocument('en','give me','recipe')

//add answers
manager.addAnswer('en','greeting', "Hey!")
manager.addAnswer('en','greeting', "Hey there")
manager.addAnswer('en','greeting', "Hi")
manager.addAnswer('en','greeting', "Yo whatsup")
manager.addAnswer('en','greeting.bye', "Till next time")
manager.addAnswer('en','greeting.bye', "See you soon!")
manager.addAnswer('en','recipe','Which one do you want')

module.exports = manager;