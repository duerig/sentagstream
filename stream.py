from google.appengine.ext import db
from post import Post

class Stream(db.Model):
    userid = db.StringProperty(default="")
    postkey = db.ReferenceProperty(Post)
    post = db.TextProperty(default="")
    created = db.DateTimeProperty(auto_now_add=True)
