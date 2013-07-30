
if process.env.VCAP_SERVICES
  # appfog handling
  env = JSON.parse(process.env.VCAP_SERVICES)
  mongo = env['mongodb-1.8'][0]['credentials']
else
  mongo =
    hostname:"localhost"
    port:27017
    username:""
    password:""
    name:""
    db:"shoppingdb"

#Builds url for localhost and appfog
generate_mongo_url = (obj) ->
  obj.hostname = obj.hostname or 'localhost'
  obj.port = obj.port or 27017
  obj.db = obj.db or 'test'
  if obj.username and obj.password
    return "mongodb://" + obj.username + ":" + obj.password + "@" + obj.hostname + ":" + obj.port
  else
    return "mongodb://" + obj.hostname + ":" + obj.port

# Build url for heroku
mongourl = process.env.MONGOLAB_URI or process.env.MONGOHQ_URL or generate_mongo_url(mongo)

module.exports = mongourl
