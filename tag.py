from google.appengine.ext import db
from post import Post
from stream import Stream

class Tag(db.Model):
    userid = db.StringProperty(default="")
    postkey = db.ReferenceProperty(Post)
    tag_key = db.StringProperty(default="")
    tag_value = db.StringProperty(default="")
    
    def addToStream(self, follower):
        query = Stream.all()
        query.filter("userid = ", follower)
        query.filter("postkey = ", self.postkey)
        result = query.fetch(1000)
        if len(result) == 0:
            stream = Stream()
            stream.userid = follower
            stream.postkey = self.postkey
            stream.post = self.postkey.post #Post.get(self.postkey)
            stream.put()
